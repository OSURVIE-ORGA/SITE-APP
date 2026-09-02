import { randomUUID } from 'crypto';
import { join } from 'path';
import { promises as fs } from 'fs';
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Query,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { assertPublicHttpUrl } from '../../common/net/ssrf.util';
import {
  ALLOWED_DOC_MIME,
  ALLOWED_IMAGE_MIME,
  extensionForMime,
  sniffDocMime,
  sniffImageMime,
} from '../../common/upload/image-file.util';
import { UPLOAD_DIR } from '../uploads/uploads-reaper.service';
import { AnalyzeImageUrlDto } from './dto/analyze-image-url.dto';
import { AskDto } from './dto/ask.dto';
import { ParseContactDto } from './dto/parse-contact.dto';
import { MistralService } from './mistral.service';

const MAX_UPLOAD_BYTES = (Number(process.env.MAX_UPLOAD_MB) || 8) * 1024 * 1024;

const imageUpload = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { files: 1, fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if ((ALLOWED_IMAGE_MIME as readonly string[]).includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new UnsupportedMediaTypeException('Only JPEG/PNG/WebP/HEIC images'),
        false,
      );
    }
  },
});

const documentUpload = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { files: 1, fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if ((ALLOWED_DOC_MIME as readonly string[]).includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new UnsupportedMediaTypeException('Only images or PDF'), false);
    }
  },
});

@Controller('mistral')
export class MistralController {
  constructor(
    private readonly mistral: MistralService,
    private readonly config: ConfigService,
  ) {}

  @Post('image-url')
  async analyzeImageUrl(@Body() dto: AnalyzeImageUrlDto) {
    assertPublicHttpUrl(dto.url);
    return this.mistral.contactFromImage(dto.url);
  }

  @Post('ask')
  async ask(@Body() dto: AskDto) {
    return this.mistral.ask(dto.question, dto.language, dto.history);
  }

  @Post('parse-contact')
  async parseContact(@Body() dto: ParseContactDto) {
    const extracted = await this.mistral.contactFromText(dto.text);
    return {
      success: true,
      name: extracted.name,
      phone: extracted.phone,
    };
  }

  @Post('read-document')
  @UseInterceptors(documentUpload)
  async readDocument(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('language') language?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException("Aucun fichier n'a été fourni.");
    }
    const mime = sniffDocMime(file.buffer);
    if (!mime) {
      throw new UnsupportedMediaTypeException(
        "Le fichier n'est ni une image ni un PDF.",
      );
    }
    const dataUrl = `data:${mime};base64,${file.buffer.toString('base64')}`;
    return this.mistral.readDocument(dataUrl, mime, language);
  }

  @Post('scan-photo')
  @UseInterceptors(imageUpload)
  async scanPhoto(@UploadedFile() file?: Express.Multer.File) {
    const { buffer, mime, photoUrl, filename } = await this.persistImage(file);
    const extracted = await this.mistral.contactFromBuffer(buffer, mime);
    return {
      success: true,
      name: extracted?.name ?? null,
      phone: extracted?.phone ?? null,
      photoUrl,
      filename,
    };
  }

  @Post('scan-medication')
  @UseInterceptors(imageUpload)
  async scanMedication(@UploadedFile() file?: Express.Multer.File) {
    const { buffer, mime, photoUrl, filename } = await this.persistImage(file);
    const extracted = await this.mistral.medicationFromBuffer(buffer, mime);
    return {
      success: true,
      name: extracted?.name ?? null,
      frequency: extracted?.frequency ?? null,
      durationDays: extracted?.durationDays ?? null,
      suggestedHours: extracted?.suggestedHours ?? null,
      photoUrl,
      filename,
    };
  }

  private async persistImage(file?: Express.Multer.File): Promise<{
    buffer: Buffer;
    mime: string;
    photoUrl: string;
    filename: string;
  }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException("Aucun fichier image n'a été fourni.");
    }

    const mime = sniffImageMime(file.buffer);
    if (!mime) {
      throw new UnsupportedMediaTypeException(
        "Le fichier n'est pas une image reconnue (JPEG, PNG, WebP, HEIC).",
      );
    }

    const filename = `scan-${randomUUID()}${extensionForMime(mime)}`;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(join(UPLOAD_DIR, filename), file.buffer);

    const base = this.config.getOrThrow<string>('APP_URL').replace(/\/$/, '');
    return {
      buffer: file.buffer,
      mime,
      photoUrl: `${base}/uploads/${filename}`,
      filename,
    };
  }
}
