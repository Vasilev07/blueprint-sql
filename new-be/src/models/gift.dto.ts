import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class GiftDTO {
    @ApiProperty()
    id: number;

    @ApiProperty()
    senderId: number;

    @ApiProperty()
    receiverId: number;

    @ApiProperty()
    giftEmoji: string;

    @ApiProperty()
    amount: string;

    @ApiPropertyOptional()
    message?: string | null;

    @ApiPropertyOptional()
    transactionId?: number | null;

    @ApiProperty()
    createdAt: Date;

    @ApiPropertyOptional()
    sender?: {
        id: number;
        firstname: string;
        lastname: string;
        email: string;
    };

    @ApiPropertyOptional()
    receiver?: {
        id: number;
        firstname: string;
        lastname: string;
        email: string;
    };
}

export class SendGiftRequestDTO {
    @ApiProperty({ description: "User ID to send gift to" })
    receiverId: number;

    @ApiProperty({ description: "Gift emoji (e.g., '🍹', '🌹', '💎')" })
    giftEmoji: string;

    @ApiProperty({
        description: "Amount to pay for the gift (as decimal string)",
    })
    amount: string;

    @ApiPropertyOptional({ description: "Optional message with the gift" })
    message?: string;
}

export class SendGiftResponseDTO {
    @ApiProperty({ description: "Gift ID" })
    giftId: number;

    @ApiProperty({ description: "Transaction ID" })
    transactionId: number;

    @ApiProperty({ description: "Updated sender balance" })
    senderBalance: string;
}
