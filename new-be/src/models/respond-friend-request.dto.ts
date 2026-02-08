import { ApiProperty } from "@nestjs/swagger";
import { FriendshipStatus } from "../entities/friend.entity";

export class RespondFriendRequestDTO {
    @ApiProperty({
        enum: FriendshipStatus,
        description: "The response status (accepted or blocked)",
    })
    status: FriendshipStatus;
}
