import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Role } from "../enums/role.enum";
import { UserPhoto } from "./user-photo.entity";

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
        enum: Role,
        array: true,
        default: [Role.User],
    })
    public roles: Role[];

    @OneToMany(() => UserPhoto, (photo) => photo.user, { cascade: true })
    photos: UserPhoto[];
}
