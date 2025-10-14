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

@Entity("profile_views")
@Index(["userId", "viewedAt"])
@Index(["viewerId", "viewedAt"])
export class ProfileView {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "user_id", type: "int" })
    userId: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column({ name: "viewer_id", type: "int" })
    viewerId: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "viewer_id" })
    viewer: User;

    @Column({ name: "is_friend", type: "boolean", default: false })
    isFriend: boolean;

    @CreateDateColumn({ name: "viewed_at" })
    viewedAt: Date;
}
