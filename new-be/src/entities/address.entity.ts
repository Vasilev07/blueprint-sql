import { Column } from "typeorm";

export class Address {
    @Column()
    country: string;

    @Column()
    city: string;

    @Column()
    postCode: string;

    @Column()
    address: string;
}
