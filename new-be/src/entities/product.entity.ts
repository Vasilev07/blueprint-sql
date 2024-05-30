import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    name: string;

    @Column("int")
    weight: number;

    @ManyToOne(() => Order, (order) => order.products)
    order: Order;
}
