import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Product } from "./product.entity";
import { Address } from "@entities/address.entity";

export enum OrderStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    CANCELED = "canceled",
}

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @Column({ type: "int", width: 200 })
    total: number;

    @Column(() => Address)
    address: Address;

    @ManyToMany(() => Product)
    @JoinTable({
        name: "order_products",
        joinColumn: { name: "order_id", referencedColumnName: "id" },
    })
    products?: Product[];
}
