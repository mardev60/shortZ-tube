import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // Create temp directory if it doesn't exist
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    console.log(`Creating temp directory: ${tempDir}`);
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for development
  app.enableCors({
    origin: ['http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });
  
  // Get port from config
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  
  // Register shutdown hook to clean up temp directory
  app.enableShutdownHooks();
  process.on('SIGINT', () => {
    console.log('Application shutting down, cleaning up temp directory...');
    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          if (fs.statSync(filePath).isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
        }
        console.log('Temp directory cleaned up successfully');
      }
    } catch (error) {
      console.error('Error cleaning up temp directory:', error);
    }
  });
  
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
