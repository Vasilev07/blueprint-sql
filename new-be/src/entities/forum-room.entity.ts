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
import { User } from "./user.entity";
import { ForumPost } from "./forum-post.entity";
import { ForumRoomMember } from "./forum-room-member.entity";

@Entity("forum_room")
export class ForumRoom {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { length: 255 })
    name: string;

    @Column("text", { nullable: true })
    description: string | null;

    @Column("varchar", { length: 50, default: "public" })
    visibility: "public" | "private" | "restricted"; // public = anyone, private = invite-only, restricted = join request

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: "createdBy" })
    creator: User | null;

    @Column("int", { nullable: true })
    createdBy: number | null;

    @Column("int", { default: 0 })
    memberCount: number; // Denormalized for quick access

    @Column("int", { nullable: true })
    maxMembers: number | null; // null = unlimited

    @Column("varchar", { length: 20, default: "active" })
    status: "active" | "archived" | "deleted";

    @OneToMany(() => ForumPost, (post) => post.room)
    posts: ForumPost[];

    @OneToMany(() => ForumRoomMember, (member) => member.room)
    members: ForumRoomMember[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
