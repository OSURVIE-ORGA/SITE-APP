import { IsString, MaxLength, MinLength } from 'class-validator';

export class AskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  question!: string;
}
