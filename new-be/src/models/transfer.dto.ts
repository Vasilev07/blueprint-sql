import { ApiProperty } from "@nestjs/swagger";

export class TransferRequestDTO {
    @ApiProperty({ description: "User ID to transfer tokens to" })
    toUserId: number;

    @ApiProperty({ description: "Amount to transfer (as decimal string)" })
    amount: string;
}

export class TransferResponseDTO {
    @ApiProperty({ description: "Transaction ID" })
    transactionId: number;

    @ApiProperty({ description: "Sender's updated balance" })
    fromBalance: string;

    @ApiProperty({ description: "Receiver's updated balance" })
    toBalance: string;
}
