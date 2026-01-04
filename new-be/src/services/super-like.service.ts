import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager, QueryRunner } from "typeorm";
import { SuperLike } from "../entities/super-like.entity";
import { User } from "../entities/user.entity";
import { Wallet } from "../entities/wallet.entity";
import { Transaction, TransactionType } from "../entities/transaction.entity";
import { WalletService } from "./wallet.service";
import { SendSuperLikeRequestDTO, SendSuperLikeResponseDTO } from "../models/super-like.dto";
import { SUPER_LIKE_COST } from "../constants";
import { WalletGateway } from "../gateways/wallet.gateway";

@Injectable()
export class SuperLikeService {
    constructor(
        @InjectRepository(SuperLike)
        private superLikeRepo: Repository<SuperLike>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private readonly entityManager: EntityManager,
        private readonly walletService: WalletService,
        private readonly walletGateway: WalletGateway,
    ) { }

    /**
     * Send a super like from authenticated user to another user
     * Costs 200 tokens - deducted from sender's wallet
     */
    async sendSuperLike(
        sendSuperLikeDto: SendSuperLikeRequestDTO,
        req: any,
    ): Promise<SendSuperLikeResponseDTO> {
        const senderId = req.userData?.id;
        if (!senderId) {
            throw new UnauthorizedException("User not authenticated");
        }

        const { receiverId } = sendSuperLikeDto;

        // Validate not sending to self
        if (senderId === receiverId) {
            throw new BadRequestException("You cannot super like yourself");
        }

        // Validate receiver exists
        const receiver = await this.userRepo.findOne({ where: { id: receiverId } });
        if (!receiver) {
            throw new NotFoundException("Receiver not found");
        }

        // Use QueryRunner for transaction with row-level locks
        const queryRunner: QueryRunner = this.entityManager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Get sender wallet
            const senderWallet = await this.walletService.getOrCreateWallet(senderId);
            
            // Lock sender wallet
            const lockedSenderWallet = await queryRunner.manager
                .createQueryBuilder(Wallet, "wallet")
                .where('"wallet"."id" = :walletId', { walletId: senderWallet.id })
                .setLock("pessimistic_write")
                .getOne();

            if (!lockedSenderWallet) {
                throw new NotFoundException("Sender wallet not found");
            }

            // Validate sender has sufficient balance (200 tokens)
            const currentBalanceNum = this.parseDecimal(lockedSenderWallet.balance);
            const superLikeCostNum = this.parseDecimal(SUPER_LIKE_COST);
            if (currentBalanceNum < superLikeCostNum) {
                throw new BadRequestException("Insufficient balance. Super like costs 200 tokens");
            }

            // Deduct 200 tokens from sender
            lockedSenderWallet.balance = this.subtractDecimals(lockedSenderWallet.balance, SUPER_LIKE_COST);

            // Save wallet
            await queryRunner.manager.save(lockedSenderWallet);

            // Get sender entity
            const sender = await queryRunner.manager.findOne(User, {
                where: { id: senderId },
            });

            if (!sender) {
                throw new NotFoundException("Sender user not found");
            }

            // Create transaction record
            const transaction = new Transaction();
            transaction.fromWallet = lockedSenderWallet;
            transaction.toWallet = null; // No recipient wallet - tokens are spent
            transaction.amount = SUPER_LIKE_COST;
            transaction.feeAmount = "0";
            transaction.type = TransactionType.SuperLike;

            const savedTransaction = await queryRunner.manager.save(transaction);

            // Create super like record
            const superLike = new SuperLike();
            superLike.sender = sender;
            superLike.senderId = senderId;
            superLike.receiver = receiver;
            superLike.receiverId = receiverId;

            const savedSuperLike = await queryRunner.manager.save(superLike);

            // Commit transaction
            await queryRunner.commitTransaction();

            // Emit balance update via WebSocket
            try {
                this.walletGateway.notifyBalanceUpdate(senderId, lockedSenderWallet.balance);
            } catch (error) {
                console.error("Failed to emit balance update:", error);
            }

            return {
                superLikeId: savedSuperLike.id,
                transactionId: savedTransaction.id,
                senderBalance: lockedSenderWallet.balance,
            };
        } catch (error) {
            // Only rollback if transaction is still active
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Check if user can afford to send a super like (has at least 200 tokens)
     */
    async canAffordSuperLike(req: any): Promise<{ canAfford: boolean; balance: string; cost: string }> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new UnauthorizedException("User not authenticated");
        }

        const wallet = await this.walletService.getOrCreateWallet(userId);
        const balanceNum = this.parseDecimal(wallet.balance);
        const costNum = this.parseDecimal(SUPER_LIKE_COST);

        return {
            canAfford: balanceNum >= costNum,
            balance: wallet.balance,
            cost: SUPER_LIKE_COST,
        };
    }

    async getSuperLikesForUser(userId: number): Promise<SuperLike[]> {
        return this.superLikeRepo.find({
            where: { receiverId: userId },
            relations: ["sender", "sender.profile"], // Load sender profile to show who liked
            order: { createdAt: "DESC" },
        });
    }

    /**
     * Parse decimal string to number
     */
    private parseDecimal(value: string): number {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
            throw new BadRequestException(`Invalid decimal value: ${value}`);
        }
        return parsed;
    }

    /**
     * Subtract two decimal strings and return as decimal string
     */
    private subtractDecimals(a: string, b: string): string {
        const numA = this.parseDecimal(a);
        const numB = this.parseDecimal(b);
        return (numA - numB).toFixed(8);
    }
}
