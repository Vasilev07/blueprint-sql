import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    username: string;

    @Column("text")
    password: string;

    @Column("text")
    confirmationPassword: string;

    @Column("text")
    firstname: string;

    @Column("text")
    lastname: string;

    @Column("text")
    email: string;
    
}
