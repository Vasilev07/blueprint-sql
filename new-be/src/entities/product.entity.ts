import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AutoMap } from "@automapper/classes";
import { ProductImage } from "@entities/product-image.entity";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    @AutoMap(() => Number)
    id?: number;

    @Column("text")
    @AutoMap(() => String)
    name: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @AutoMap(() => Number)
    weight: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @AutoMap(() => Number)
    price: number;

    @AutoMap(() => [ProductImage])
    @OneToMany(() => ProductImage, (productImage) => productImage.product, {
        cascade: true,
    })
    images: ProductImage[];
}
