import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Gift } from "src/entities/gift.entity";
import { Transaction } from "src/entities/transaction.entity";
import { Wallet } from "src/entities/wallet.entity";
import { User } from "src/entities/user.entity";
import { GiftController } from "./gift.controller";
import { GiftService } from "src/services/gift.service";
import { WalletService } from "src/services/wallet.service";
import { PaymentProviderService } from "src/services/payment-provider.service";
import { GiftGateway } from "src/gateways/gift.gateway";
import { WalletGateway } from "src/gateways/wallet.gateway";
import { ChatModule } from "../chat/chat.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Gift, Transaction, Wallet, User]),
        ChatModule, // Import ChatModule to use ChatService and ChatGateway
    ],
    exports: [TypeOrmModule, GiftService, GiftGateway],
    controllers: [GiftController],
    providers: [GiftService, WalletService, PaymentProviderService, GiftGateway, WalletGateway],
})
export class GiftModule {}

