import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    OneToOne,
    OneToMany,
    CreateDateColumn,
} from "typeorm";
import { Role } from "../enums/role.enum";
import { Gender } from "../enums/gender.enum";
import { UserProfile } from "./user-profile.entity";
import { Wallet } from "./wallet.entity";
import { Gift } from "./gift.entity";
import { SuperLike } from "./super-like.entity";

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

    @CreateDateColumn()
    createdAt: Date;

    @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
    profile: UserProfile;

    @OneToOne(() => Wallet, (wallet) => wallet.user)
    wallet: Wallet;

    @OneToMany(() => Gift, (gift) => gift.sender)
    sentGifts: Gift[];

    @OneToMany(() => Gift, (gift) => gift.receiver)
    receivedGifts: Gift[];

    @OneToMany(() => SuperLike, (superLike) => superLike.sender)
    sentSuperLikes: SuperLike[];

    @OneToMany(() => SuperLike, (superLike) => superLike.receiver)
    receivedSuperLikes: SuperLike[];
}
