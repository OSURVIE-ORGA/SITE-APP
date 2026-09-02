import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Message d'un fil de discussion entre une personne et les administrateurs.
 *  Le fil est identifié par `userId` (toujours un compte non-admin). */
@Entity('care_messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  /** true = écrit par un administrateur ; false = écrit par la personne. */
  @Column({ type: 'boolean' })
  fromAdmin!: boolean;

  /** Auteur réel (pour l'audit) : la personne, ou l'admin qui a répondu. */
  @Column({ type: 'uuid', nullable: true })
  authorId!: string | null;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn()
  createdAt!: Date;

  /** Renseigné quand la partie destinataire a lu le message. */
  @Column({ type: 'timestamptz', nullable: true })
  readAt!: Date | null;
}
