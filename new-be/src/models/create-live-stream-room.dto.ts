import { ApiProperty } from "@nestjs/swagger";

export class CreateLiveStreamRoomDTO {
    @ApiProperty({ description: "ID of the user creating the stream room" })
    initiatorId: number;

    @ApiProperty({ description: "Name/title of the stream room" })
    roomName: string;

    @ApiProperty({
        description: "Maximum number of participants",
        required: false,
        default: 50,
    })
    maxParticipants?: number;
}
