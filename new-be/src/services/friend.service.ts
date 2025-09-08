import { Injectable, Req } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { UserFriend, FriendshipStatus } from '../entities/friend.entity';
import { FriendDTO } from '../models/friend.dto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class FriendService {
    constructor(
        @InjectEntityManager() private readonly entityManager: EntityManager
    ) {}

    private getUserIdFromRequest(req: any): number {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, 'your-secret-key') as any;
        return decoded.id;
    }

    async createFriendRequest(friendId: number, req: any): Promise<FriendDTO> {
        const userId = this.getUserIdFromRequest(req);
        
        // Check if request already exists
        const existingRequest = await this.entityManager.findOne(UserFriend, {
            where: [
                { userId, friendId },
                { userId: friendId, friendId: userId }
            ]
        });

        if (existingRequest) {
            return existingRequest;
        }

        // Create new friend request
        const friendRequest = new UserFriend();
        friendRequest.userId = userId;
        friendRequest.friendId = friendId;
        friendRequest.status = FriendshipStatus.PENDING;

        return this.entityManager.save(UserFriend, friendRequest);
    }

    async getFriendshipStatus(otherUserId: number, req: any): Promise<FriendshipStatus | null> {
        const userId = this.getUserIdFromRequest(req);
        
        const friendship = await this.entityManager.findOne(UserFriend, {
            where: [
                { userId, friendId: otherUserId },
                { userId: otherUserId, friendId: userId }
            ]
        });

        return friendship?.status || null;
    }

    async updateFriendshipStatus(otherUserId: number, status: FriendshipStatus, req: any): Promise<FriendDTO> {
        const userId = this.getUserIdFromRequest(req);
        
        const friendship = await this.entityManager.findOne(UserFriend, {
            where: [
                { userId, friendId: otherUserId },
                { userId: otherUserId, friendId: userId }
            ]
        });

        if (!friendship) {
            throw new Error('Friendship not found');
        }

        friendship.status = status;
        return this.entityManager.save(UserFriend, friendship);
    }
}