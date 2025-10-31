import {
    Body,
    Controller,
    Post,
    Get,
    Req,
    Query,
    HttpCode,
    HttpStatus,
} from "@nestjs/common";
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
} from "@nestjs/swagger";
import { GiftService } from "src/services/gift.service";
import {
    SendGiftRequestDTO,
    SendGiftResponseDTO,
    GiftDTO,
} from "../../models/gift.dto";
import { UseGuards } from "@nestjs/common";
import { AdminGuard } from "../../guards/admin.guard";

@Controller("/gifts")
@ApiTags("Gift")
export class GiftController {
    constructor(private readonly giftService: GiftService) {}

    @Post("/send")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Send a gift to another user" })
    @ApiBody({ type: SendGiftRequestDTO })
    @ApiResponse({
        status: 201,
        description: "Gift sent successfully",
        type: SendGiftResponseDTO,
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
    async sendGift(
        @Body() sendGiftDto: SendGiftRequestDTO,
        @Req() req: any,
    ): Promise<SendGiftResponseDTO> {
        return await this.giftService.sendGift(sendGiftDto, req);
    }

    @Get("/received")
    @ApiOperation({ summary: "Get gifts received by authenticated user" })
    @ApiResponse({
        status: 200,
        description: "Returns list of received gifts",
        type: [GiftDTO],
    })
    @ApiResponse({
        status: 401,
        description: "Unauthorized - invalid or missing token",
    })
    async getReceivedGifts(
        @Req() req: any,
        @Query("limit") limit?: number,
    ): Promise<GiftDTO[]> {
        return await this.giftService.getReceivedGifts(req, limit);
    }

    @Get("/sent")
    @ApiOperation({ summary: "Get gifts sent by authenticated user" })
    @ApiResponse({
        status: 200,
        description: "Returns list of sent gifts",
        type: [GiftDTO],
    })
    @ApiResponse({
        status: 401,
        description: "Unauthorized - invalid or missing token",
    })
    async getSentGifts(
        @Req() req: any,
        @Query("limit") limit?: number,
    ): Promise<GiftDTO[]> {
        return await this.giftService.getSentGifts(req, limit);
    }

    @UseGuards(AdminGuard)
    @Get("/all")
    @ApiOperation({ summary: "Get all gifts (Admin only)" })
    @ApiResponse({
        status: 200,
        description: "Returns paginated list of all gifts",
        schema: {
            type: "object",
            properties: {
                gifts: { type: "array", items: { $ref: "#/components/schemas/GiftDTO" } },
                total: { type: "number" },
                page: { type: "number" },
                limit: { type: "number" },
            },
        },
    })
    async getAllGifts(
        @Query("userId") userId?: number,
        @Query("page") page: number = 1,
        @Query("limit") limit: number = 20,
    ): Promise<{ gifts: GiftDTO[]; total: number; page: number; limit: number }> {
        return await this.giftService.getAllGifts(userId, page, limit);
    }

}

