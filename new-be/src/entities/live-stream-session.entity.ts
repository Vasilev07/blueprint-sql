import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { SessionStatus } from "../enums/session-status.enum";

@Entity("live_stream_session")
export class LiveStreamSession {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: "initiator_id" })
    initiator: User;

    @Column({ name: "initiator_id" })
    initiatorId: number;

    @ManyToOne(() => User, { eager: true, nullable: true })
    @JoinColumn({ name: "recipient_id" })
    recipient: User | null;

    @Column({ name: "recipient_id", nullable: true })
    recipientId: number | null;

    @Column({
        type: "enum",
        enum: SessionStatus,
        default: SessionStatus.PENDING,
    })
    status: SessionStatus;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @Column({ name: "started_at", type: "timestamp", nullable: true })
    startedAt: Date | null;

    @Column({ name: "ended_at", type: "timestamp", nullable: true })
    endedAt: Date | null;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @Column({ name: "duration_seconds", nullable: true })
    durationSeconds: number | null;

    @Column({ name: "end_reason", nullable: true })
    endReason: string | null;

    // For one-to-many live streams (streaming rooms)
    @Column({ name: "is_live_stream", default: false })
    isLiveStream: boolean;

    @Column({ name: "room_name", nullable: true })
    roomName: string | null;

    @Column({ name: "max_participants", default: 2 })
    maxParticipants: number;
}
