import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    Delete,
    Put,
    Req,
    HttpCode,
    HttpStatus,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ForumRoomService } from "@services/forum-room.service";
import { ForumRoomDTO } from "../../models/forum-room.dto";
import { CreateForumRoomDTO } from "../../models/create-forum-room.dto";
import { ForumRoomMemberDTO } from "../../models/forum-room-member.dto";
import { JoinForumRoomDTO } from "../../models/join-forum-room.dto";
import { LeaveForumRoomDTO } from "../../models/leave-forum-room.dto";

@Controller("forum-rooms")
@ApiTags("Forum Rooms")
export class ForumRoomController {
    constructor(private readonly forumRoomService: ForumRoomService) {}

    @Post()
    @ApiOperation({ summary: "Create a new forum room" })
    @ApiResponse({
        status: 201,
        description: "Room created successfully",
        type: ForumRoomDTO,
    })
    @ApiResponse({ status: 400, description: "Invalid input" })
    @ApiResponse({ status: 404, description: "User not found" })
    async createRoom(
        @Body() dto: CreateForumRoomDTO,
        @Req() req: any,
    ): Promise<ForumRoomDTO> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        return this.forumRoomService.createRoom(userId, dto);
    }

    @Get()
    @ApiOperation({
        summary: "Get all forum rooms (filtered by visibility/status)",
    })
    @ApiResponse({
        status: 200,
        description: "Rooms retrieved successfully",
        type: [ForumRoomDTO],
    })
    async getRooms(
        @Query("visibility") visibility?: string,
        @Query("status") status?: string,
        @Req() req?: any,
    ): Promise<ForumRoomDTO[]> {
        const userId = req?.userData?.id;
        return this.forumRoomService.getRooms(userId, { visibility, status });
    }

    @Get("my-rooms")
    @ApiOperation({ summary: "Get rooms user is a member of" })
    @ApiResponse({
        status: 200,
        description: "User rooms retrieved successfully",
        type: [ForumRoomDTO],
    })
    async getMyRooms(@Req() req: any): Promise<ForumRoomDTO[]> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        return this.forumRoomService.getMyRooms(userId);
    }

    @Get(":id")
    @ApiOperation({ summary: "Get room by ID" })
    @ApiResponse({
        status: 200,
        description: "Room retrieved successfully",
        type: ForumRoomDTO,
    })
    @ApiResponse({ status: 404, description: "Room not found" })
    async getRoomById(
        @Param("id") id: number,
        @Req() req?: any,
    ): Promise<ForumRoomDTO> {
        const userId = req?.userData?.id;
        return this.forumRoomService.getRoomById(Number(id), userId);
    }

    @Post(":id/join")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Join a forum room" })
    @ApiResponse({
        status: 200,
        description: "Joined room successfully",
        type: ForumRoomMemberDTO,
    })
    @ApiResponse({ status: 400, description: "Already a member or room full" })
    @ApiResponse({ status: 403, description: "Room is private or user banned" })
    @ApiResponse({ status: 404, description: "Room not found" })
    async joinRoom(
        @Param("id") id: number,
        @Body() dto: JoinForumRoomDTO,
        @Req() req: any,
    ): Promise<ForumRoomMemberDTO> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        // Use dto.roomId if provided, otherwise use URL param
        const roomId = dto.roomId || Number(id);
        return this.forumRoomService.joinRoom(userId, roomId);
    }

    @Post(":id/leave")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Leave a forum room" })
    @ApiResponse({
        status: 200,
        description: "Left room successfully",
    })
    @ApiResponse({ status: 400, description: "Not a member or last admin" })
    @ApiResponse({ status: 404, description: "Room not found" })
    async leaveRoom(
        @Param("id") id: number,
        @Body() dto: LeaveForumRoomDTO,
        @Req() req: any,
    ): Promise<void> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        // Use dto.roomId if provided, otherwise use URL param
        const roomId = dto.roomId || Number(id);
        return this.forumRoomService.leaveRoom(userId, roomId);
    }

    @Get(":id/members")
    @ApiOperation({ summary: "Get all members of a room" })
    @ApiResponse({
        status: 200,
        description: "Members retrieved successfully",
        type: [ForumRoomMemberDTO],
    })
    @ApiResponse({ status: 403, description: "No access to room" })
    @ApiResponse({ status: 404, description: "Room not found" })
    async getRoomMembers(
        @Param("id") id: number,
        @Req() req?: any,
    ): Promise<ForumRoomMemberDTO[]> {
        const userId = req?.userData?.id;
        return this.forumRoomService.getRoomMembers(Number(id), userId);
    }

    @Put(":id/members/:userId/role")
    @ApiOperation({ summary: "Update member role (admin/moderator only)" })
    @ApiResponse({
        status: 200,
        description: "Role updated successfully",
        type: ForumRoomMemberDTO,
    })
    @ApiResponse({ status: 403, description: "Not an admin" })
    @ApiResponse({ status: 404, description: "Room or member not found" })
    async updateMemberRole(
        @Param("id") roomId: number,
        @Param("userId") targetUserId: number,
        @Body() body: { role: "admin" | "moderator" | "member" },
        @Req() req: any,
    ): Promise<ForumRoomMemberDTO> {
        const adminUserId = req.userData?.id;
        if (!adminUserId) {
            throw new Error("User not authenticated");
        }
        return this.forumRoomService.updateRoomMemberRole(
            Number(roomId),
            Number(targetUserId),
            body.role,
            adminUserId,
        );
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete a forum room (admin/creator only)" })
    @ApiResponse({
        status: 200,
        description: "Room deleted successfully",
    })
    @ApiResponse({ status: 403, description: "Not an admin or creator" })
    @ApiResponse({ status: 404, description: "Room not found" })
    async deleteRoom(@Param("id") id: number, @Req() req: any): Promise<void> {
        const userId = req.userData?.id;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        return this.forumRoomService.deleteRoom(Number(id), userId);
    }
}
