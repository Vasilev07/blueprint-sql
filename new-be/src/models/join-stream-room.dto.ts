import { ApiProperty } from "@nestjs/swagger";

export class JoinLiveStreamRoomDTO {
    @ApiProperty({ description: "ID of the stream room/call" })
    callId: string;

    @ApiProperty({ description: "ID of the user joining the room" })
    userId: number;
}
