import { Controller, Post, Body, Get, Param, Put, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FriendService } from '../../services/friend.service';
import { FriendshipStatus } from '../../entities/friend.entity';
import { FriendDTO } from '../../models/friend.dto';

@ApiTags('Friends')
@Controller('friends')
export class FriendController {
    constructor(private readonly friendService: FriendService) {}

    @Post('request/:friendId')
    async sendFriendRequest(
        @Param('friendId') friendId: number,
        @Req() req: any
    ): Promise<FriendDTO> {
        return this.friendService.createFriendRequest(friendId, req);
    }

    @Get('status/:userId')
    async getFriendshipStatus(
        @Param('userId') userId: number,
        @Req() req: any
    ): Promise<FriendshipStatus | null> {
        return this.friendService.getFriendshipStatus(userId, req);
    }

    @Put('respond/:userId')
    async respondToRequest(
        @Param('userId') userId: number,
        @Body('status') status: FriendshipStatus,
        @Req() req: any
    ): Promise<FriendDTO> {
        return this.friendService.updateFriendshipStatus(userId, status, req);
    }
}