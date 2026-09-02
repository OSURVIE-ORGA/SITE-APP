import { IsString, Matches } from 'class-validator';

export class LoginDto {
  /** Numéro de connexion (chiffres uniquement) fourni par l'administrateur. */
  @IsString()
  @Matches(/^[0-9]{4,16}$/, {
    message: 'Le numéro doit contenir uniquement des chiffres.',
  })
  loginCode!: string;
}
