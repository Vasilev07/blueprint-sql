import { ApiProperty } from "@nestjs/swagger";

export class LeaveForumRoomDTO {
    @ApiProperty({ description: "Room ID to leave" })
    roomId: number;
}

