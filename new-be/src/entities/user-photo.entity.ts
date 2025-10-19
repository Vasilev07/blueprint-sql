import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
} from "typeorm";
import { UserProfile } from "./user-profile.entity";

@Entity()
export class UserPhoto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({
        type: "bytea",
    })
    data: Uint8Array;

    @ManyToOne(() => UserProfile, (profile) => profile.photos, {
        onDelete: "CASCADE",
    })
    userProfile: UserProfile;

    @Column("int")
    userProfileId: number;

    @Column({ name: "likes_count", type: "int", default: 0 })
    likesCount: number;

    @CreateDateColumn()
    uploadedAt: Date;
}
