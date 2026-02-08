import {
    Body,
    Controller,
    Post,
    Get,
    Req,
    Param,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { WalletService } from "src/services/wallet.service";
import {
    TransferRequestDTO,
    TransferResponseDTO,
} from "../../models/transfer.dto";
import {
    DepositRequestDTO,
    DepositResponseDTO,
} from "../../models/deposit.dto";
import { UseGuards } from "@nestjs/common";
import { AdminGuard } from "../../guards/admin.guard";
import {
    AdminDepositRequestDTO,
    AdminTransferRequestDTO,
} from "../../models/admin-wallet.dto";
import { EntityManager } from "typeorm";

@Controller("/wallets")
@ApiTags("Wallet")
export class WalletController {
    constructor(
        private readonly walletService: WalletService,
        private readonly entityManager: EntityManager,
    ) {}

    @Post("/transfer")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: "Transfer tokens from authenticated user to another user",
    })
    @ApiBody({ type: TransferRequestDTO })
    @ApiResponse({
        status: 200,
        description: "Transfer completed successfully",
        type: TransferResponseDTO,
    })
    @ApiResponse({
        status: 400,
        description: "Bad request - validation failed or insufficient balance",
    })
    @ApiResponse({
        status: 401,
        description: "Unauthorized - invalid or missing token",
    })
    @ApiResponse({
        status: 404,
        description: "Recipient user not found",
    })
    async transfer(
        @Body() transferDto: TransferRequestDTO,
        @Req() req: any,
    ): Promise<TransferResponseDTO> {
        return await this.walletService.transfer(transferDto, req);
    }

    @Post("/deposit")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Add funds to authenticated user's wallet" })
    @ApiBody({ type: DepositRequestDTO })
    @ApiResponse({
        status: 200,
        description: "Deposit completed successfully",
        type: DepositResponseDTO,
    })
    @ApiResponse({
        status: 400,
        description:
            "Bad request - validation failed or payment processing failed",
    })
    @ApiResponse({
        status: 401,
        description: "Unauthorized - invalid or missing token",
    })
    async deposit(
        @Body() depositDto: DepositRequestDTO,
        @Req() req: any,
    ): Promise<DepositResponseDTO> {
        return await this.walletService.deposit(depositDto, req);
    }

    // Admin endpoints
    @UseGuards(AdminGuard)
    @Post("/admin/deposit")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Admin deposit into a user's wallet" })
    async adminDeposit(
        @Body() body: AdminDepositRequestDTO,
    ): Promise<{ transactionId: number; balance: string }> {
        return this.walletService.adminDeposit(body);
    }

    @UseGuards(AdminGuard)
    @Post("/admin/transfer")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Admin transfer between users" })
    async adminTransfer(@Body() body: AdminTransferRequestDTO): Promise<{
        transactionId: number;
        fromBalance: string;
        toBalance: string;
    }> {
        return this.walletService.adminTransfer(body);
    }

    @UseGuards(AdminGuard)
    @Get("/admin/balance/:userId")
    @ApiOperation({ summary: "Get wallet balance for a user (admin only)" })
    @ApiResponse({
        status: 200,
        description: "Wallet balance retrieved successfully",
        schema: {
            type: "object",
            properties: {
                balance: { type: "string" },
            },
        },
    })
    async getBalance(
        @Param("userId", ParseIntPipe) userId: number,
    ): Promise<{ balance: string }> {
        const balance = await this.walletService.getBalance(userId);
        return { balance };
    }

    @UseGuards(AdminGuard)
    @Get("/admin/users")
    @ApiOperation({ summary: "List users with wallet balances (admin)" })
    @ApiResponse({ status: 200, description: "Returns users with balances" })
    async listUsersWithBalance(
        @Param() _unused?: any,
        @Req() _req?: any,
    ): Promise<{
        users: Array<{
            id: number;
            firstname: string;
            lastname: string;
            email: string;
            balance: string;
        }>;
    }> {
        // Simple listing without pagination for admin management UI; extend as needed
        // Convert balance from base units (bigint) to decimal by dividing by 100000000
        const rows = await this.entityManager
            .createQueryBuilder()
            .from("user", "u")
            .leftJoin("wallet", "w", 'w."userId" = u.id')
            .select([
                "u.id AS id",
                "u.firstname AS firstname",
                "u.lastname AS lastname",
                "u.email AS email",
            ])
            .addSelect("COALESCE(w.balance, 0) / 100000000.0", "balance")
            .orderBy("u.id", "ASC")
            .limit(1000)
            .getRawMany<{
                id: number;
                firstname: string;
                lastname: string;
                email: string;
                balance: number | string;
            }>();

        return {
            users: rows.map((r) => {
                // Ensure balance is converted to number before calling toFixed
                const balanceValue =
                    typeof r.balance === "string"
                        ? parseFloat(r.balance)
                        : (r.balance ?? 0);
                return {
                    id: r.id,
                    firstname: r.firstname,
                    lastname: r.lastname,
                    email: r.email,
                    balance: Number(balanceValue).toFixed(8),
                };
            }),
        };
    }
}
