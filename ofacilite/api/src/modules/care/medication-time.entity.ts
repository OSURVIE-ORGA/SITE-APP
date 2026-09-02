import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Medication } from './medication.entity';

/** Une prise quotidienne (heure:minute) rattachée à un traitement. */
@Entity('care_medication_times')
export class MedicationTime {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @ManyToOne(() => Medication, (medication) => medication.times, {
    onDelete: 'CASCADE',
  })
  medication!: Medication;

  @Column({ type: 'int' })
  hour!: number;

  @Column({ type: 'int' })
  minute!: number;
}
