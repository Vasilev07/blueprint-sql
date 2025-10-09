import { Controller, Post, Body, Get, Param, Put, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { FriendService } from "../../services/friend.service";
import { FriendshipStatus } from "../../entities/friend.entity";
import { FriendDTO } from "../../models/friend.dto";
import { RespondFriendRequestDTO } from "../../models/respond-friend-request.dto";

@ApiTags("Friends")
@Controller("friends")
export class FriendController {
    constructor(private readonly friendService: FriendService) {}

    @Post("request/:friendId")
    async sendFriendRequest(
        @Param("friendId") friendId: number,
        @Req() req: any,
    ): Promise<FriendDTO> {
        return this.friendService.createFriendRequest(friendId, req);
    }

    @Get("status/:userId")
    async getFriendshipStatus(
        @Param("userId") userId: number,
        @Req() req: any,
    ): Promise<FriendshipStatus | null> {
        return this.friendService.getFriendshipStatus(userId, req);
    }

    @Put("respond/:userId")
    @ApiOperation({ summary: "Respond to a friend request" })
    @ApiResponse({
        status: 200,
        description: "Friend request updated",
        type: FriendDTO,
    })
    async respondToRequest(
        @Param("userId") userId: number,
        @Body() body: RespondFriendRequestDTO,
        @Req() req: any,
    ): Promise<FriendDTO> {
        return this.friendService.updateFriendshipStatus(
            userId,
            body.status,
            req,
        );
    }

    @Get("requests/incoming")
    async getIncomingRequests(@Req() req: any): Promise<FriendDTO[]> {
        return this.friendService.getIncomingRequests(req);
    }

    @Get("requests/outgoing")
    async getOutgoingRequests(@Req() req: any): Promise<FriendDTO[]> {
        return this.friendService.getOutgoingRequests(req);
    }

    @Get("accepted")
    async getAcceptedFriends(@Req() req: any): Promise<FriendDTO[]> {
        return this.friendService.getAcceptedFriends(req);
    }

    @Get("statuses/batch")
    @ApiOperation({ summary: "Get friendship statuses for all users in batch" })
    @ApiResponse({
        status: 200,
        description: "Returns map of userId to friendship status",
    })
    async getBatchFriendshipStatuses(
        @Req() req: any,
    ): Promise<Record<number, FriendshipStatus | null>> {
        return this.friendService.getBatchFriendshipStatuses(req);
    }
}
