import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AutoMap } from "@automapper/classes";
import { ProductImage } from "@entities/product-image.entity";

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

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @AutoMap()
    price: number;

    @AutoMap(() => [ProductImage])
    @OneToMany(() => ProductImage, (productImage) => productImage.product)
    images: ProductImage[];
}
