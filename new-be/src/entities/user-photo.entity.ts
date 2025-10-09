import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";
import { User } from "./user.entity";

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

    @ManyToOne(() => User, (user) => user.photos, { onDelete: "CASCADE" })
    user: User;

    @Column("int")
    userId: number;

    @CreateDateColumn()
    uploadedAt: Date;
}

