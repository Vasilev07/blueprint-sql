import { ApiProperty } from "@nestjs/swagger";

export class CreateConversationDTO {
    @ApiProperty({ description: "Current user ID" })
    userId: number;

    @ApiProperty({ description: "Other user ID to start conversation with" })
    otherUserId: number;
}
