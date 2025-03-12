import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [FileUploadService],
  controllers: [FileUploadController],
  exports: [FileUploadService],
})
export class FileUploadModule {}
