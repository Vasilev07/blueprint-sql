import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { VerificationStatus } from "../enums/verification-status.enum";

@Entity()
export class VerificationRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column("int")
    userId: number;

    @Column({ type: "text" })
    verificationPhoto: string; // File path to the verification photo

    @Column({
        type: "enum",
        enum: VerificationStatus,
        default: VerificationStatus.PENDING,
    })
    status: VerificationStatus;

    @Column({ type: "text", nullable: true })
    rejectionReason: string;

    @Column({ type: "int", nullable: true })
    reviewedBy: number; // Admin user ID who reviewed

    @Column({ type: "timestamp", nullable: true })
    reviewedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
