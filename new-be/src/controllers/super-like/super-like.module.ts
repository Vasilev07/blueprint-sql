import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SuperLikeController } from "./super-like.controller";
import { SuperLikeService } from "../../services/super-like.service";
import { SuperLike } from "../../entities/super-like.entity";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import { Transaction } from "../../entities/transaction.entity";
import { WalletService } from "../../services/wallet.service";
import { PaymentProviderService } from "../../services/payment-provider.service";
import { WalletGateway } from "../../gateways/wallet.gateway";
import { SuperLikeGateway } from "../../gateways/super-like.gateway";

@Module({
    imports: [TypeOrmModule.forFeature([SuperLike, User, Wallet, Transaction])],
    controllers: [SuperLikeController],
    providers: [
        SuperLikeService,
        WalletService,
        PaymentProviderService,
        WalletGateway,
        SuperLikeGateway,
    ],
    exports: [SuperLikeService],
})
export class SuperLikeModule {}
