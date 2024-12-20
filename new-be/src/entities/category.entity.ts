import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { AutoMap } from "@automapper/classes";
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
