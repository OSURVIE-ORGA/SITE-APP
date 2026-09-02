import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MedicationTime } from './medication-time.entity';

/** Traitement suivi par une personne (poussé depuis l'appli mobile). */
@Entity('care_medications')
export class Medication {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  /** Date de début (YYYY-MM-DD) ou null si non renseignée. */
  @Column({ type: 'date', nullable: true })
  startDate!: string | null;

  @Column({ type: 'int', nullable: true })
  durationDays!: number | null;

  @OneToMany(() => MedicationTime, (time) => time.medication, {
    cascade: true,
    eager: true,
  })
  times!: MedicationTime[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
