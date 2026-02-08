import { ApiProperty } from "@nestjs/swagger";

export class DepositRequestDTO {
    @ApiProperty({ description: "Amount to deposit (as decimal string)" })
    amount: string;

    @ApiProperty({
        description: "Currency code (e.g., USD, EUR)",
        default: "USD",
    })
    currency: string;

    @ApiProperty({ description: "Payment method identifier", default: "card" })
    paymentMethod: string;
}

export class DepositResponseDTO {
    @ApiProperty({ description: "Transaction ID from payment provider" })
    paymentTransactionId: string;

    @ApiProperty({ description: "Internal transaction ID" })
    transactionId: number;

    @ApiProperty({ description: "Updated wallet balance" })
    balance: string;
}
