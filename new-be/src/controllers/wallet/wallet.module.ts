import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Wallet } from "src/entities/wallet.entity";
import { Transaction } from "src/entities/transaction.entity";
import { WalletController } from "./wallet.controller";
import { WalletService } from "src/services/wallet.service";
import { PaymentProviderService } from "src/services/payment-provider.service";

@Module({
    imports: [TypeOrmModule.forFeature([Wallet, Transaction])],
    exports: [TypeOrmModule, WalletService],
    controllers: [WalletController],
    providers: [WalletService, PaymentProviderService],
})
export class WalletModule {}

