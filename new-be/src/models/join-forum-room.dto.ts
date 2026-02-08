import { ApiProperty } from "@nestjs/swagger";

export class JoinForumRoomDTO {
    @ApiProperty({ description: "Room ID to join" })
    roomId: number;
}
