import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";
import { AutoMap } from "@automapper/classes";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    @AutoMap()
    id?: number;

    @Column("text")
    @AutoMap()
    name: string;

    @Column("int")
    @AutoMap()
    weight: number;

    @ManyToOne(() => Order, (order) => order.products)
    @AutoMap(() => Order)
    order: Order;

    @Column("int")
    @AutoMap()
    price: number;
}
