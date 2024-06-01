import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { AutoMap } from "@automapper/classes";

@Entity()
export class Administrator {
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
}
