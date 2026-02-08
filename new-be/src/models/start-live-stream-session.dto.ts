import { ApiProperty } from "@nestjs/swagger";

export class StartLiveStreamSessionDTO {
    @ApiProperty({ description: "ID of the user initiating the call/session" })
    initiatorId: number;

    @ApiProperty({
        description:
            "ID of the user receiving the call (optional for live streams)",
        required: false,
    })
    recipientId?: number;

    @ApiProperty({
        description: "Whether this is a live stream (streaming room)",
        required: false,
        default: false,
    })
    isLiveStream?: boolean;

    @ApiProperty({
        description: "Room name for live streams",
        required: false,
    })
    roomName?: string;

    @ApiProperty({
        description:
            "Maximum number of participants (for future extensibility)",
        required: false,
        default: 2,
    })
    maxParticipants?: number;
}
