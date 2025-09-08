import { FriendshipStatus } from '../entities/friend.entity';
import { ApiProperty } from '@nestjs/swagger';

export class FriendDTO {
    @ApiProperty()
    @ApiProperty()
    @ApiProperty({ enum: FriendshipStatus })
    userId: number;
    friendId: number;
    status: FriendshipStatus;
}