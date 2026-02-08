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
    upvoteCount: number;

    @ApiProperty()
    downvoteCount: number;

    @ApiProperty({
        required: false,
        enum: ["upvote", "downvote", null],
        description:
            "Current user's vote on this comment (null if no vote, undefined if not authenticated)",
    })
    userVote?: "upvote" | "downvote" | null; // Current user's vote on this comment

    @ApiProperty()
    likeCount: number; // Deprecated - kept for backward compatibility

    @ApiProperty()
    depth: number;

    @ApiProperty({ enum: ["active", "deleted", "hidden"] })
    status: "active" | "deleted" | "hidden";

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
