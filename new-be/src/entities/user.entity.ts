import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "../enums/role.enum";

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
}
