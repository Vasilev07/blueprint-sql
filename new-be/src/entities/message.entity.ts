import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    subject: string;

    @Column("text")
    content: string;

    @Column("text")
    from: string;

    @Column("simple-array")
    to: string[];

    @Column("simple-array", { nullable: true })
    cc: string[];

    @Column("simple-array", { nullable: true })
    bcc: string[];

    @Column("simple-array", { nullable: true })
    attachments: string[];

    @Column("boolean", { default: false })
    isRead: boolean;

    @Column("boolean", { default: false })
    isArchived: boolean;

    @Column("boolean", { default: false })
    isDeleted: boolean;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column("int")
    userId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
