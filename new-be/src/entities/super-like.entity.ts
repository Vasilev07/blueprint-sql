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

@Entity("super_like")
@Index(["senderId", "createdAt"])
@Index(["receiverId", "createdAt"])
export class SuperLike {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.sentSuperLikes, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "senderId" })
    sender: User;

    @Column("int")
    senderId: number;

    @ManyToOne(() => User, (user) => user.receivedSuperLikes, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "receiverId" })
    receiver: User;

    @Column("int")
    receiverId: number;

    @CreateDateColumn()
    createdAt: Date;
}
