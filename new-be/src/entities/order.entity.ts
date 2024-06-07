import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";
import { AutoMap } from "@automapper/classes";

export enum OrderStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    CANCELED = "canceled",
}

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    @AutoMap()
    id?: number;

    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    @AutoMap()
    status: OrderStatus;

    @Column({ type: "int", width: 200 })
    @AutoMap()
    total: number;

    @OneToMany(() => Product, (product) => product.order, { cascade: true })
    @AutoMap(() => [Product])
    products: Product[];
}
