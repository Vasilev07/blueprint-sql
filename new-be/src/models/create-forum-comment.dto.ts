import { ApiProperty } from "@nestjs/swagger";

export class CreateForumCommentDTO {
    @ApiProperty({ description: "Post ID to comment on" })
    postId: number;

    @ApiProperty({
        description:
            "Parent comment ID (for nested replies). Omit for top-level comment",
        required: false,
    })
    parentCommentId?: number | null;

    @ApiProperty({ description: "Comment content" })
    content: string;

    @ApiProperty({
        description: "Comment type",
        enum: ["text", "image", "file"],
        required: false,
        default: "text",
    })
    type?: "text" | "image" | "file";
}
