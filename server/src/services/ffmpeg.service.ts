import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ViralMoment } from './gpt.service';
import { AwsService } from './aws.service';

interface ProcessedShort {
  id: number;
  duration: string;
  viralScore: number;
  thumbnail: string;
  videoUrl: string;
  startTime: number;
  endTime: number;
  reason?: string;
  metadata?: {
    processingTime?: string;
    awsRegion?: string;
    format?: string;
    resolution?: string;
    fileSize?: number;
    codec?: string;
  };
}

@Injectable()
export class FfmpegService {
  // Durée minimale d'un segment en secondes
  private readonly MIN_SEGMENT_DURATION = 5;
  // Durée maximale par défaut d'un segment en secondes
  private readonly DEFAULT_MAX_SEGMENT_DURATION = 30;

  constructor(
    private configService: ConfigService,
    private awsService: AwsService,
  ) {
    const ffmpegPath = this.configService.get<string>('FFMPEG_PATH');
    if (ffmpegPath) {
      console.log(`Using custom FFMPEG path: ${ffmpegPath}`);
      ffmpeg.setFfmpegPath(ffmpegPath);
    } else {
      console.log('Using system FFMPEG path');
    }
  }

  async processShorts(
    videoUrl: string,
    viralMoments: ViralMoment[],
    userId?: string,
    tempDir?: string,
  ): Promise<ProcessedShort[]> {
    try {
      console.log(`Starting to process shorts from video URL: ${videoUrl}`);
      console.log(`Number of viral moments to process: ${viralMoments.length}`);
      
      // Vérifier et ajuster les durées des segments
      const adjustedMoments = this.adjustSegmentDurations(viralMoments);
      console.log('Adjusted viral moments:', adjustedMoments);
      
      // Use provided tempDir or create one if not provided
      let localTempDir = tempDir;
      let shouldCleanupTempDir = false;
      
      if (!localTempDir) {
        localTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shortz-'));
        shouldCleanupTempDir = true;
        console.log(`Created temporary directory: ${localTempDir}`);
      } else {
        console.log(`Using provided temporary directory: ${localTempDir}`);
      }
      
      const videoPath = path.join(localTempDir, `source-${uuidv4()}.mp4`);
      console.log(`Downloading video to: ${videoPath}`);
      
      await this.downloadFile(videoUrl, videoPath);
      
      // Vérifier que le fichier existe et a une taille
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Downloaded video file does not exist: ${videoPath}`);
      }
      
      const stats = fs.statSync(videoPath);
      if (stats.size === 0) {
        throw new Error(`Downloaded video file is empty: ${videoPath}`);
      }
      
      console.log(`Video downloaded successfully. File size: ${stats.size} bytes`);
      
      // Vérifier le format de la vidéo
      const videoMetadata = await this.probeVideo(videoPath);
      
      // Sort viral moments by their viral score (highest first)
      const sortedMoments = [...adjustedMoments].sort(
        (a, b) => b.viralScore - a.viralScore
      );
      
      // Process shorts sequentially to avoid overwhelming the system
      const shorts = [];
      for (let i = 0; i < sortedMoments.length; i++) {
        console.log(`Processing short ${i + 1}/${sortedMoments.length}`);
        try {
          const short = await this.processShort(
            videoPath, 
            sortedMoments[i], 
            i + 1, 
            localTempDir, 
            userId
          );
          shorts.push(short);
        } catch (error) {
          console.error(`Error processing short ${i + 1}:`, error);
          console.log(`Skipping short ${i + 1} and continuing with the next one`);
          // Continue avec le prochain segment au lieu d'échouer complètement
        }
      }
      
      // Clean up temporary directory only if we created it
      if (shouldCleanupTempDir) {
        console.log(`Cleaning up temporary directory: ${localTempDir}`);
        fs.rmSync(localTempDir, { recursive: true, force: true });
      }
      
      console.log(`Successfully processed ${shorts.length} shorts`);
      
      // Ajouter des informations supplémentaires sur le traitement
      const result = shorts.map(short => ({
        ...short,
        success: true,
        processingTime: new Date().toISOString(),
        awsRegion: this.configService.get<string>('AWS_REGION'),
        format: 'vertical',
        resolution: '1080x1920',
      }));
      
      return result;
    } catch (error) {
      console.error('Error processing shorts with FFMPEG:', error);
      throw new Error(`Failed to process shorts: ${error.message}`);
    }
  }

  /**
   * Ajuste les durées des segments pour s'assurer qu'ils ont une durée minimale
   */
  private adjustSegmentDurations(moments: ViralMoment[]): ViralMoment[] {
    return moments.map(moment => {
      const duration = moment.endTime - moment.startTime;
      
      // Si la durée est inférieure au minimum, étendre le segment
      if (duration < this.MIN_SEGMENT_DURATION) {
        console.log(`Segment too short (${duration}s), extending to ${this.MIN_SEGMENT_DURATION}s`);
        
        // Calculer combien ajouter de chaque côté
        const additionalTime = this.MIN_SEGMENT_DURATION - duration;
        const addToStart = additionalTime / 2;
        const addToEnd = additionalTime / 2;
        
        return {
          ...moment,
          startTime: Math.max(0, moment.startTime - addToStart),
          endTime: moment.endTime + addToEnd,
        };
      }
      
      // Si la durée est supérieure au maximum par défaut, réduire le segment
      // Nous ne faisons pas cette vérification car les segments sont déjà ajustés par le service GPT
      // et nous voulons respecter la durée demandée par l'utilisateur
      
      return moment;
    });
  }

  private async probeVideo(videoPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error('Error probing video:', err);
          reject(new Error(`Failed to probe video: ${err.message}`));
          return;
        }
        
        console.log('Video metadata:', {
          format: metadata.format.format_name,
          duration: metadata.format.duration,
          size: metadata.format.size,
          bitrate: metadata.format.bit_rate,
        });
        
        if (metadata.streams && metadata.streams.length > 0) {
          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          if (videoStream) {
            console.log('Video stream:', {
              codec: videoStream.codec_name,
              width: videoStream.width,
              height: videoStream.height,
              frameRate: videoStream.r_frame_rate,
            });
          }
        }
        
        resolve(metadata);
      });
    });
  }

  private async processShort(
    videoPath: string,
    moment: ViralMoment,
    id: number,
    tempDir: string,
    userId?: string,
  ): Promise<ProcessedShort> {
    // Generate a unique ID for this short
    const uniqueId = crypto.randomUUID();
    const shortId = `short-${id}-${uniqueId}`;
    const outputVideoPath = path.join(tempDir, `${shortId}.mp4`);
    const outputThumbnailPath = path.join(tempDir, `${shortId}.jpg`);
    
    // Calculate duration
    const segmentDuration = moment.endTime - moment.startTime;
    console.log(`Processing segment from ${moment.startTime}s to ${moment.endTime}s (duration: ${segmentDuration}s)`);
    
    // Cut and transform the video to vertical format (9:16 aspect ratio)
    await this.cutAndTransformVideo(
      videoPath,
      outputVideoPath,
      moment.startTime,
      segmentDuration,
    );
    
    // Vérifier que le fichier de sortie existe et a une taille
    if (!fs.existsSync(outputVideoPath)) {
      throw new Error(`Output video file does not exist: ${outputVideoPath}`);
    }
    
    const stats = fs.statSync(outputVideoPath);
    if (stats.size === 0) {
      throw new Error(`Output video file is empty: ${outputVideoPath}`);
    }
    
    console.log(`Short video created successfully. File size: ${stats.size} bytes`);
    
    // Obtenir les métadonnées du fichier vidéo
    const videoMetadata = await this.probeVideo(outputVideoPath);
    const videoStream = videoMetadata.streams?.find(s => s.codec_type === 'video');
    
    // Generate thumbnail from the processed video
    await this.generateThumbnail(outputVideoPath, outputThumbnailPath, 1);
    
    // Prepare files for upload
    const videoFile = {
      buffer: fs.readFileSync(outputVideoPath),
      mimetype: 'video/mp4',
      originalname: `${shortId}.mp4`,
    } as Express.Multer.File;
    
    const thumbnailFile = {
      buffer: fs.readFileSync(outputThumbnailPath),
      mimetype: 'image/jpeg',
      originalname: `${shortId}.jpg`,
    } as Express.Multer.File;
    
    // Upload files to S3
    let videoUploadResult, thumbnailUploadResult;
    
    if (userId) {
      videoUploadResult = await this.awsService.uploadShort(videoFile, userId, `${shortId}-video`);
      thumbnailUploadResult = await this.awsService.uploadShort(thumbnailFile, userId, `${shortId}-thumbnail`);
    } else {
      videoUploadResult = await this.awsService.uploadVideo(videoFile);
      thumbnailUploadResult = await this.awsService.uploadVideo(thumbnailFile);
    }
    
    return {
      id,
      duration: `${Math.round(segmentDuration)}s`,
      viralScore: moment.viralScore,
      thumbnail: thumbnailUploadResult.url,
      videoUrl: videoUploadResult.url,
      startTime: moment.startTime,
      endTime: moment.endTime,
      reason: moment.reason,
      metadata: {
        processingTime: new Date().toISOString(),
        awsRegion: this.configService.get<string>('AWS_REGION'),
        format: 'vertical',
        resolution: '1080x1920',
        fileSize: stats.size,
        codec: videoStream?.codec_name || 'h264',
      }
    };
  }

  private async cutAndTransformVideo(
    inputPath: string,
    outputPath: string,
    startTime: number,
    duration: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Starting video transformation: ${inputPath} -> ${outputPath}`);
      
      // Créer une commande FFMPEG avec les filtres pour format vertical
      const command = ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        // Appliquer les filtres pour le format vertical (9:16)
        .videoFilters([
          // Crop to 9:16 aspect ratio from the center
          "crop=ih*(9/16):ih:(iw-ih*(9/16))/2:0",
          // Scale to 1080x1920 (standard vertical video resolution)
          "scale=1080:1920",
        ])
        .outputOptions([
          '-c:v libx264',     // Utiliser le codec H.264
          '-preset fast',      // Préréglage de compression rapide
          '-crf 23',           // Qualité raisonnable
          '-c:a aac',          // Codec audio AAC
          '-b:a 128k',         // Bitrate audio 128k
          '-pix_fmt yuv420p',  // Format de pixel compatible
        ])
        .output(outputPath);
      
      // Ajouter des logs pour le debugging
      command.on('start', (commandLine) => {
        console.log('FFMPEG command:', commandLine);
      });
      
      command.on('progress', (progress) => {
        console.log(`Processing: ${progress.percent ? progress.percent.toFixed(1) : '?'}% done`);
      });
      
      command.on('end', () => {
        console.log('Video transformation completed successfully');
        resolve();
      });
      
      command.on('error', (err) => {
        console.error('Error during video transformation:', err);
        reject(err);
      });
      
      // Exécuter la commande
      command.run();
    });
  }

  private async generateThumbnail(
    videoPath: string,
    outputPath: string,
    timeOffset: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Generating thumbnail: ${videoPath} -> ${outputPath}`);
      
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timeOffset],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '1080x1920', // Taille correspondant au format vertical
        })
        .on('end', () => {
          console.log('Thumbnail generation completed successfully');
          resolve();
        })
        .on('error', (err) => {
          console.error('Error generating thumbnail:', err);
          reject(err);
        });
    });
  }

  private async downloadFile(url: string, destination: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Downloading file from ${url} to ${destination}`);
      
      const file = fs.createWriteStream(destination);
      
      https.get(url, (response) => {
        // Vérifier le code de statut HTTP
        if (response.statusCode !== 200) {
          fs.unlink(destination, () => {});
          reject(new Error(`Failed to download file: HTTP status code ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        
        let downloadedBytes = 0;
        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          console.log(`Downloaded ${downloadedBytes} bytes`);
        });
        
        file.on('finish', () => {
          file.close();
          console.log(`File download completed: ${destination}`);
          resolve();
        });
        
        file.on('error', (err) => {
          fs.unlink(destination, () => {});
          console.error('Error writing file:', err);
          reject(err);
        });
      }).on('error', (err) => {
        fs.unlink(destination, () => {});
        console.error('Error downloading file:', err);
        reject(err);
      });
    });
  }
} 