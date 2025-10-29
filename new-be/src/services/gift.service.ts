import {
    Injectable,
    NotFoundException,
    BadRequestException,
    UnauthorizedException,
} from "@nestjs/common";
import { EntityManager, QueryRunner } from "typeorm";
import { Gift } from "@entities/gift.entity";
import { User } from "@entities/user.entity";
import { Wallet } from "@entities/wallet.entity";
import { Transaction, TransactionType } from "@entities/transaction.entity";
import { SendGiftRequestDTO, SendGiftResponseDTO, GiftDTO } from "../models/gift.dto";
import { WalletService } from "./wallet.service";

@Injectable()
export class GiftService {
    // Valid gift image names
    private readonly validGiftImages = [
        "img.png",
        "img_1.png",
        "img_2.png",
        "img_3.png",
        "img_4.png",
        "img_5.png",
        "img_6.png",
        "img_7.png",
        "image.png",
    ];

    constructor(
        private readonly entityManager: EntityManager,
        private readonly walletService: WalletService,
    ) {}

    /**
     * Validate gift image name
     */
    private validateGiftImageName(imageName: string): void {
        if (!this.validGiftImages.includes(imageName)) {
            throw new BadRequestException(
                `Invalid gift image name. Valid options: ${this.validGiftImages.join(", ")}`,
            );
        }
    }

    /**
     * Send a gift from authenticated user to another user
     */
    async sendGift(
        sendGiftDto: SendGiftRequestDTO,
        req: any,
    ): Promise<SendGiftResponseDTO> {
        const senderId = req.userData?.id;
        if (!senderId) {
            throw new UnauthorizedException("User not authenticated");
        }

        const { receiverId, giftImageName, amount, message } = sendGiftDto;

        // Validate not sending to self
        if (senderId === receiverId) {
            throw new BadRequestException("Cannot send gift to yourself");
        }

        // Validate gift image name
        this.validateGiftImageName(giftImageName);

        // Validate amount
        const amountDecimal = this.parseDecimal(amount);
        if (amountDecimal <= 0) {
            throw new BadRequestException("Amount must be greater than 0");
        }

        // Validate receiver exists
        const receiver = await this.entityManager.findOne(User, {
            where: { id: receiverId },
        });

        if (!receiver) {
            throw new NotFoundException("Recipient user not found");
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

            // Validate sender has sufficient balance
            const currentBalance = this.parseDecimal(String(lockedSenderWallet.balance));
            if (currentBalance < amountDecimal) {
                await queryRunner.rollbackTransaction();
                throw new BadRequestException("Insufficient balance");
            }

            // Get receiver wallet (ensure it exists)
            const receiverWallet = await this.walletService.getOrCreateWallet(receiverId);
            
            // Lock receiver wallet
            const lockedReceiverWallet = await queryRunner.manager
                .createQueryBuilder(Wallet, "wallet")
                .where('"wallet"."id" = :walletId', { walletId: receiverWallet.id })
                .setLock("pessimistic_write")
                .getOne();

            if (!lockedReceiverWallet) {
                throw new NotFoundException("Receiver wallet not found");
            }

            // Update balances atomically - convert to integer (multiply by 10^8 for 8 decimals)
            lockedSenderWallet.balance = Math.round((currentBalance - amountDecimal) * 100000000);
            lockedReceiverWallet.balance = Math.round(
                (this.parseDecimal(String(lockedReceiverWallet.balance / 100000000)) + amountDecimal) * 100000000
            );

            // Save wallets
            await queryRunner.manager.save([lockedSenderWallet, lockedReceiverWallet]);

            // Get sender and receiver entities
            const sender = await queryRunner.manager.findOne(User, {
                where: { id: senderId },
            });
            const receiverEntity = await queryRunner.manager.findOne(User, {
                where: { id: receiverId },
            });

            if (!sender || !receiverEntity) {
                throw new NotFoundException("User not found");
            }

            // Create transaction record
            const transaction = new Transaction();
            transaction.fromWallet = lockedSenderWallet;
            transaction.toWallet = lockedReceiverWallet;
            transaction.amount = amount;
            transaction.feeAmount = "0";
            transaction.type = TransactionType.Transfer;

            const savedTransaction = await queryRunner.manager.save(transaction);

            // Create gift record
            const gift = new Gift();
            gift.sender = sender;
            gift.senderId = senderId;
            gift.receiver = receiverEntity;
            gift.receiverId = receiverId;
            gift.giftImageName = giftImageName;
            gift.amount = amount;
            gift.message = message || null;
            gift.transaction = savedTransaction;
            gift.transactionId = savedTransaction.id;

            const savedGift = await queryRunner.manager.save(gift);

            // Commit transaction
            await queryRunner.commitTransaction();

            return {
                giftId: savedGift.id,
                transactionId: savedTransaction.id,
                senderBalance: (lockedSenderWallet.balance / 100000000).toFixed(8),
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Get gifts received by authenticated user
     */
    async getReceivedGifts(
        req: any,
        limit?: number,
    ): Promise<GiftDTO[]> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new UnauthorizedException("User not authenticated");
        }

        const queryBuilder = this.entityManager
            .createQueryBuilder(Gift, "gift")
            .leftJoinAndSelect("gift.sender", "sender")
            .where("gift.receiverId = :userId", { userId })
            .orderBy("gift.createdAt", "DESC");

        if (limit) {
            queryBuilder.limit(limit);
        }

        const gifts = await queryBuilder.getMany();

        return gifts.map((gift) => this.mapGiftToDTO(gift));
    }

    /**
     * Get gifts sent by authenticated user
     */
    async getSentGifts(
        req: any,
        limit?: number,
    ): Promise<GiftDTO[]> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new UnauthorizedException("User not authenticated");
        }

        const queryBuilder = this.entityManager
            .createQueryBuilder(Gift, "gift")
            .leftJoinAndSelect("gift.receiver", "receiver")
            .where("gift.senderId = :userId", { userId })
            .orderBy("gift.createdAt", "DESC");

        if (limit) {
            queryBuilder.limit(limit);
        }

        const gifts = await queryBuilder.getMany();

        return gifts.map((gift) => this.mapGiftToDTO(gift));
    }

    /**
     * Get all gifts (with pagination) for admin or specific user
     */
    async getAllGifts(
        userId?: number,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ gifts: GiftDTO[]; total: number; page: number; limit: number }> {
        const queryBuilder = this.entityManager
            .createQueryBuilder(Gift, "gift")
            .leftJoinAndSelect("gift.sender", "sender")
            .leftJoinAndSelect("gift.receiver", "receiver")
            .orderBy("gift.createdAt", "DESC");

        if (userId) {
            queryBuilder.where(
                "(gift.senderId = :userId OR gift.receiverId = :userId)",
                { userId },
            );
        }

        const total = await queryBuilder.getCount();

        const gifts = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return {
            gifts: gifts.map((gift) => this.mapGiftToDTO(gift)),
            total,
            page,
            limit,
        };
    }

    /**
     * Map Gift entity to DTO
     */
    private mapGiftToDTO(gift: Gift): GiftDTO {
        return {
            id: gift.id,
            senderId: gift.senderId,
            receiverId: gift.receiverId,
            giftImageName: gift.giftImageName,
            amount: gift.amount,
            message: gift.message,
            transactionId: gift.transactionId,
            createdAt: gift.createdAt,
            sender: gift.sender
                ? {
                      id: gift.sender.id,
                      firstname: gift.sender.firstname,
                      lastname: gift.sender.lastname,
                      email: gift.sender.email,
                  }
                : undefined,
            receiver: gift.receiver
                ? {
                      id: gift.receiver.id,
                      firstname: gift.receiver.firstname,
                      lastname: gift.receiver.lastname,
                      email: gift.receiver.email,
                  }
                : undefined,
        };
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
}

