import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./user.entity";
import { Transaction } from "./transaction.entity";

@Entity()
export class Wallet {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "bigint", default: 0 })
    balance: number;

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


