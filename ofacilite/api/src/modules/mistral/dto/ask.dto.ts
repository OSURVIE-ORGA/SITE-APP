import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class AskTurnDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;
}

export class AskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  question!: string;

  /** BCP-47-ish language tag ("fr", "en", "ar"…) — the answer is returned in it. */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  /**
   * Prior turns of the same conversation, oldest first, so follow-up questions
   * keep context. The service caps how many are actually forwarded to the model.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AskTurnDto)
  history?: AskTurnDto[];
}
