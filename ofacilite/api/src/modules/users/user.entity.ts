import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'admin' | 'user';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Identifiant de connexion : numéro court unique, saisi tel quel dans l'app. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 16 })
  loginCode!: string;

  @Column({ type: 'varchar', length: 16, default: 'user' })
  role!: UserRole;

  @Column({ type: 'varchar', length: 80 })
  firstName!: string;

  @Column({ type: 'varchar', length: 80 })
  lastName!: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone!: string | null;

  /** Date de naissance ISO (YYYY-MM-DD) ; l'âge est calculé à l'affichage. */
  @Column({ type: 'date', nullable: true })
  birthDate!: string | null;

  @Column({ type: 'varchar', length: 8, default: 'fr' })
  language!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'boolean', default: false })
  disabled!: boolean;

  /** Dernière connexion réussie (POST /auth/login). */
  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  /** Dernier appel authentifié — indique si le compte est encore actif. */
  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
