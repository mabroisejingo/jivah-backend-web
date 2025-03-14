import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('File Uploads')
@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('single')
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data') // Specifies the content type is multipart/form-data
  @ApiBody({
    description: 'The file to be uploaded',
    type: 'multipart/form-data',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'File uploaded successfully',
    schema: {
      example: {
        url: 'https://example.com/file-url',
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const url = await this.fileUploadService.uploadFile(file);
    return { url };
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data') // Specifies the content type is multipart/form-data
  @ApiBody({
    description: 'The files to be uploaded',
    type: 'multipart/form-data',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Files uploaded successfully',
    schema: {
      example: {
        urls: [
          'https://example.com/file-url1',
          'https://example.com/file-url2',
        ],
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
    const uploadPromises = files.map((file) =>
      this.fileUploadService.uploadFile(file),
    );
    const urls = await Promise.all(uploadPromises);
    return { urls };
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a file by URL' })
  @ApiBody({
    description: 'The URL of the file to delete',
    type: String,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    schema: {
      example: {
        message: 'File deleted successfully',
      },
    },
  })
  async deleteFile(@Body('url') url: string) {
    await this.fileUploadService.deleteFile(url);
    return { message: 'File deleted successfully' };
  }
}
