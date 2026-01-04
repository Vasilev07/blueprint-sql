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
import { SendSuperLikeRequestDTO } from "../../models/super-like.dto";

@ApiTags("Super Like")
@Controller("super-like")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class SuperLikeController {
    constructor(private readonly superLikeService: SuperLikeService) {}

    @Post()
    @ApiOperation({ summary: "Send a super like to another user" })
    @ApiBody({ type: SendSuperLikeRequestDTO })
    @ApiResponse({ status: 201, description: "Super like sent successfully" })
    async sendSuperLike(@Request() req, @Body() body: SendSuperLikeRequestDTO) {
        return this.superLikeService.sendSuperLike(
            req.userData.id,
            body.receiverId,
        );
    }

    @Get()
    @ApiOperation({ summary: "Get super likes received by the current user" })
    @ApiResponse({ status: 200, description: "List of received super likes" })
    async getSuperLikes(@Request() req) {
        return this.superLikeService.getSuperLikesForUser(req.userData.id);
    }
}
