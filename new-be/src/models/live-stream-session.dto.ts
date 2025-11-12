import { ApiProperty } from "@nestjs/swagger";
import { SessionStatus } from "../enums/session-status.enum";
import { UserDTO } from "./user.dto";

export class LiveStreamSessionDTO {
    @ApiProperty()
    id: string;

    @ApiProperty({ type: () => UserDTO })
    initiator: UserDTO;

    @ApiProperty()
    initiatorId: number;

    @ApiProperty({ type: () => UserDTO, required: false })
    recipient?: UserDTO | null;

    @ApiProperty({ required: false })
    recipientId?: number | null;

    @ApiProperty({ enum: SessionStatus })
    status: SessionStatus;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({ required: false })
    startedAt?: Date | null;

    @ApiProperty({ required: false })
    endedAt?: Date | null;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ required: false })
    durationSeconds?: number | null;

    @ApiProperty({ required: false })
    endReason?: string | null;

    @ApiProperty({ default: false })
    isLiveStream: boolean;

    @ApiProperty({ required: false })
    roomName?: string | null;

    @ApiProperty({ default: 2 })
    maxParticipants: number;
}
