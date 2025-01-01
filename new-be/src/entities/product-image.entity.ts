import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { AutoMap } from "@automapper/classes";
import { Product } from "@entities/product.entity";

@Entity()
export class ProductImage {
    @PrimaryGeneratedColumn()
    @AutoMap()
    public id?: number;

    @Column()
    @AutoMap()
    public name: string;

    @AutoMap()
    @Column({
        type: "bytea",
    })
    data: Uint8Array;

    @AutoMap(() => Product)
    @ManyToOne(() => Product, (product) => product.images)
    public product: Product;
}
