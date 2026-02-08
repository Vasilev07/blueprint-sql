import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Request,
} from "@nestjs/common";
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
} from "@nestjs/swagger";
import { SuperLikeService } from "../../services/super-like.service";
import { AuthGuard } from "../../guards/auth.guard";
import {
    SendSuperLikeRequestDTO,
    SendSuperLikeResponseDTO,
} from "../../models/super-like.dto";

@ApiTags("Super Like")
@Controller("super-like")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class SuperLikeController {
    constructor(private readonly superLikeService: SuperLikeService) {}

    @Post()
    @ApiOperation({
        summary: "Send a super like to another user (costs 200 tokens)",
    })
    @ApiBody({ type: SendSuperLikeRequestDTO })
    @ApiResponse({
        status: 201,
        description: "Super like sent successfully",
        type: SendSuperLikeResponseDTO,
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
        description: "Receiver user not found",
    })
    async sendSuperLike(
        @Request() req,
        @Body() body: SendSuperLikeRequestDTO,
    ): Promise<SendSuperLikeResponseDTO> {
        return this.superLikeService.sendSuperLike(body, req);
    }

    @Get("/can-afford")
    @ApiOperation({
        summary:
            "Check if authenticated user can afford to send a super like (200 tokens)",
    })
    @ApiResponse({
        status: 200,
        description: "Returns whether user can afford super like",
        schema: {
            type: "object",
            properties: {
                canAfford: { type: "boolean" },
                balance: { type: "string" },
                cost: { type: "string" },
            },
        },
    })
    async canAffordSuperLike(@Request() req) {
        return this.superLikeService.canAffordSuperLike(req);
    }

    @Get()
    @ApiOperation({ summary: "Get super likes received by the current user" })
    @ApiResponse({ status: 200, description: "List of received super likes" })
    async getSuperLikes(@Request() req) {
        return this.superLikeService.getSuperLikesForUser(req.userData.id);
    }
}
