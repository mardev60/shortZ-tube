import { Controller, Post, UploadedFile, Body, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService, ShortGenerationResult } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('generate-shorts')
  @UseInterceptors(FileInterceptor('video'))
  async generateShorts(
    @UploadedFile() file: Express.Multer.File,
    @Body('duration') duration: string,
    @Body('userId') userId?: string,
  ): Promise<ShortGenerationResult> {
    return this.appService.generateShorts(file, duration, userId);
  }
}
