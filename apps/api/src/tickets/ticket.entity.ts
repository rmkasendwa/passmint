import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from '../events/event.entity';
import { TicketStatus } from './ticket-status.enum';

@Entity({ name: 'tickets' })
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  code: string;

  @Column()
  buyerName: string;

  @Column()
  buyerEmail: string;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.Issued })
  status: TicketStatus;

  @Column({ type: 'timestamptz', nullable: true })
  checkedInAt: Date | null;

  @ManyToOne(() => Event, (event) => event.tickets, { eager: true, onDelete: 'CASCADE' })
  event: Event;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
