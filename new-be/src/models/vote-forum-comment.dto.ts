import { ApiProperty } from "@nestjs/swagger";

export enum VoteType {
    UPVOTE = "upvote",
    DOWNVOTE = "downvote",
}

export class VoteForumCommentDTO {
    @ApiProperty({ 
        enum: ["upvote", "downvote"], 
        description: "Type of vote: upvote or downvote",
        example: "upvote"
    })
    voteType: "upvote" | "downvote";
}
