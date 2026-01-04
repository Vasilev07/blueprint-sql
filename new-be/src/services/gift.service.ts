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
import { GiftGateway } from "../gateways/gift.gateway";
import { ChatService } from "./chat.service";
import { ChatGateway } from "../gateways/chat.gateway";
import { WalletGateway } from "../gateways/wallet.gateway";

@Injectable()
export class GiftService {
    constructor(
        private readonly entityManager: EntityManager,
        private readonly walletService: WalletService,
        private readonly giftGateway: GiftGateway,
        private readonly chatService: ChatService,
        private readonly chatGateway: ChatGateway,
        private readonly walletGateway: WalletGateway,
    ) {}

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

        const { receiverId, giftEmoji, amount, message } = sendGiftDto;

        // Validate not sending to self
        if (senderId === receiverId) {
            throw new BadRequestException("Cannot send gift to yourself");
        }

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

            // Validate sender has sufficient balance using decimal strings
            const currentBalanceNum = this.parseDecimal(lockedSenderWallet.balance);
            if (currentBalanceNum < amountDecimal) {
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

            // Update balances using decimal arithmetic
            lockedSenderWallet.balance = this.subtractDecimals(lockedSenderWallet.balance, amount);
            lockedReceiverWallet.balance = this.addDecimals(lockedReceiverWallet.balance, amount);

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
            gift.giftEmoji = giftEmoji;
            gift.amount = amount;
            gift.message = message || null;
            gift.transaction = savedTransaction;
            gift.transactionId = savedTransaction.id;

            const savedGift = await queryRunner.manager.save(gift);

            // Commit transaction
            await queryRunner.commitTransaction();

            // Create system message in chat after successful gift save
            try {
                // Get or create conversation between sender and receiver
                const conversation = await this.chatService.getOrCreateConversation(
                    senderId,
                    receiverId,
                );

                // Create system message with gift information
                const giftMessageContent = `🎁 Gift Sent: ${giftEmoji} (${amount} tokens)${message ? ` - "${message}"` : ""}`;
                
                const systemMessage = await this.chatService.sendMessage(
                    conversation.id,
                    senderId, // System message appears as from sender
                    giftMessageContent,
                    "text",
                );

                // Emit the message via WebSocket so both users see it in real-time
                this.chatGateway.server.emit(`chat:message:${conversation.id}`, systemMessage);
                this.chatGateway.server.emit("chat:message", {
                    conversationId: conversation.id,
                    message: systemMessage,
                });
            } catch (error) {
                // Log error but don't fail the gift send
                console.error("Failed to create gift system message:", error);
            }

            // Emit websocket notification to receiver
            try {
                this.giftGateway.notifyGiftReceived(receiverId, {
                    giftId: savedGift.id,
                    senderId: senderId,
                    senderName: sender.firstname
                        ? `${sender.firstname} ${sender.lastname || ""}`.trim()
                        : sender.email,
                    senderEmail: sender.email,
                    giftEmoji: giftEmoji,
                    amount: amount,
                    message: message || null,
                    createdAt: savedGift.createdAt,
                });
            } catch (error) {
                // Log error but don't fail the gift send
                console.error("Failed to emit gift notification:", error);
            }

            // Emit balance updates via WebSocket
            try {
                this.walletGateway.notifyBalanceUpdate(senderId, lockedSenderWallet.balance);
                this.walletGateway.notifyBalanceUpdate(receiverId, lockedReceiverWallet.balance);
            } catch (error) {
                console.error("Failed to emit balance update:", error);
            }

            return {
                giftId: savedGift.id,
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
     * Get gifts received by a specific user
     */
    async getReceivedGiftsByUserId(
        userId: number,
        limit?: number,
    ): Promise<GiftDTO[]> {
        // Validate user exists
        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException("User not found");
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
            giftEmoji: gift.giftEmoji,
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

    /**
     * Add two decimal strings and return as decimal string
     */
    private addDecimals(a: string, b: string): string {
        const numA = this.parseDecimal(a);
        const numB = this.parseDecimal(b);
        return (numA + numB).toFixed(8);
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

