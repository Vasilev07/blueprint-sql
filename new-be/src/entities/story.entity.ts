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

@Entity("stories")
@Index(["userId", "createdAt"])
@Index(["expiresAt"])
export class Story {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "user_id" })
    userId: number;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column({ name: "file_path", type: "varchar", length: 500 })
    filePath: string;

    @Column({ name: "original_filename", type: "varchar", length: 255 })
    originalFilename: string;

    @Column({ name: "file_size", type: "bigint" })
    fileSize: number;

    @Column({ name: "duration", type: "float", nullable: true })
    duration?: number;

    @Column({ name: "mime_type", type: "varchar", length: 100 })
    mimeType: string;

    @Column({ name: "width", type: "int", nullable: true })
    width?: number;

    @Column({ name: "height", type: "int", nullable: true })
    height?: number;

    @Column({
        name: "thumbnail_path",
        type: "varchar",
        length: 500,
        nullable: true,
    })
    thumbnailPath?: string;

    @Column({ name: "views", type: "int", default: 0 })
    views: number;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @Column({ name: "expires_at", type: "timestamp" })
    expiresAt: Date;

    @Column({ name: "is_processed", type: "boolean", default: false })
    isProcessed: boolean;
}
