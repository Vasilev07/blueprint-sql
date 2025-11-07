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
import { CallStatus } from "../enums/call-status.enum";

@Entity("video_call")
export class VideoCall {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: "initiator_id" })
    initiator: User;

    @Column({ name: "initiator_id" })
    initiatorId: number;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: "recipient_id" })
    recipient: User;

    @Column({ name: "recipient_id" })
    recipientId: number;

    @Column({
        type: "enum",
        enum: CallStatus,
        default: CallStatus.PENDING,
    })
    status: CallStatus;

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

    // For future extensibility to one-to-many live streams
    @Column({ name: "is_live_stream", default: false })
    isLiveStream: boolean;

    @Column({ name: "max_participants", default: 2 })
    maxParticipants: number;
}

