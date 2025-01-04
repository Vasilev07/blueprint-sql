import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column("text")
    name: string;

    @Column()
    description: string;

    @ManyToOne(() => Category, (category) => category.children)
    parent: Category;

    @OneToMany(() => Category, (category) => category.parent)
    children: Category[];
}
