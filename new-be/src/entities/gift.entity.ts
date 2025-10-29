import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from "typeorm";
import { User } from "./user.entity";
import { Transaction } from "./transaction.entity";

@Entity()
@Index(["senderId", "createdAt"])
@Index(["receiverId", "createdAt"])
export class Gift {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "senderId" })
    sender: User;

    @Column("int")
    senderId: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "receiverId" })
    receiver: User;

    @Column("int")
    receiverId: number;

    @Column({ type: "varchar", length: 255 })
    giftImageName: string;

    @Column({ type: "decimal", precision: 20, scale: 8 })
    amount: string;

    @Column({ type: "text", nullable: true })
    message: string | null;

    @ManyToOne(() => Transaction, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "transactionId" })
    transaction: Transaction | null;

    @Column({ type: "int", nullable: true })
    transactionId: number | null;

    @CreateDateColumn()
    createdAt: Date;
}

