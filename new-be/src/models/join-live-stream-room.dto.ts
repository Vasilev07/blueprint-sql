import { ApiProperty } from "@nestjs/swagger";

export class JoinLiveStreamRoomDTO {
    @ApiProperty({ description: "ID of the stream room/session" })
    sessionId: string;

    @ApiProperty({ description: "ID of the user joining the room" })
    userId: number;
}
