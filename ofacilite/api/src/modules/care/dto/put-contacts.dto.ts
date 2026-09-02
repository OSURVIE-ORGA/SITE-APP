import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

class ContactInputDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsString()
  @Length(1, 40)
  phone!: string;
}

/** Instantané complet du carnet de contacts de la personne (remplace tout). */
export class PutContactsDto {
  @IsArray()
  @ArrayMaxSize(300)
  @ValidateNested({ each: true })
  @Type(() => ContactInputDto)
  contacts!: ContactInputDto[];
}
