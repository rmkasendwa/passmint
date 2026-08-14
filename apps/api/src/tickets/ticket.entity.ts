import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { prefixedId } from '../common/prefixed-id';
import { Event } from '../events/event.entity';
import { User } from '../users/user.entity';
import { TicketStatus } from './ticket-status.enum';

@Entity({ name: 'tickets' })
export class Ticket {
  @PrimaryColumn()
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

  @ManyToOne(() => Event, (event) => event.tickets, {
    eager: true,
    onDelete: 'CASCADE',
  })
  event: Event;

  @ManyToOne(() => User, (user) => user.tickets, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  owner: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= prefixedId('tkt');
  }
}
