import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Wallet } from "./wallet.entity";

export enum TransactionType {
    Deposit = "DEPOSIT",
    Withdrawal = "WITHDRAWAL",
    Transfer = "TRANSFER",
    SuperLike = "SUPER_LIKE",
}

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Wallet, (wallet) => wallet.outgoingTransactions, { nullable: true, onDelete: "SET NULL" })
    fromWallet: Wallet | null;

    @ManyToOne(() => Wallet, (wallet) => wallet.incomingTransactions, { nullable: true, onDelete: "SET NULL" })
    toWallet: Wallet | null;

    @Column({ type: "decimal", precision: 20, scale: 8 })
    amount: string;

    @Column({ type: "decimal", precision: 20, scale: 8, default: "0" })
    feeAmount: string;

    @Column({ type: "enum", enum: TransactionType })
    type: TransactionType;

    @CreateDateColumn()
    createdAt: Date;
}


