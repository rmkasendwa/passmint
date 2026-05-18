import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ticket } from '../tickets/ticket.entity';

@Entity({ name: 'events' })
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  venue: string;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'int' })
  priceCents: number;

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets: Ticket[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
