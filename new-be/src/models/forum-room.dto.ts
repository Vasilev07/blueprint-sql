import { ApiProperty } from "@nestjs/swagger";

export class ForumRoomDTO {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty({ required: false })
    description: string | null;

    @ApiProperty({ enum: ["public", "private", "restricted"] })
    visibility: "public" | "private" | "restricted";

    @ApiProperty({ required: false })
    createdBy: number | null;

    @ApiProperty()
    memberCount: number;

    @ApiProperty({ required: false })
    maxMembers: number | null;

    @ApiProperty({ enum: ["active", "archived", "deleted"] })
    status: "active" | "archived" | "deleted";

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
