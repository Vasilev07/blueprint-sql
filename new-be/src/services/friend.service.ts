import { Injectable, Req } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { EntityManager } from "typeorm";
import { UserFriend, FriendshipStatus } from "../entities/friend.entity";
import { FriendDTO } from "../models/friend.dto";
import { FriendGateway } from "../gateways/friend.gateway";
import { User } from "../entities/user.entity";

@Injectable()
export class FriendService {
    constructor(
        @InjectEntityManager() private readonly entityManager: EntityManager,
        private readonly friendGateway: FriendGateway,
    ) {}

    private getUserIdFromRequest(req: any): number {
        if (!req.userData) {
            throw new Error('User not authenticated - userData is undefined');
        }
        if (!req.userData.id) {
            throw new Error('User ID not found in userData');
        }
        return req.userData.id;
    }

    async createFriendRequest(friendId: number, req: any): Promise<FriendDTO> {
        const userId = this.getUserIdFromRequest(req);

        console.log(`Creating friend request: ${userId} -> ${friendId}`);

        // Prevent self-friending
        if (userId === friendId) {
            throw new Error("Cannot send friend request to yourself");
        }

        // Check if any friendship already exists (in any direction)
        const existingFriendship = await this.entityManager.findOne(
            UserFriend,
            {
                where: [
                    { userId, friendId },
                    { userId: friendId, friendId: userId },
                ],
            },
        );

        console.log("Existing friendship found:", existingFriendship);

        if (existingFriendship) {
            // Handle different existing statuses
            switch (existingFriendship.status) {
                case FriendshipStatus.PENDING:
                    if (existingFriendship.userId === userId) {
                        throw new Error(
                            "You have already sent a friend request to this user",
                        );
                    } else {
                        throw new Error(
                            "This user has already sent you a friend request",
                        );
                    }
                case FriendshipStatus.ACCEPTED:
                    throw new Error("You are already friends with this user");
                case FriendshipStatus.BLOCKED:
                    throw new Error(
                        "Cannot send friend request to a blocked user",
                    );
                default:
                    throw new Error(
                        "A friendship already exists with this user",
                    );
            }
        }

        // Create new friend request
        const friendRequest = new UserFriend();
        friendRequest.userId = userId;
        friendRequest.friendId = friendId;
        friendRequest.status = FriendshipStatus.PENDING;

        const saved = await this.entityManager.save(UserFriend, friendRequest);

        // Notify receiver about new request
        const receiver = await this.entityManager.findOne(User, {
            where: { id: friendId },
        });
        if (receiver?.email) {
            this.friendGateway.emitToEmail(
                receiver.email,
                "friend:request:created",
            );
        }

        return saved;
    }

    async getFriendshipStatus(
        otherUserId: number,
        req: any,
    ): Promise<FriendshipStatus | null> {
        const userId = this.getUserIdFromRequest(req);

        console.log(`Getting friendship status: ${userId} <-> ${otherUserId}`);

        const friendship = await this.entityManager.findOne(UserFriend, {
            where: [
                { userId, friendId: otherUserId },
                { userId: otherUserId, friendId: userId },
            ],
        });

        console.log("Found friendship:", friendship);
        return friendship?.status || null;
    }

    async getBatchFriendshipStatuses(
        req: any,
    ): Promise<Record<number, FriendshipStatus | null>> {
        const userId = this.getUserIdFromRequest(req);

        // Get all friendships where current user is involved
        const friendships = await this.entityManager.find(UserFriend, {
            where: [{ userId }, { friendId: userId }],
        });

        const statusMap: Record<number, FriendshipStatus | null> = {};

        for (const friendship of friendships) {
            // Determine the other user's ID
            const otherUserId =
                friendship.userId === userId
                    ? friendship.friendId
                    : friendship.userId;
            statusMap[otherUserId] = friendship.status;
        }

        return statusMap;
    }

    async updateFriendshipStatus(
        otherUserId: number,
        status: FriendshipStatus,
        req: any,
    ): Promise<FriendDTO> {
        const userId = this.getUserIdFromRequest(req);

        const friendship = await this.entityManager.findOne(UserFriend, {
            where: [
                { userId, friendId: otherUserId },
                { userId: otherUserId, friendId: userId },
            ],
        });

        if (!friendship) {
            throw new Error("Friendship not found");
        }

        // Update the existing friendship
        friendship.status = status;
        await this.entityManager.save(UserFriend, friendship);

        // If accepting a friend request, create the reverse friendship
        if (status === FriendshipStatus.ACCEPTED) {
            console.log(
                `Creating reverse friendship: ${otherUserId} -> ${userId}`,
            );

            const reverseFriendship = await this.entityManager.findOne(
                UserFriend,
                {
                    where: {
                        userId: otherUserId,
                        friendId: userId,
                    },
                },
            );

            console.log("Reverse friendship exists:", reverseFriendship);

            // Only create reverse if it doesn't exist
            if (!reverseFriendship) {
                const newReverseFriendship = new UserFriend();
                newReverseFriendship.userId = otherUserId;
                newReverseFriendship.friendId = userId;
                newReverseFriendship.status = FriendshipStatus.ACCEPTED;
                const savedReverse = await this.entityManager.save(
                    UserFriend,
                    newReverseFriendship,
                );
                console.log("Created reverse friendship:", savedReverse);
            }
        }

        // Notify both users about update
        const [requester, responder] = await Promise.all([
            this.entityManager.findOne(User, { where: { id: userId } }),
            this.entityManager.findOne(User, { where: { id: otherUserId } }),
        ]);

        if (requester?.email) {
            this.friendGateway.emitToEmail(
                requester.email,
                "friend:request:updated",
            );
            if (status === FriendshipStatus.ACCEPTED) {
                this.friendGateway.emitToEmail(
                    requester.email,
                    "friend:list:updated",
                );
            }
        }

        if (responder?.email) {
            this.friendGateway.emitToEmail(
                responder.email,
                "friend:request:updated",
            );
            if (status === FriendshipStatus.ACCEPTED) {
                this.friendGateway.emitToEmail(
                    responder.email,
                    "friend:list:updated",
                );
            }
        }

        return friendship;
    }

    async getIncomingRequests(req: any): Promise<FriendDTO[]> {
        const userId = this.getUserIdFromRequest(req);

        const incomingRequests = await this.entityManager.find(UserFriend, {
            where: {
                friendId: userId,
                status: FriendshipStatus.PENDING,
            },
            relations: ["user"],
        });

        return incomingRequests.map((request) => ({
            userId: request.userId,
            friendId: request.friendId,
            status: request.status,
            user: request.user
                ? {
                      id: request.user.id,
                      firstname: request.user.firstname,
                      lastname: request.user.lastname,
                      email: request.user.email,
                      lastOnline: request.user.lastOnline,
                  }
                : undefined,
        }));
    }

    async getOutgoingRequests(req: any): Promise<FriendDTO[]> {
        const userId = this.getUserIdFromRequest(req);

        const outgoingRequests = await this.entityManager.find(UserFriend, {
            where: {
                userId: userId,
                status: FriendshipStatus.PENDING,
            },
            relations: ["friend"],
        });

        return outgoingRequests.map((request) => ({
            userId: request.userId,
            friendId: request.friendId,
            status: request.status,
            friend: request.friend
                ? {
                      id: request.friend.id,
                      firstname: request.friend.firstname,
                      lastname: request.friend.lastname,
                      email: request.friend.email,
                      lastOnline: request.friend.lastOnline,
                  }
                : undefined,
        }));
    }

    async getAcceptedFriends(req: any): Promise<FriendDTO[]> {
        const userId = this.getUserIdFromRequest(req);

        const acceptedFriends = await this.entityManager.find(UserFriend, {
            where: [
                { userId: userId, status: FriendshipStatus.ACCEPTED },
                { friendId: userId, status: FriendshipStatus.ACCEPTED },
            ],
            relations: ["user", "friend"],
        });

        // Use a Map to deduplicate friends by their ID
        const friendsMap = new Map<number, FriendDTO>();

        acceptedFriends.forEach((friendship) => {
            // Determine which user is the actual friend (not the logged-in user)
            const isUserTheLoggedInUser = friendship.userId === userId;
            const actualFriend = isUserTheLoggedInUser
                ? friendship.friend
                : friendship.user;
            const actualFriendId = isUserTheLoggedInUser
                ? friendship.friendId
                : friendship.userId;

            // Only add if not already in map (prevents duplicates)
            if (actualFriend && !friendsMap.has(actualFriendId)) {
                friendsMap.set(actualFriendId, {
                    userId: friendship.userId,
                    friendId: actualFriendId,
                    status: friendship.status,
                    user: {
                        id: actualFriend.id,
                        firstname: actualFriend.firstname,
                        lastname: actualFriend.lastname,
                        email: actualFriend.email,
                        lastOnline: actualFriend.lastOnline,
                    },
                    friend: undefined,
                });
            }
        });

        return Array.from(friendsMap.values());
    }
}
