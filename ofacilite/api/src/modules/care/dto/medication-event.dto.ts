import { IsIn, IsString, Length } from 'class-validator';

export class MedicationEventDto {
  @IsString()
  @Length(1, 200)
  medicationName!: string;

  @IsIn(['taken', 'missed'])
  status!: 'taken' | 'missed';
}
