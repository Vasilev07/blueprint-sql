import { Column, Entity, PrimaryGeneratedColumn, OneToOne } from "typeorm";
import { Role } from "../enums/role.enum";
import { Gender } from "../enums/gender.enum";
import { UserProfile } from "./user-profile.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    password: string;

    @Column("text")
    firstname: string;

    @Column("text")
    lastname: string;

    @Column("text")
    email: string;

    @Column({
        type: "enum",
        enum: Gender,
        nullable: true,
    })
    gender: Gender;

    @Column({ type: "timestamp", nullable: true })
    lastOnline: Date;

    @Column({
        type: "enum",
        enum: Role,
        array: true,
        default: [Role.User],
    })
    public roles: Role[];

    @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
    profile: UserProfile;
}
