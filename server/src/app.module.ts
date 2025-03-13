import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AwsService } from './services/aws.service';
import { DeepgramService } from './services/deepgram.service';
import { GptService } from './services/gpt.service';
import { FfmpegService } from './services/ffmpeg.service';
import { PromptService } from './services/prompt.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MulterModule.register({
      limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // 2GB max file size
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AwsService,
    DeepgramService,
    GptService,
    FfmpegService,
    PromptService,
  ],
})
export class AppModule {}
