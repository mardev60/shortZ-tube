import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class AwsService {
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadVideo(file: Express.Multer.File, userId?: string): Promise<{ url: string }> {
    try {
      const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
      const fileExtension = file.originalname.split('.').pop();
      
      // Create a path that includes the user ID if provided
      const userFolder = userId ? `users/${userId}` : 'public';
      const fileName = `${userFolder}/videos/${uuidv4()}.${fileExtension}`;

      const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);
      
      // Always use direct S3 URL since bucket policies have been updated
      const region = this.configService.get<string>('AWS_REGION');
      const url = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
      
      return { url };
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new Error(`Failed to upload video to S3: ${error.message}`);
    }
  }

  async uploadShort(
    file: Express.Multer.File, 
    userId: string, 
    shortId: string
  ): Promise<{ url: string }> {
    try {
      const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
      const fileExtension = file.originalname.split('.').pop();
      
      // Create a path that includes the user ID and short ID
      const fileName = `users/${userId}/shorts/${shortId}.${fileExtension}`;

      const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);
      
      // Always use direct S3 URL since bucket policies have been updated
      const region = this.configService.get<string>('AWS_REGION');
      const url = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
      
      return { url };
    } catch (error) {
      console.error('Error uploading short to S3:', error);
      throw new Error(`Failed to upload short to S3: ${error.message}`);
    }
  }
} 