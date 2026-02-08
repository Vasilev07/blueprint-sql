import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    OneToMany,
    JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Transaction } from "./transaction.entity";

@Entity()
export class Wallet {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "decimal", precision: 20, scale: 8, default: "0" })
    balance: string;

    @Column({ type: "decimal", precision: 5, scale: 2, default: "0" })
    withdrawFeePercentage: string;

    @OneToOne(() => User, (user) => user.wallet, { onDelete: "CASCADE" })
    @JoinColumn()
    user: User;

    @OneToMany(() => Transaction, (tx) => tx.toWallet)
    incomingTransactions: Transaction[];

    @OneToMany(() => Transaction, (tx) => tx.fromWallet)
    outgoingTransactions: Transaction[];
}
