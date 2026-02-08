import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
} from "typeorm";
import { ForumRoom } from "./forum-room.entity";
import { User } from "./user.entity";

@Entity("forum_room_member")
@Unique(["roomId", "userId", "status"]) // User can have multiple memberships if status differs
export class ForumRoomMember {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ForumRoom, (room) => room.members, { onDelete: "CASCADE" })
    @JoinColumn({ name: "roomId" })
    room: ForumRoom;

    @Column("int")
    roomId: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column("int")
    userId: number;

    @Column("varchar", { length: 20, default: "member" })
    role: "admin" | "moderator" | "member"; // Permissions: admin > moderator > member

    @Column("varchar", { length: 20, default: "joined" })
    status: "joined" | "left" | "banned"; // Track if user left or was banned

    @Column("int", { default: 0 })
    unreadCount: number; // Unread posts/comments in this room

    @CreateDateColumn()
    joinedAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
