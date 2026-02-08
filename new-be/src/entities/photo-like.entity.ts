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
import { UserPhoto } from "./user-photo.entity";

@Entity("photo_likes")
@Index(["userId", "photoId"], { unique: true })
@Index(["photoId"])
export class PhotoLike {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "user_id" })
    userId: number;

    @Column({ name: "photo_id" })
    photoId: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @ManyToOne(() => UserPhoto, { onDelete: "CASCADE" })
    @JoinColumn({ name: "photo_id" })
    photo: UserPhoto;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;
}
