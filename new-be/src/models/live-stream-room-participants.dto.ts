import { ApiProperty } from "@nestjs/swagger";
import { UserDTO } from "./user.dto";

export class LiveStreamRoomParticipantsDTO {
    @ApiProperty({ description: "ID of the stream room/session" })
    sessionId: string;

    @ApiProperty({ type: [UserDTO], description: "List of participants in the room" })
    participants: UserDTO[];

    @ApiProperty({ description: "Current number of participants" })
    participantCount: number;

    @ApiProperty({ description: "Maximum allowed participants" })
    maxParticipants: number;
}
