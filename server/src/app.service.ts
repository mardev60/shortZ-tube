import { Injectable } from '@nestjs/common';
import { AwsService } from './services/aws.service';
import { DeepgramService } from './services/deepgram.service';
import { GptService } from './services/gpt.service';
import { FfmpegService } from './services/ffmpeg.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ShortGenerationResult {
  shorts: {
    id: number;
    duration: string;
    viralScore: number;
    thumbnail: string;
    videoUrl: string;
    startTime: number;
    endTime: number;
  }[];
}

@Injectable()
export class AppService {
  constructor(
    private readonly awsService: AwsService,
    private readonly deepgramService: DeepgramService,
    private readonly gptService: GptService,
    private readonly ffmpegService: FfmpegService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async generateShorts(
    videoFile: Express.Multer.File,
    duration: string,
    userId?: string,
  ): Promise<ShortGenerationResult> {
    // Create a temporary directory in the project folder
    const tempDir = path.join(process.cwd(), 'temp', `shortz-${uuidv4()}`);
    
    try {
      // Ensure the temp directory exists
      fs.mkdirSync(tempDir, { recursive: true });
      console.log(`Created temporary directory in project: ${tempDir}`);
      
      // Step 1: Upload video to AWS S3 with user ID if provided
      const uploadResult = await this.awsService.uploadVideo(videoFile, userId);
      const videoUrl = uploadResult.url;

      // Step 2: Get transcription with timeframes from Deepgram
      console.log('Transcribing video...');
      console.log(videoUrl);
      const transcription = await this.deepgramService.transcribeVideo(videoUrl);

      console.log('Transcription:', transcription);

      // Step 3: Use GPT to analyze transcription and identify viral moments
      const viralMoments = await this.gptService.identifyViralMoments(
        transcription,
        parseInt(duration),
        5, // Number of shorts to generate
      );

      console.log('Viral moments:', viralMoments);

      // Step 4: Use FFMPEG to cut and process the video into shorts
      // Pass the user ID to store shorts in user-specific folders
      // Pass the project temp directory instead of os.tmpdir()
      const shorts = await this.ffmpegService.processShorts(
        videoUrl,
        viralMoments,
        userId,
        tempDir, // Pass the project temp directory
      );

      return { shorts };
    } catch (error) {
      console.error('Error generating shorts:', error);
      throw new Error(`Failed to generate shorts: ${error.message}`);
    } finally {
      // Clean up the temporary directory regardless of success or failure
      if (fs.existsSync(tempDir)) {
        try {
          console.log(`Cleaning up temporary directory: ${tempDir}`);
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error(`Error cleaning up temporary directory: ${cleanupError.message}`);
        }
      }
    }
  }
}
