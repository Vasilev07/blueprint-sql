import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
} from "@nestjs/common";
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiParam,
    ApiQuery,
} from "@nestjs/swagger";
import { LiveStreamSessionService } from "../../services/live-stream-session.service";
import { LiveStreamSessionDTO } from "../../models/live-stream-session.dto";
import { StartLiveStreamSessionDTO } from "../../models/start-live-stream-session.dto";
import { EndCallDTO } from "../../models/end-call.dto";
import { CreateLiveStreamRoomDTO } from "../../models/create-live-stream-room.dto";
import { JoinLiveStreamRoomDTO } from "../../models/join-live-stream-room.dto";
import { LeaveLiveStreamRoomDTO } from "../../models/leave-live-stream-room.dto";

@Controller("live-stream-sessions")
@ApiTags("Live Stream Sessions")
export class LiveStreamSessionController {
    constructor(
        private readonly liveStreamSessionService: LiveStreamSessionService,
    ) {}

    @Post("start")
    @ApiOperation({ summary: "Start a new live stream session" })
    @ApiResponse({
        status: 201,
        description: "Session started successfully",
        type: LiveStreamSessionDTO,
    })
    @ApiResponse({
        status: 400,
        description: "Invalid request or users already in a session",
    })
    @ApiResponse({
        status: 404,
        description: "One or both users not found",
    })
    async startSession(
        @Body() startSessionDto: StartLiveStreamSessionDTO,
    ): Promise<LiveStreamSessionDTO> {
        return this.liveStreamSessionService.startSession(startSessionDto);
    }

    @Get(":id")
    @ApiOperation({ summary: "Get session details by ID" })
    @ApiParam({
        name: "id",
        description: "Session ID (UUID)",
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: "Session details retrieved successfully",
        type: LiveStreamSessionDTO,
    })
    @ApiResponse({
        status: 404,
        description: "Session not found",
    })
    async getSessionById(
        @Param("id") id: string,
    ): Promise<LiveStreamSessionDTO> {
        return this.liveStreamSessionService.getSessionById(id);
    }

    @Patch(":id/end")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "End an active session" })
    @ApiParam({
        name: "id",
        description: "Session ID (UUID)",
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: "Session ended successfully",
        type: LiveStreamSessionDTO,
    })
    @ApiResponse({
        status: 404,
        description: "Session not found",
    })
    async endSession(
        @Param("id") id: string,
        @Body() endCallDto: EndCallDTO,
    ): Promise<LiveStreamSessionDTO> {
        return this.liveStreamSessionService.endSession(
            id,
            endCallDto.endReason,
        );
    }

    @Get("user/:userId")
    @ApiOperation({ summary: "Get session history for a user" })
    @ApiParam({
        name: "userId",
        description: "User ID",
        type: Number,
    })
    @ApiQuery({
        name: "limit",
        description: "Maximum number of sessions to return",
        required: false,
        type: Number,
    })
    @ApiResponse({
        status: 200,
        description: "Session history retrieved successfully",
        type: [LiveStreamSessionDTO],
    })
    async getSessionsByUserId(
        @Param("userId") userId: number,
        @Query("limit") limit?: number,
    ): Promise<LiveStreamSessionDTO[]> {
        return this.liveStreamSessionService.getSessionsByUserId(
            Number(userId),
            limit ? Number(limit) : 50,
        );
    }

    @Get("user/:userId/active")
    @ApiOperation({ summary: "Get active session for a user" })
    @ApiParam({
        name: "userId",
        description: "User ID",
        type: Number,
    })
    @ApiResponse({
        status: 200,
        description:
            "Active session retrieved successfully (or null if no active session)",
        type: LiveStreamSessionDTO,
    })
    async getActiveSessionByUserId(
        @Param("userId") userId: number,
    ): Promise<LiveStreamSessionDTO | null> {
        return this.liveStreamSessionService.getActiveSessionByUserId(
            Number(userId),
        );
    }

    // Live streaming room endpoints
    @Post("live-stream-rooms")
    @ApiOperation({ summary: "Create a new live streaming room" })
    @ApiResponse({
        status: 201,
        description: "Live streaming room created successfully",
        type: LiveStreamSessionDTO,
    })
    @ApiResponse({
        status: 400,
        description: "Invalid request data",
    })
    @ApiResponse({
        status: 404,
        description: "User not found",
    })
    async createLiveStreamRoom(
        @Body() createLiveStreamRoomDto: CreateLiveStreamRoomDTO,
    ): Promise<LiveStreamSessionDTO> {
        return this.liveStreamSessionService.createLiveStreamRoom(
            createLiveStreamRoomDto,
        );
    }

    @Post("live-stream-rooms/join")
    @ApiOperation({ summary: "Join a live streaming room" })
    @ApiResponse({
        status: 200,
        description: "Successfully joined live streaming room",
        type: LiveStreamSessionDTO,
    })
    @ApiResponse({
        status: 400,
        description: "Invalid request or room not active",
    })
    @ApiResponse({
        status: 404,
        description: "Room or user not found",
    })
    async joinLiveStreamRoom(
        @Body() joinLiveStreamRoomDto: JoinLiveStreamRoomDTO,
    ): Promise<LiveStreamSessionDTO> {
        return this.liveStreamSessionService.joinLiveStreamRoom(
            joinLiveStreamRoomDto,
        );
    }

    @Post("live-stream-rooms/leave")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Leave a live streaming room" })
    @ApiResponse({
        status: 200,
        description: "Successfully left live streaming room",
    })
    @ApiResponse({
        status: 400,
        description: "Invalid request",
    })
    @ApiResponse({
        status: 404,
        description: "Room or user not found",
    })
    async leaveLiveStreamRoom(
        @Body() leaveLiveStreamRoomDto: LeaveLiveStreamRoomDTO,
    ): Promise<void> {
        return this.liveStreamSessionService.leaveLiveStreamRoom(
            leaveLiveStreamRoomDto,
        );
    }

    @Get("live-stream-rooms")
    @ApiOperation({ summary: "Get list of active live streaming rooms" })
    @ApiQuery({
        name: "limit",
        description: "Maximum number of rooms to return",
        required: false,
        type: Number,
    })
    @ApiResponse({
        status: 200,
        description: "Active live streaming rooms retrieved successfully",
        type: [LiveStreamSessionDTO],
    })
    async getLiveStreamRooms(
        @Query("limit") limit?: number,
    ): Promise<LiveStreamSessionDTO[]> {
        return this.liveStreamSessionService.getLiveStreamRooms(
            limit ? Number(limit) : 50,
        );
    }

    @Get("live-stream-rooms/:id")
    @ApiOperation({ summary: "Get live streaming room details by ID" })
    @ApiParam({
        name: "id",
        description: "Live stream room ID (UUID)",
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: "Live stream room details retrieved successfully",
        type: LiveStreamSessionDTO,
    })
    @ApiResponse({
        status: 400,
        description: "This is not a live streaming room",
    })
    @ApiResponse({
        status: 404,
        description: "Live stream room not found",
    })
    async getLiveStreamRoomById(
        @Param("id") id: string,
    ): Promise<LiveStreamSessionDTO> {
        return this.liveStreamSessionService.getLiveStreamRoomById(id);
    }
}
