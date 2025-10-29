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

@Module({
    imports: [TypeOrmModule.forFeature([Gift, Transaction, Wallet, User])],
    exports: [TypeOrmModule, GiftService],
    controllers: [GiftController],
    providers: [GiftService, WalletService, PaymentProviderService],
})
export class GiftModule {}

