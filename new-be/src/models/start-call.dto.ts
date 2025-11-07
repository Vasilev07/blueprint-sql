import { ApiProperty } from "@nestjs/swagger";


export class StartCallDTO {
    @ApiProperty({ description: "ID of the user initiating the call" })
    initiatorId: number;

    @ApiProperty({ description: "ID of the user receiving the call" })
    recipientId: number;

    @ApiProperty({
        description: "Whether this is a live stream (for future extensibility)",
        required: false,
        default: false,
    })

    isLiveStream?: boolean;

    @ApiProperty({
        description: "Maximum number of participants (for future extensibility)",
        required: false,
        default: 2,
    })

    maxParticipants?: number;
}

