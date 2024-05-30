import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";

export enum OrderStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    CANCELED = "canceled",
}

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @Column({ type: "int", width: 200 })
    total: number;

    @OneToMany(() => Product, (product) => product.order)
    products: Product[];
}
