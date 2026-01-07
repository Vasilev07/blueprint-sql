import { ApiProperty } from "@nestjs/swagger";

export class ForumRoomMemberDTO {
    @ApiProperty()
    id: number;

    @ApiProperty()
    roomId: number;

    @ApiProperty()
    userId: number;

    @ApiProperty({ enum: ["admin", "moderator", "member"] })
    role: "admin" | "moderator" | "member";

    @ApiProperty({ enum: ["joined", "left", "banned"] })
    status: "joined" | "left" | "banned";

    @ApiProperty()
    unreadCount: number;

    @ApiProperty()
    joinedAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

