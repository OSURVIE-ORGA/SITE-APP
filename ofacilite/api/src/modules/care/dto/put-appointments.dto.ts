import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class AppointmentInputDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  doctorName?: string;

  @IsISO8601()
  scheduledAt!: string;
}

/** Instantané complet des rendez-vous de la personne (remplace tout). */
export class PutAppointmentsDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => AppointmentInputDto)
  appointments!: AppointmentInputDto[];
}
