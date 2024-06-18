import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { AutoMap } from "@automapper/classes";
import { Role } from "../enums/role.enum";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    @AutoMap()
    password: string;

    @Column("text")
    @AutoMap()
    firstname: string;

    @Column("text")
    @AutoMap()
    lastname: string;

    @Column("text")
    @AutoMap()
    email: string;

    @Column({
        type: "enum",
        enum: Role,
        array: true,
        default: [Role.User],
    })
    public roles: Role[];
}
