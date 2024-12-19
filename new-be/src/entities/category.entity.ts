import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AutoMap } from "@automapper/classes";
import { Product } from "./product.entity";
import { CategoryType } from "../enums/categories.enum";

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    @AutoMap()
    id?: number;

    @Column("text")
    @AutoMap()
    name: string;

    @Column({
        type: "enum",
        enum: CategoryType,
    })
    @AutoMap()
    type: CategoryType;

    // @OneToMany(() => Product, (product) => product.category)
    // @AutoMap(() => [Product])
    // products: Product[];
}
