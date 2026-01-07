import { ApiProperty } from "@nestjs/swagger";

export class CreateForumPostDTO {
    @ApiProperty({ description: "Room ID where post will be created" })
    roomId: number;

    @ApiProperty({ description: "Post title" })
    title: string;

    @ApiProperty({ description: "Post content" })
    content: string;

    @ApiProperty({
        description: "Post type",
        enum: ["text", "image", "file", "poll"],
        required: false,
        default: "text",
    })
    type?: "text" | "image" | "file" | "poll";
}

