import { Column } from "typeorm";

export class ContactInformation {
    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    email: string;

    @Column()
    phone: string;
}
