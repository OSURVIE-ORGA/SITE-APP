import { IsString, IsUrl, MaxLength } from 'class-validator';

export class AnalyzeImageUrlDto {
  @IsString()
  @MaxLength(2048)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url!: string;
}
