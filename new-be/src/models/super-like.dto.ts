import { ApiProperty } from "@nestjs/swagger";

export class SendSuperLikeRequestDTO {
    @ApiProperty({ description: "User ID to send super like to" })
    receiverId: number;
}

export class SendSuperLikeResponseDTO {
    @ApiProperty({ description: "Super like ID" })
    superLikeId: number;

    @ApiProperty({ description: "Transaction ID" })
    transactionId: number;

    @ApiProperty({ description: "Sender's remaining balance after sending super like" })
    senderBalance: string;
}

