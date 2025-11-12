import { ApiProperty } from "@nestjs/swagger";

export class LeaveLiveStreamRoomDTO {
    @ApiProperty({ description: "ID of the stream room/session" })
    sessionId: string;

    @ApiProperty({ description: "ID of the user leaving the room" })
    userId: number;
}
