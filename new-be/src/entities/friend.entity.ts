import { Column, Entity, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn } from "typeorm";
import { User } from "./user.entity";

export enum FriendshipStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    BLOCKED = "blocked",
}

@Entity()
export class UserFriend {
    @PrimaryColumn("int")
    userId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "userId" })
    user: User;

    @PrimaryColumn("int")
    friendId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "friendId" })
    friend: User;

    @Column({
        type: "varchar",
        enum: FriendshipStatus,
        default: FriendshipStatus.PENDING,
    })
    status: FriendshipStatus;

    @CreateDateColumn()
    createdAt: Date;
}
