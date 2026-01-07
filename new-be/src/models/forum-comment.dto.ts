import { ApiProperty } from "@nestjs/swagger";

export class ForumCommentDTO {
    @ApiProperty()
    id: number;

    @ApiProperty()
    postId: number;

    @ApiProperty({ required: false })
    parentCommentId: number | null;

    @ApiProperty()
    authorId: number;

    @ApiProperty()
    content: string;

    @ApiProperty({ enum: ["text", "image", "file"] })
    type: "text" | "image" | "file";

    @ApiProperty()
    replyCount: number;

    @ApiProperty()
    likeCount: number;

    @ApiProperty()
    depth: number;

    @ApiProperty({ enum: ["active", "deleted", "hidden"] })
    status: "active" | "deleted" | "hidden";

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

