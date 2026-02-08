import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { ForumRoom } from "./forum-room.entity";
import { User } from "./user.entity";
import { ForumComment } from "./forum-comment.entity";

@Entity("forum_post")
export class ForumPost {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ForumRoom, (room) => room.posts, { onDelete: "CASCADE" })
    @JoinColumn({ name: "roomId" })
    room: ForumRoom;

    @Column("int")
    roomId: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "authorId" })
    author: User;

    @Column("int")
    authorId: number;

    @Column("varchar", { length: 500 })
    title: string;

    @Column("text")
    content: string;

    @Column("varchar", { length: 20, default: "text" })
    type: "text" | "image" | "file" | "poll";

    @Column("int", { default: 0 })
    commentCount: number; // Denormalized count of top-level comments

    @Column("int", { default: 0 })
    likeCount: number; // For future likes feature

    @Column("boolean", { default: false })
    isPinned: boolean; // Pinned posts appear at top

    @Column("boolean", { default: false })
    isLocked: boolean; // Locked posts cannot be commented on

    @Column("varchar", { length: 20, default: "active" })
    status: "active" | "deleted" | "hidden"; // soft delete, hide from non-admins

    @OneToMany(() => ForumComment, (comment) => comment.post)
    comments: ForumComment[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
