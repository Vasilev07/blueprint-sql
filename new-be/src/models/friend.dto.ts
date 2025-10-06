import { FriendshipStatus } from '../entities/friend.entity';
import { ApiProperty } from '@nestjs/swagger';

export class FriendDTO {
    @ApiProperty()
    userId: number;

    @ApiProperty()
    friendId: number;

    @ApiProperty({ enum: FriendshipStatus })
    status: FriendshipStatus;

    @ApiProperty({ required: false })
    user?: {
        id: number;
        firstname: string;
        lastname: string;
        email: string;
    };

    @ApiProperty({ required: false })
    friend?: {
        id: number;
        firstname: string;
        lastname: string;
        email: string;
    };
}