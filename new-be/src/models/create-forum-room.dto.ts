import { ApiProperty } from "@nestjs/swagger";

export class CreateForumRoomDTO {
    @ApiProperty({ description: "Room name" })
    name: string;

    @ApiProperty({ description: "Room description", required: false })
    description?: string;

    @ApiProperty({
        description: "Room visibility",
        enum: ["public", "private", "restricted"],
    })
    visibility: "public" | "private" | "restricted";

    @ApiProperty({
        description: "Maximum number of members (null = unlimited)",
        required: false,
    })
    maxMembers?: number;
}

