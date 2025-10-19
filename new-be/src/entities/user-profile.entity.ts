import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    OneToOne,
    OneToMany,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { UserPhoto } from "./user-photo.entity";

@Entity()
export class UserProfile {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => User, (user) => user.profile, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column("int")
    userId: number;

    @Column({ type: "text", nullable: true })
    bio: string;

    @Column({ type: "text", nullable: true })
    city: string;

    @Column({ type: "text", nullable: true })
    location: string;

    @Column({ type: "text", array: true, default: [] })
    interests: string[];

    @Column({ type: "boolean", default: true })
    appearsInSearches: boolean;

    @OneToMany(() => UserPhoto, (photo) => photo.userProfile, { cascade: true })
    photos: UserPhoto[];

    @Column({ type: "int", nullable: true })
    profilePictureId: number;

    @ManyToOne(() => UserPhoto, { nullable: true })
    @JoinColumn({ name: "profilePictureId" })
    profilePicture: UserPhoto;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

