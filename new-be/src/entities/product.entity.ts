import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductImage } from "@entities/product-image.entity";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column("text")
    name: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    weight: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    price: number;

    @OneToMany(() => ProductImage, (productImage) => productImage.product, {
        cascade: true,
    })
    images: ProductImage[];
}
