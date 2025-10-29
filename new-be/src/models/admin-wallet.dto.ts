export class AdminDepositRequestDTO {
    userId: number;
    amount: string;
}

export class AdminTransferRequestDTO {
    fromUserId: number;
    toUserId: number;
    amount: string;
}
