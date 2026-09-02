import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class MedicationTimeDto {
  @IsInt()
  @Min(0)
  @Max(23)
  hour!: number;

  @IsInt()
  @Min(0)
  @Max(59)
  minute!: number;
}

class MedicationInputDto {
  @IsString()
  @Length(1, 200)
  name!: string;

  @IsOptional()
  @IsISO8601()
  startDate?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  durationDays?: number | null;

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => MedicationTimeDto)
  times!: MedicationTimeDto[];
}

/** Instantané complet des traitements de la personne (remplace tout). */
export class PutMedicationsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => MedicationInputDto)
  medications!: MedicationInputDto[];
}
