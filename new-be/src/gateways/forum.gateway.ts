import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable } from "@nestjs/common";
import { ForumRoomService } from "../services/forum-room.service";
import { ForumPostService } from "../services/forum-post.service";
import { ForumCommentService } from "../services/forum-comment.service";
import { CreateForumPostDTO } from "../models/create-forum-post.dto";
import { CreateForumCommentDTO } from "../models/create-forum-comment.dto";
import { ForumPostDTO } from "../models/forum-post.dto";
import { ForumCommentDTO } from "../models/forum-comment.dto";

@WebSocketGateway({
    cors: {
        origin: ["http://localhost:4200", "app.impulseapp.net"],
        credentials: true,
    },
    transports: ["websocket", "polling"],
})
@Injectable()
export class ForumGateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private forumRoomService: ForumRoomService,
        private forumPostService: ForumPostService,
        private forumCommentService: ForumCommentService,
    ) {}

    @SubscribeMessage("forum:join-room")
    async handleJoinRoom(
        @MessageBody() payload: { roomId: number },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = parseInt(client.handshake.query.userId as string);

            if (!userId) {
                return { error: true, message: "User not authenticated" };
            }

            // Verify user is member of room
            const member = await this.forumRoomService.checkUserIsMember(
                payload.roomId,
                userId,
            );

            if (!member) {
                return { error: true, message: "Not a member of this room" };
            }

            // Join socket room
            client.join(`forum-room:${payload.roomId}`);

            return { success: true, roomId: payload.roomId };
        } catch (err: any) {
            const message =
                typeof err?.message === "string"
                    ? err.message
                    : "Failed to join room";
            return { error: true, message };
        }
    }

    @SubscribeMessage("forum:leave-room")
    async handleLeaveRoom(
        @MessageBody() payload: { roomId: number },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            client.leave(`forum-room:${payload.roomId}`);
            return { success: true, roomId: payload.roomId };
        } catch (err: any) {
            const message =
                typeof err?.message === "string"
                    ? err.message
                    : "Failed to leave room";
            return { error: true, message };
        }
    }

    // Post events
    @SubscribeMessage("forum:post:create")
    async handlePostCreate(
        @MessageBody() dto: CreateForumPostDTO,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = parseInt(client.handshake.query.userId as string);

            if (!userId) {
                return { error: true, message: "User not authenticated" };
            }

            // Create post via service (which validates permissions)
            const post = await this.forumPostService.createPost(userId, dto);

            // Broadcast to room
            this.server.to(`forum-room:${dto.roomId}`).emit("forum:post:created", {
                roomId: dto.roomId,
                post: post,
            });

            return { success: true, post };
        } catch (err: any) {
            const message =
                typeof err?.message === "string"
                    ? err.message
                    : "Failed to create post";
            return { error: true, message };
        }
    }

    // Comment events
    @SubscribeMessage("forum:comment:create")
    async handleCommentCreate(
        @MessageBody() dto: CreateForumCommentDTO,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = parseInt(client.handshake.query.userId as string);

            if (!userId) {
                return { error: true, message: "User not authenticated" };
            }

            // Create comment via service (which validates permissions)
            const comment = await this.forumCommentService.createComment(
                userId,
                dto,
            );

            // Get post to find roomId
            const post = await this.forumPostService.getPostById(
                dto.postId,
                userId,
            );

            // Broadcast to room
            this.server
                .to(`forum-room:${post.roomId}`)
                .emit("forum:comment:created", {
                    postId: dto.postId,
                    comment: comment,
                });

            return { success: true, comment };
        } catch (err: any) {
            const message =
                typeof err?.message === "string"
                    ? err.message
                    : "Failed to create comment";
            return { error: true, message };
        }
    }

    // Helper methods to emit events from services
    emitPostCreated(roomId: number, post: ForumPostDTO): void {
        this.server.to(`forum-room:${roomId}`).emit("forum:post:created", {
            roomId,
            post,
        });
    }

    emitPostUpdated(roomId: number, post: ForumPostDTO): void {
        this.server.to(`forum-room:${roomId}`).emit("forum:post:updated", {
            roomId,
            post,
        });
    }

    emitPostDeleted(roomId: number, postId: number): void {
        this.server.to(`forum-room:${roomId}`).emit("forum:post:deleted", {
            roomId,
            postId,
        });
    }

    emitCommentCreated(roomId: number, comment: ForumCommentDTO): void {
        this.server.to(`forum-room:${roomId}`).emit("forum:comment:created", {
            postId: comment.postId,
            comment,
        });
    }

    emitCommentUpdated(roomId: number, comment: ForumCommentDTO): void {
        this.server.to(`forum-room:${roomId}`).emit("forum:comment:updated", {
            postId: comment.postId,
            comment,
        });
    }

    emitCommentDeleted(roomId: number, commentId: number, postId: number): void {
        this.server.to(`forum-room:${roomId}`).emit("forum:comment:deleted", {
            roomId,
            postId,
            commentId,
        });
    }

    emitRoomUpdated(roomId: number, room: any): void {
        this.server.to(`forum-room:${roomId}`).emit("forum:room:updated", {
            roomId,
            room,
        });
    }

    emitMemberJoined(roomId: number, member: any): void {
        this.server.to(`forum-room:${roomId}`).emit("forum:member:joined", {
            roomId,
            member,
        });
    }

    emitMemberLeft(roomId: number, userId: number): void {
        this.server.to(`forum-room:${roomId}`).emit("forum:member:left", {
            roomId,
            userId,
        });
    }
}

