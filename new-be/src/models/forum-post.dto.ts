import { ApiProperty } from "@nestjs/swagger";

export class ForumPostDTO {
    @ApiProperty()
    id: number;

    @ApiProperty()
    roomId: number;

    @ApiProperty()
    authorId: number;

    @ApiProperty()
    title: string;

    @ApiProperty()
    content: string;

    @ApiProperty({ enum: ["text", "image", "file", "poll"] })
    type: "text" | "image" | "file" | "poll";

    @ApiProperty()
    commentCount: number;

    @ApiProperty()
    likeCount: number;

    @ApiProperty()
    isPinned: boolean;

    @ApiProperty()
    isLocked: boolean;

    @ApiProperty({ enum: ["active", "deleted", "hidden"] })
    status: "active" | "deleted" | "hidden";

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

