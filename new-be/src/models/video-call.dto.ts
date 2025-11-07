import { ApiProperty } from "@nestjs/swagger";
import { CallStatus } from "../enums/call-status.enum";
import { UserDTO } from "./user.dto";

export class VideoCallDTO {
    @ApiProperty()
    id: string;

    @ApiProperty({ type: () => UserDTO })
    initiator: UserDTO;

    @ApiProperty()
    initiatorId: number;

    @ApiProperty({ type: () => UserDTO })
    recipient: UserDTO;

    @ApiProperty()
    recipientId: number;

    @ApiProperty({ enum: CallStatus })
    status: CallStatus;

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

    @ApiProperty({ default: 2 })
    maxParticipants: number;
}

