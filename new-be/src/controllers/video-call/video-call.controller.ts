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
import { VideoCallService } from "../../services/video-call.service";
import { VideoCallDTO } from "../../models/video-call.dto";
import { StartCallDTO } from "../../models/start-call.dto";
import { EndCallDTO } from "../../models/end-call.dto";

@Controller("video-calls")
@ApiTags("Video Calls")
export class VideoCallController {
    constructor(private readonly videoCallService: VideoCallService) {}

    @Post("start")
    @ApiOperation({ summary: "Start a new video call" })
    @ApiResponse({
        status: 201,
        description: "Call started successfully",
        type: VideoCallDTO,
    })
    @ApiResponse({
        status: 400,
        description: "Invalid request or users already in a call",
    })
    @ApiResponse({
        status: 404,
        description: "One or both users not found",
    })
    async startCall(@Body() startCallDto: StartCallDTO): Promise<VideoCallDTO> {
        return this.videoCallService.startCall(startCallDto);
    }

    @Get(":id")
    @ApiOperation({ summary: "Get call details by ID" })
    @ApiParam({
        name: "id",
        description: "Call ID (UUID)",
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: "Call details retrieved successfully",
        type: VideoCallDTO,
    })
    @ApiResponse({
        status: 404,
        description: "Call not found",
    })
    async getCallById(@Param("id") id: string): Promise<VideoCallDTO> {
        return this.videoCallService.getCallById(id);
    }

    @Patch(":id/end")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "End an active call" })
    @ApiParam({
        name: "id",
        description: "Call ID (UUID)",
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: "Call ended successfully",
        type: VideoCallDTO,
    })
    @ApiResponse({
        status: 404,
        description: "Call not found",
    })
    async endCall(
        @Param("id") id: string,
        @Body() endCallDto: EndCallDTO,
    ): Promise<VideoCallDTO> {
        return this.videoCallService.endCall(id, endCallDto.endReason);
    }

    @Get("user/:userId")
    @ApiOperation({ summary: "Get call history for a user" })
    @ApiParam({
        name: "userId",
        description: "User ID",
        type: Number,
    })
    @ApiQuery({
        name: "limit",
        description: "Maximum number of calls to return",
        required: false,
        type: Number,
    })
    @ApiResponse({
        status: 200,
        description: "Call history retrieved successfully",
        type: [VideoCallDTO],
    })
    async getCallsByUserId(
        @Param("userId") userId: number,
        @Query("limit") limit?: number,
    ): Promise<VideoCallDTO[]> {
        return this.videoCallService.getCallsByUserId(
            Number(userId),
            limit ? Number(limit) : 50,
        );
    }

    @Get("user/:userId/active")
    @ApiOperation({ summary: "Get active call for a user" })
    @ApiParam({
        name: "userId",
        description: "User ID",
        type: Number,
    })
    @ApiResponse({
        status: 200,
        description: "Active call retrieved successfully (or null if no active call)",
        type: VideoCallDTO,
    })
    async getActiveCallByUserId(
        @Param("userId") userId: number,
    ): Promise<VideoCallDTO | null> {
        return this.videoCallService.getActiveCallByUserId(Number(userId));
    }
}

