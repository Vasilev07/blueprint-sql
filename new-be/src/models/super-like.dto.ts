import { ApiProperty } from "@nestjs/swagger";

export class SendSuperLikeRequestDTO {
    @ApiProperty({ description: "User ID to send super like to" })
    receiverId: number;
}

