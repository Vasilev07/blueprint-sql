import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { AutoMap } from "@automapper/classes";
import { Category } from "./category.entity";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    @AutoMap()
    id?: number;

    @Column("text")
    @AutoMap()
    name: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @AutoMap()
    weight: number;

    @Column("decimal", { precision: 10, scale: 2 })
    @AutoMap()
    price: number;

    // @ManyToOne(() => Category, (category) => category.products, {
    //     onDelete: "CASCADE",
    // })
    // @AutoMap(() => Category)
    // category: Category;
}
