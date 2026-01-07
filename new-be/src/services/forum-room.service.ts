import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ForumRoom } from "../entities/forum-room.entity";
import { ForumRoomMember } from "../entities/forum-room-member.entity";
import { ForumRoomDTO } from "../models/forum-room.dto";
import { CreateForumRoomDTO } from "../models/create-forum-room.dto";
import { ForumRoomMemberDTO } from "../models/forum-room-member.dto";
import { MapperService } from "@mappers/mapper.service";
import { User } from "../entities/user.entity";

@Injectable()
export class ForumRoomService {
    constructor(
        @InjectRepository(ForumRoom)
        private forumRoomRepo: Repository<ForumRoom>,
        @InjectRepository(ForumRoomMember)
        private forumRoomMemberRepo: Repository<ForumRoomMember>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private mapperService: MapperService,
    ) {}

    async createRoom(
        userId: number,
        dto: CreateForumRoomDTO,
    ): Promise<ForumRoomDTO> {
        // Verify user exists
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException("User not found");
        }

        // Check maxMembers if provided
        if (dto.maxMembers && dto.maxMembers < 1) {
            throw new BadRequestException(
                "maxMembers must be at least 1 or null for unlimited",
            );
        }

        // Create room and add creator as admin member in transaction
        const room = await this.forumRoomRepo.manager.transaction(async (trx) => {
            const room = await trx.getRepository(ForumRoom).save(
                trx.getRepository(ForumRoom).create({
                    name: dto.name,
                    description: dto.description || null,
                    visibility: dto.visibility,
                    createdBy: userId,
                    memberCount: 1, // Creator is first member
                    maxMembers: dto.maxMembers || null,
                    status: "active",
                }),
            );

            // Add creator as admin member
            await trx.getRepository(ForumRoomMember).save(
                trx.getRepository(ForumRoomMember).create({
                    roomId: room.id,
                    userId: userId,
                    role: "admin",
                    status: "joined",
                    unreadCount: 0,
                }),
            );

            return room;
        });

        return this.mapperService.entityToDTO<ForumRoom, ForumRoomDTO>(
            "ForumRoom",
            room,
        );
    }

    async getRoomById(roomId: number, userId?: number): Promise<ForumRoomDTO> {
        const room = await this.forumRoomRepo.findOne({
            where: { id: roomId },
        });

        if (!room) {
            throw new NotFoundException("Room not found");
        }

        // Check permissions if userId provided
        if (userId) {
            const isMember = await this.forumRoomMemberRepo.findOne({
                where: {
                    roomId: roomId,
                    userId: userId,
                    status: "joined",
                },
            });

            if (
                !isMember &&
                room.visibility !== "public" &&
                room.createdBy !== userId
            ) {
                throw new ForbiddenException(
                    "You don't have access to this room",
                );
            }
        }

        return this.mapperService.entityToDTO<ForumRoom, ForumRoomDTO>(
            "ForumRoom",
            room,
        );
    }

    async getRooms(
        userId?: number,
        filters?: { visibility?: string; status?: string },
    ): Promise<ForumRoomDTO[]> {
        const queryBuilder = this.forumRoomRepo.createQueryBuilder("room");

        // Apply filters
        if (filters?.visibility) {
            queryBuilder.andWhere("room.visibility = :visibility", {
                visibility: filters.visibility,
            });
        }

        if (filters?.status) {
            queryBuilder.andWhere("room.status = :status", {
                status: filters.status,
            });
        } else {
            // Default: only show active rooms
            queryBuilder.andWhere("room.status = :status", { status: "active" });
        }

        // If user provided, show their rooms + public rooms
        if (userId) {
            queryBuilder
                .leftJoin("room.members", "member", "member.userId = :userId", {
                    userId,
                })
                .andWhere(
                    "(room.visibility = 'public' OR member.userId = :userId OR room.createdBy = :userId)",
                    { userId },
                );
        } else {
            // No user: only show public rooms
            queryBuilder.andWhere("room.visibility = :visibility", {
                visibility: "public",
            });
        }

        queryBuilder.orderBy("room.createdAt", "DESC");

        const rooms = await queryBuilder.getMany();

        return rooms.map((room) =>
            this.mapperService.entityToDTO<ForumRoom, ForumRoomDTO>(
                "ForumRoom",
                room,
            ),
        );
    }

    async getMyRooms(userId: number): Promise<ForumRoomDTO[]> {
        const memberships = await this.forumRoomMemberRepo.find({
            where: {
                userId: userId,
                status: "joined",
            },
            relations: ["room"],
        });

        return memberships.map((membership) =>
            this.mapperService.entityToDTO<ForumRoom, ForumRoomDTO>(
                "ForumRoom",
                membership.room,
            ),
        );
    }

    async joinRoom(
        userId: number,
        roomId: number,
    ): Promise<ForumRoomMemberDTO> {
        // Verify user exists
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException("User not found");
        }

        // Verify room exists
        const room = await this.forumRoomRepo.findOne({
            where: { id: roomId },
        });
        if (!room) {
            throw new NotFoundException("Room not found");
        }

        // Check if room is active
        if (room.status !== "active") {
            throw new BadRequestException("Room is not active");
        }

        // Check if user is already a member
        const existingMember = await this.forumRoomMemberRepo.findOne({
            where: {
                roomId: roomId,
                userId: userId,
                status: "joined",
            },
        });

        if (existingMember) {
            throw new BadRequestException("User is already a member of this room");
        }

        // Check if user was banned
        const bannedMember = await this.forumRoomMemberRepo.findOne({
            where: {
                roomId: roomId,
                userId: userId,
                status: "banned",
            },
        });

        if (bannedMember) {
            throw new ForbiddenException("You are banned from this room");
        }

        // Check room visibility and capacity
        if (room.visibility === "private") {
            throw new ForbiddenException(
                "This room is private. You need an invitation to join",
            );
        }

        if (room.maxMembers && room.memberCount >= room.maxMembers) {
            throw new BadRequestException("Room has reached maximum capacity");
        }

        // Create membership in transaction
        const member = await this.forumRoomRepo.manager.transaction(
            async (trx) => {
                const member = await trx.getRepository(ForumRoomMember).save(
                    trx.getRepository(ForumRoomMember).create({
                        roomId: roomId,
                        userId: userId,
                        role: "member",
                        status: "joined",
                        unreadCount: 0,
                    }),
                );

                // Increment memberCount
                await trx
                    .getRepository(ForumRoom)
                    .increment({ id: roomId }, "memberCount", 1);

                return member;
            },
        );

        return this.mapperService.entityToDTO<
            ForumRoomMember,
            ForumRoomMemberDTO
        >("ForumRoomMember", member);
    }

    async leaveRoom(userId: number, roomId: number): Promise<void> {
        // Verify room exists
        const room = await this.forumRoomRepo.findOne({
            where: { id: roomId },
        });
        if (!room) {
            throw new NotFoundException("Room not found");
        }

        // Find membership
        const member = await this.forumRoomMemberRepo.findOne({
            where: {
                roomId: roomId,
                userId: userId,
                status: "joined",
            },
        });

        if (!member) {
            throw new BadRequestException("You are not a member of this room");
        }

        // Check if user is the last admin
        if (member.role === "admin") {
            const adminCount = await this.forumRoomMemberRepo.count({
                where: {
                    roomId: roomId,
                    role: "admin",
                    status: "joined",
                },
            });

            if (adminCount === 1) {
                throw new BadRequestException(
                    "Cannot leave room as the last admin. Transfer admin role or delete the room",
                );
            }
        }

        // Update membership and decrement memberCount in transaction
        await this.forumRoomRepo.manager.transaction(async (trx) => {
            await trx.getRepository(ForumRoomMember).update(
                { id: member.id },
                { status: "left" },
            );

            // Decrement memberCount
            await trx
                .getRepository(ForumRoom)
                .decrement({ id: roomId }, "memberCount", 1);
        });
    }

    async updateRoomMemberRole(
        roomId: number,
        targetUserId: number,
        newRole: "admin" | "moderator" | "member",
        adminUserId: number,
    ): Promise<ForumRoomMemberDTO> {
        // Verify admin user has permission
        const adminMember = await this.forumRoomMemberRepo.findOne({
            where: {
                roomId: roomId,
                userId: adminUserId,
                status: "joined",
                role: "admin",
            },
        });

        if (!adminMember) {
            throw new ForbiddenException(
                "Only admins can update member roles",
            );
        }

        // Find target member
        const targetMember = await this.forumRoomMemberRepo.findOne({
            where: {
                roomId: roomId,
                userId: targetUserId,
                status: "joined",
            },
        });

        if (!targetMember) {
            throw new NotFoundException("Target user is not a member of this room");
        }

        // Prevent changing own role if last admin
        if (targetUserId === adminUserId && newRole !== "admin") {
            const adminCount = await this.forumRoomMemberRepo.count({
                where: {
                    roomId: roomId,
                    role: "admin",
                    status: "joined",
                },
            });

            if (adminCount === 1) {
                throw new BadRequestException(
                    "Cannot change your role as the last admin",
                );
            }
        }

        // Update role
        targetMember.role = newRole;
        const updated = await this.forumRoomMemberRepo.save(targetMember);

        return this.mapperService.entityToDTO<
            ForumRoomMember,
            ForumRoomMemberDTO
        >("ForumRoomMember", updated);
    }

    async getRoomMembers(
        roomId: number,
        userId?: number,
    ): Promise<ForumRoomMemberDTO[]> {
        // Verify room exists and user has access
        await this.getRoomById(roomId, userId);

        const members = await this.forumRoomMemberRepo.find({
            where: {
                roomId: roomId,
                status: "joined",
            },
            order: {
                role: "ASC", // Admins first, then moderators, then members
                joinedAt: "ASC",
            },
        });

        return members.map((member) =>
            this.mapperService.entityToDTO<
                ForumRoomMember,
                ForumRoomMemberDTO
            >("ForumRoomMember", member),
        );
    }

    async deleteRoom(roomId: number, userId: number): Promise<void> {
        // Verify room exists
        const room = await this.forumRoomRepo.findOne({
            where: { id: roomId },
        });
        if (!room) {
            throw new NotFoundException("Room not found");
        }

        // Verify user is admin
        const adminMember = await this.forumRoomMemberRepo.findOne({
            where: {
                roomId: roomId,
                userId: userId,
                status: "joined",
                role: "admin",
            },
        });

        if (!adminMember && room.createdBy !== userId) {
            throw new ForbiddenException(
                "Only room admins or creator can delete the room",
            );
        }

        // Soft delete (set status to 'deleted')
        await this.forumRoomRepo.update({ id: roomId }, { status: "deleted" });
    }

    async checkUserIsMember(
        roomId: number,
        userId: number,
    ): Promise<ForumRoomMember | null> {
        return await this.forumRoomMemberRepo.findOne({
            where: {
                roomId: roomId,
                userId: userId,
                status: "joined",
            },
        });
    }

    async hasPermission(
        roomId: number,
        userId: number,
        requiredRole: "admin" | "moderator" | "member",
    ): Promise<boolean> {
        const member = await this.checkUserIsMember(roomId, userId);
        if (!member) {
            return false;
        }

        const roleHierarchy = { admin: 3, moderator: 2, member: 1 };
        return (
            roleHierarchy[member.role as keyof typeof roleHierarchy] >=
            roleHierarchy[requiredRole]
        );
    }
}

