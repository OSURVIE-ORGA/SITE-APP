import { IsString, MaxLength, MinLength } from 'class-validator';

export class ParseContactDto {
  /** Raw speech-to-text transcript, e.g. "Marie Dupont zéro six douze trente-quatre". */
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;
}
