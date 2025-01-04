import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "@entities/product.entity";

@Entity()
export class ProductImage {
    @PrimaryGeneratedColumn()
    public id?: number;

    @Column()
    public name: string;

    @Column({
        type: "bytea",
    })
    public data: Uint8Array;

    @ManyToOne(() => Product, (product) => product.images)
    public product: Product;
}
