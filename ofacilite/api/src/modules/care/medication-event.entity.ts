import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type MedicationEventStatus = 'taken' | 'missed';

/** Réponse de la personne au rappel « Avez-vous pris votre médicament ? ». */
@Entity('care_medication_events')
export class MedicationEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 200 })
  medicationName!: string;

  @Column({ type: 'varchar', length: 16 })
  status!: MedicationEventStatus;

  @CreateDateColumn()
  reportedAt!: Date;
}
