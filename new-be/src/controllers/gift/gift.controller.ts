import {
    Body,
    Controller,
    Post,
    Get,
    Req,
    Query,
    Param,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
    Res,
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
import { Response } from "express";
import * as path from "path";
import * as fs from "fs";

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

    @Get("/available")
    @ApiOperation({ summary: "Get list of available gift images" })
    @ApiResponse({
        status: 200,
        description: "Returns list of available gift image names",
        schema: {
            type: "object",
            properties: {
                giftImages: {
                    type: "array",
                    items: { type: "string" },
                },
            },
        },
    })
    async getAvailableGiftImages(): Promise<{ giftImages: string[] }> {
        return {
            giftImages: [
                "img.png",
                "img_1.png",
                "img_2.png",
                "img_3.png",
                "img_4.png",
                "img_5.png",
                "img_6.png",
                "img_7.png",
                "image.png",
            ],
        };
    }

    @Get("/image/:filename")
    @ApiOperation({ summary: "Get gift image file" })
    @ApiResponse({
        status: 200,
        description: "Returns gift image",
        content: {
            "image/png": {
                schema: {
                    type: "string",
                    format: "binary",
                },
            },
            "image/jpeg": {
                schema: {
                    type: "string",
                    format: "binary",
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: "Image not found" })
    async getGiftImage(
        @Param("filename") filename: string,
        @Res() res: Response,
    ): Promise<void> {
        // Security: Only allow alphanumeric, underscore, dash, and dot
        if (!/^[a-zA-Z0-9._-]+\.(png|jpg|jpeg)$/.test(filename)) {
            res.status(400).send("Invalid filename");
            return;
        }

        // Path to gift images in project root
        const imagePath = path.join(process.cwd(), filename);

        if (!fs.existsSync(imagePath)) {
            res.status(404).send("Image not found");
            return;
        }

        // Detect content type
        let contentType = "image/png";
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
            contentType = "image/jpeg";
        }

        res.set("Content-Type", contentType);
        const readStream = fs.createReadStream(imagePath);
        readStream.pipe(res);
    }
}

