import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { prefixedId } from "../common/prefixed-id";
import { Ticket } from "../tickets/ticket.entity";
import { User } from "../users/user.entity";

@Entity({ name: "events" })
export class Event {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ type: "text" })
  description: string;

  @Column()
  venue: string;

  @Column({ type: "text", nullable: true })
  mapLocation?: string | null;

  @Column({ type: "timestamptz" })
  startsAt: Date;

  @Column({ type: "int" })
  capacity: number;

  @Column({ type: "int" })
  priceCents: number;

  @Column({ type: "text", nullable: true })
  thumbnailUrl?: string | null;

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets: Ticket[];

  @ManyToOne(() => User, (user) => user.events, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn()
  owner: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= prefixedId("evt");
  }
}
