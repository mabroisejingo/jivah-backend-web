import { Controller, Post, Delete, UseInterceptors, UploadedFile, UploadedFiles, Body, ParseArrayPipe } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';

@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const url = await this.fileUploadService.uploadFile(file);
    return { url };
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
    const uploadPromises = files.map(file => this.fileUploadService.uploadFile(file));
    const urls = await Promise.all(uploadPromises);
    return { urls };
  }

  @Delete()
  async deleteFile(@Body('url') url: string) {
    await this.fileUploadService.deleteFile(url);
    return { message: 'File deleted successfully' };
  }
}