import {
    Injectable,
    NotFoundException,
    BadRequestException,
    UnauthorizedException,
} from "@nestjs/common";
import { EntityManager, QueryRunner } from "typeorm";
import { Wallet } from "@entities/wallet.entity";
import { Transaction, TransactionType } from "@entities/transaction.entity";
import { User } from "@entities/user.entity";
import { TransferRequestDTO, TransferResponseDTO } from "../models/transfer.dto";
import { DepositRequestDTO, DepositResponseDTO } from "../models/deposit.dto";
import { PaymentProviderService } from "./payment-provider.service";
import { AdminDepositRequestDTO, AdminTransferRequestDTO } from "../models/admin-wallet.dto";

@Injectable()
export class WalletService {
    constructor(
        private readonly entityManager: EntityManager,
        private readonly paymentProvider: PaymentProviderService,
    ) {}

    /**
     * Get or create wallet for a user
     */
    async getOrCreateWallet(userId: number): Promise<Wallet> {
        let wallet = await this.entityManager.findOne(Wallet, {
            where: { user: { id: userId } },
            relations: ["user"],
        });

        if (!wallet) {
            const user = await this.entityManager.findOne(User, {
                where: { id: userId },
            });

            if (!user) {
                throw new NotFoundException("User not found");
            }

            wallet = new Wallet();
            wallet.user = user;
            wallet.balance = 0;
            wallet.withdrawFeePercentage = "0";
            wallet = await this.entityManager.save(wallet);
        }

        return wallet;
    }

    /**
     * Transfer tokens from authenticated user to another user
     */
    async transfer(
        transferDto: TransferRequestDTO,
        req: any,
    ): Promise<TransferResponseDTO> {
        const fromUserId = req.userData?.id;
        if (!fromUserId) {
            throw new UnauthorizedException("User not authenticated");
        }
        const { toUserId, amount } = transferDto;

        // Validate amount
        const amountDecimal = this.parseDecimal(amount);
        if (amountDecimal <= 0) {
            throw new BadRequestException("Amount must be greater than 0");
        }

        // Validate not transferring to self
        if (fromUserId === toUserId) {
            throw new BadRequestException("Cannot transfer to yourself");
        }

        // Validate receiver exists
        const toUser = await this.entityManager.findOne(User, {
            where: { id: toUserId },
        });

        if (!toUser) {
            throw new NotFoundException("Recipient user not found");
        }

        // Use QueryRunner for transaction with row-level locks
        const queryRunner: QueryRunner = this.entityManager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Process wallets in consistent order (by user id) to prevent deadlocks
            const userIds = [fromUserId, toUserId].sort((a, b) => a - b);
            
            // Lock and get wallets with FOR UPDATE in consistent order (inside transaction)
            const wallets: Wallet[] = [];
            for (const userId of userIds) {
                let wallet = await queryRunner.manager
                    .createQueryBuilder(Wallet, "wallet")
                    .where("wallet.userId = :userId", { userId })
                    .setLock("pessimistic_write")
                    .getOne();

                if (!wallet) {
                    // Create wallet if it doesn't exist (within transaction)
                    const user = await queryRunner.manager.findOne(User, {
                        where: { id: userId },
                    });

                    if (!user) {
                        throw new NotFoundException(`User ${userId} not found`);
                    }

                    wallet = new Wallet();
                    wallet.user = user;
                    wallet.balance = 0;
                    wallet.withdrawFeePercentage = "0";
                    wallet = await queryRunner.manager.save(wallet);
                    
                    // Reload with lock to ensure consistency (no relations loaded)
                    // Use repository findOne to avoid automatic relation loading
                    wallet = await queryRunner.manager
                        .getRepository(Wallet)
                        .findOne({
                            where: { id: wallet.id },
                            lock: { mode: "pessimistic_write" },
                        });
                }
                
                if (!wallet) {
                    throw new NotFoundException(`Wallet not found for user ${userId}`);
                }
                wallets.push(wallet);
            }

            // Load user relations for wallets that don't have them
            for (let i = 0; i < wallets.length; i++) {
                const wallet = wallets[i];
                const userId = userIds[i];
                if (!wallet.user) {
                    wallet.user = await queryRunner.manager.findOne(User, {
                        where: { id: userId },
                    });
                }
            }

            // Get wallets by user ID
            const fromWallet = wallets.find(w => (w.user?.id || (w as any).userId) === fromUserId);
            const toWallet = wallets.find(w => (w.user?.id || (w as any).userId) === toUserId);

            if (!fromWallet || !toWallet) {
                throw new NotFoundException("Wallet not found");
            }

            // Validate sender has sufficient balance
            const currentBalance = this.parseDecimal(String(fromWallet.balance));
            if (currentBalance < amountDecimal) {
                await queryRunner.rollbackTransaction();
                throw new BadRequestException("Insufficient balance");
            }

            // Update balances atomically - convert to integer (multiply by 10^8 for 8 decimals)
            fromWallet.balance = Math.round((currentBalance - amountDecimal) * 100000000);
            toWallet.balance = Math.round((this.parseDecimal(String(toWallet.balance)) + amountDecimal) * 100000000);

            // Save wallets
            await queryRunner.manager.save([fromWallet, toWallet]);

            // Create transaction record
            const transaction = new Transaction();
            transaction.fromWallet = fromWallet;
            transaction.toWallet = toWallet;
            transaction.amount = amount;
            transaction.feeAmount = "0";
            transaction.type = TransactionType.Transfer;

            const savedTransaction = await queryRunner.manager.save(transaction);

            // Commit transaction
            await queryRunner.commitTransaction();

            return {
                transactionId: savedTransaction.id,
                fromBalance: (fromWallet.balance / 100000000).toFixed(8),
                toBalance: (toWallet.balance / 100000000).toFixed(8),
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Add funds to user's wallet (deposit)
     */
    async deposit(
        depositDto: DepositRequestDTO,
        req: any,
    ): Promise<DepositResponseDTO> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new UnauthorizedException("User not authenticated");
        }

        const { amount, currency, paymentMethod } = depositDto;

        // Validate amount
        const amountDecimal = this.parseDecimal(amount);
        if (amountDecimal <= 0) {
            throw new BadRequestException("Amount must be greater than 0");
        }

        // Process payment through mock payment provider
        const paymentResult = await this.paymentProvider.processPayment({
            amount,
            currency: currency || "USD",
            paymentMethod: paymentMethod || "card",
        });

        if (!paymentResult.success) {
            throw new BadRequestException(
                paymentResult.message || "Payment processing failed",
            );
        }

        // Use QueryRunner for transaction with row-level lock
        const queryRunner: QueryRunner = this.entityManager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Get or create wallet with lock
            let wallet = await queryRunner.manager
                .createQueryBuilder(Wallet, "wallet")
                .where('"wallet"."userId" = :userId', { userId })
                .setLock("pessimistic_write")
                .getOne();

            if (!wallet) {
                // Create wallet if it doesn't exist (within transaction)
                const user = await queryRunner.manager.findOne(User, {
                    where: { id: userId },
                });

                if (!user) {
                    throw new NotFoundException("User not found");
                }

                wallet = new Wallet();
                wallet.user = user;
                wallet.balance = 0;
                wallet.withdrawFeePercentage = "0";
                wallet = await queryRunner.manager.save(wallet);

                // Reload with lock to ensure consistency
                wallet = await queryRunner.manager
                    .createQueryBuilder(Wallet, "wallet")
                    .where('"wallet"."id" = :walletId', { walletId: wallet.id })
                    .setLock("pessimistic_write")
                    .getOne();
            }

            if (!wallet) {
                throw new NotFoundException("Wallet not found");
            }

            // Update balance - wallet.balance is stored as bigint in base units (already multiplied by 100000000)
            // Work directly in base units to avoid precision loss from decimal conversion
            const amountInBaseUnits = Math.round(amountDecimal * 100000000);
            // Ensure wallet.balance is treated as a number (bigint from DB might be string)
            const currentBalanceBaseUnits = typeof wallet.balance === 'string' 
                ? parseInt(wallet.balance, 10) 
                : Number(wallet.balance);
            wallet.balance = currentBalanceBaseUnits + amountInBaseUnits;

            // Save wallet
            await queryRunner.manager.save(wallet);

            // Create transaction record
            const transaction = new Transaction();
            transaction.fromWallet = null; // Deposit - no sender
            transaction.toWallet = wallet;
            transaction.amount = amount;
            transaction.feeAmount = "0";
            transaction.type = TransactionType.Deposit;

            const savedTransaction = await queryRunner.manager.save(transaction);

            // Commit transaction
            await queryRunner.commitTransaction();

            return {
                paymentTransactionId: paymentResult.transactionId,
                transactionId: savedTransaction.id,
                balance: (wallet.balance / 100000000).toFixed(8),
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
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
     * Admin: deposit into a user's wallet (no payment provider)
     * Uses getOrCreateWallet to ensure wallet exists
     */
    async adminDeposit(dto: AdminDepositRequestDTO): Promise<{ transactionId: number; balance: string }> {
        const { userId, amount } = dto;
        const amountDecimal = this.parseDecimal(amount);
        if (amountDecimal <= 0) {
            throw new BadRequestException("Amount must be greater than 0");
        }

        // Validate user exists
        const user = await this.entityManager.findOne(User, { where: { id: userId } });
        if (!user) {
            throw new NotFoundException("User not found");
        }

        const queryRunner: QueryRunner = this.entityManager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Get or create wallet with lock (using query builder to avoid relation join issues)
            let wallet = await queryRunner.manager
                .createQueryBuilder(Wallet, "wallet")
                .where('"wallet"."userId" = :userId', { userId })
                .setLock("pessimistic_write")
                .getOne();

            if (!wallet) {
                // Create wallet if it doesn't exist (within transaction)
                wallet = new Wallet();
                wallet.user = user;
                wallet.balance = 0;
                wallet.withdrawFeePercentage = "0";
                wallet = await queryRunner.manager.save(wallet);

                // Reload with lock to ensure consistency
                wallet = await queryRunner.manager
                    .createQueryBuilder(Wallet, "wallet")
                    .where('"wallet"."id" = :walletId', { walletId: wallet.id })
                    .setLock("pessimistic_write")
                    .getOne();
            }

            if (!wallet) {
                throw new NotFoundException("Failed to get or create wallet");
            }

            // Update balance - wallet.balance is stored as bigint in base units (already multiplied by 100000000)
            // Work directly in base units to avoid precision loss from decimal conversion
            const amountInBaseUnits = Math.round(amountDecimal * 100000000);
            // Ensure wallet.balance is treated as a number (bigint from DB might be string)
            const currentBalanceBaseUnits = typeof wallet.balance === 'string' 
                ? parseInt(wallet.balance, 10) 
                : Number(wallet.balance);
            wallet.balance = currentBalanceBaseUnits + amountInBaseUnits;
            await queryRunner.manager.save(wallet);

            // Record transaction
            const transaction = new Transaction();
            transaction.fromWallet = null;
            transaction.toWallet = wallet;
            transaction.amount = amount;
            transaction.feeAmount = "0";
            transaction.type = TransactionType.Deposit;
            const savedTx = await queryRunner.manager.save(transaction);

            await queryRunner.commitTransaction();
            return { transactionId: savedTx.id, balance: (wallet.balance / 100000000).toFixed(8) };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Admin: transfer between users
     * Uses getOrCreateWallet logic to ensure wallets exist
     */
    async adminTransfer(dto: AdminTransferRequestDTO): Promise<{ transactionId: number; fromBalance: string; toBalance: string }> {
        const { fromUserId, toUserId, amount } = dto;
        if (fromUserId === toUserId) {
            throw new BadRequestException("Cannot transfer to the same user");
        }
        const amountDecimal = this.parseDecimal(amount);
        if (amountDecimal <= 0) {
            throw new BadRequestException("Amount must be greater than 0");
        }

        // Validate both users exist
        const fromUser = await this.entityManager.findOne(User, { where: { id: fromUserId } });
        const toUser = await this.entityManager.findOne(User, { where: { id: toUserId } });
        
        if (!fromUser) {
            throw new NotFoundException(`Source user ${fromUserId} not found`);
        }
        if (!toUser) {
            throw new NotFoundException(`Destination user ${toUserId} not found`);
        }

        const queryRunner: QueryRunner = this.entityManager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Process wallets in consistent order (by user id) to prevent deadlocks
            const userIds = [fromUserId, toUserId].sort((a, b) => a - b);
            const wallets: Wallet[] = [];

            for (const userId of userIds) {
                let wallet = await queryRunner.manager
                    .createQueryBuilder(Wallet, "wallet")
                    .where('"wallet"."userId" = :userId', { userId })
                    .setLock("pessimistic_write")
                    .getOne();

                if (!wallet) {
                    // Create wallet if it doesn't exist (within transaction)
                    const user = await queryRunner.manager.findOne(User, {
                        where: { id: userId },
                    });

                    if (!user) {
                        throw new NotFoundException(`User ${userId} not found`);
                    }

                    wallet = new Wallet();
                    wallet.user = user;
                    wallet.balance = 0;
                    wallet.withdrawFeePercentage = "0";
                    wallet = await queryRunner.manager.save(wallet);

                    // Reload with lock to ensure consistency (no relations loaded)
                    wallet = await queryRunner.manager
                    .getRepository(Wallet)
                    .findOne({
                        where: { id: wallet.id },
                        lock: { mode: "pessimistic_write" },
                    });
                }

                if (!wallet) {
                    throw new NotFoundException(`Wallet not found for user ${userId}`);
                }
                wallets.push(wallet);
            }

            // Get wallets by user ID
            const fromWallet = wallets.find(w => w.user.id === fromUserId);
            const toWallet = wallets.find(w => w.user.id === toUserId);

            if (!fromWallet || !toWallet) {
                throw new NotFoundException("Wallet not found");
            }

            // Validate sender has sufficient balance
            const fromBalance = this.parseDecimal(String(fromWallet.balance / 100000000));
            if (fromBalance < amountDecimal) {
                await queryRunner.rollbackTransaction();
                throw new BadRequestException("Insufficient balance");
            }

            // Update balances atomically - convert to integer (multiply by 10^8 for 8 decimals)
            fromWallet.balance = Math.round((fromBalance - amountDecimal) * 100000000);
            toWallet.balance = Math.round((this.parseDecimal(String(toWallet.balance / 100000000)) + amountDecimal) * 100000000);
            await queryRunner.manager.save([fromWallet, toWallet]);

            // Create transaction record
            const transaction = new Transaction();
            transaction.fromWallet = fromWallet;
            transaction.toWallet = toWallet;
            transaction.amount = amount;
            transaction.feeAmount = "0";
            transaction.type = TransactionType.Transfer;
            const savedTransaction = await queryRunner.manager.save(transaction);

            // Commit transaction
            await queryRunner.commitTransaction();

            return {
                transactionId: savedTransaction.id,
                fromBalance: (fromWallet.balance / 100000000).toFixed(8),
                toBalance: (toWallet.balance / 100000000).toFixed(8),
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Get wallet balance for a user (admin only)
     */
    async getBalance(userId: number): Promise<string> {
        const wallet = await this.getOrCreateWallet(userId);
        return (wallet.balance / 100000000).toFixed(8);
    }
}

