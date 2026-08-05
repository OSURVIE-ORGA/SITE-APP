import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, promises as fsPromises } from 'fs';
import type { Request } from 'express';
import { MistralService } from './mistral.service';

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Controller('mistral')
export class MistralController {
  constructor(private readonly mistral: MistralService) {}

  @Post('image-url')
  async analyzeImageUrl(@Body('url') url: string) {
    return this.mistral.contactFromImage(url);
  }

  @Post('scan-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname) || '.jpg';
          callback(null, `contact-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async scanPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException("Aucun fichier image n'a été fourni.");
    }

    const fileBuffer = await fsPromises.readFile(file.path);
    const extractedData = await this.mistral.contactFromBuffer(
      fileBuffer,
      file.mimetype || 'image/jpeg',
    );

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const photoUrl = `${protocol}://${host}/uploads/${file.filename}`;

    return {
      success: true,
      name: extractedData?.name ?? null,
      phone: extractedData?.phone ?? null,
      photoUrl,
      filename: file.filename,
    };
  }

  @Post('scan-medication')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname) || '.jpg';
          callback(null, `medication-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async scanMedication(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException("Aucun fichier image n'a été fourni.");
    }

    const fileBuffer = await fsPromises.readFile(file.path);
    const extractedData = await this.mistral.medicationFromBuffer(
      fileBuffer,
      file.mimetype || 'image/jpeg',
    );

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const photoUrl = `${protocol}://${host}/uploads/${file.filename}`;

    return {
      success: true,
      name: extractedData?.name ?? null,
      frequency: extractedData?.frequency ?? null,
      durationDays: extractedData?.durationDays ?? null,
      suggestedHours: extractedData?.suggestedHours ?? null,
      photoUrl,
      filename: file.filename,
    };
  }
}



