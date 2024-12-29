import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import { AutoMap } from "@automapper/classes";

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    @AutoMap()
    id?: number;

    @Column("text")
    @AutoMap()
    name: string;

    @Column()
    @AutoMap()
    description: string;

    @AutoMap(() => [Category])
    @ManyToOne(() => Category, (category) => category.children)
    parent: Category;

    @AutoMap(() => Category)
    @OneToMany(() => Category, (category) => category.parent)
    children: Category[];
}
