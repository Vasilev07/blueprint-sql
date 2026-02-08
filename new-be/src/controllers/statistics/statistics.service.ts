import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";
import { Gift } from "../../entities/gift.entity";
import { ChatMessage } from "../../entities/chat-message.entity";
import { UserFriend, FriendshipStatus } from "../../entities/friend.entity";
import { SuperLike } from "../../entities/super-like.entity";

@Injectable()
export class StatisticsService {
    constructor(
        @InjectRepository(Gift)
        private readonly giftRepository: Repository<Gift>,
        @InjectRepository(ChatMessage)
        private readonly chatMessageRepository: Repository<ChatMessage>,
        @InjectRepository(UserFriend)
        private readonly friendRepository: Repository<UserFriend>,
        @InjectRepository(SuperLike)
        private readonly superLikeRepository: Repository<SuperLike>,
    ) {}

    async getDashboardStatistics(timeRange?: string | Date) {
        const fromDate = this.parseTimeRange(timeRange);

        // Prepare filter condition
        const whereCondition = fromDate
            ? { createdAt: MoreThanOrEqual(fromDate) }
            : {};

        let giftCondition: any = whereCondition;
        let messageCondition: any = whereCondition;
        let friendRequestCondition: any = whereCondition;
        let requestAcceptedCondition: any = {
            ...whereCondition,
            status: FriendshipStatus.ACCEPTED,
        };
        let superLikeCondition: any = whereCondition;

        // If NO fromDate provided (undefined), use default logic (Gifts Today, others All Time)
        // Note: If fromDate is defined but "old" (e.g. all time), it acts as filter.
        if (!fromDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            giftCondition = { createdAt: MoreThanOrEqual(today) };
            messageCondition = {};
            friendRequestCondition = {};
            requestAcceptedCondition = { status: FriendshipStatus.ACCEPTED };
            superLikeCondition = {};
        }

        // 1. Total sent gifts
        const giftsToday = await this.giftRepository.count({
            where: giftCondition,
        });

        // 2. Total messages sent
        const messagesSent = await this.chatMessageRepository.count({
            where: messageCondition,
        });

        // 3. Total friend requests sent
        const friendRequestsSent = await this.friendRepository.count({
            where: friendRequestCondition,
        });

        // 4. Total request accepted
        const requestsAccepted = await this.friendRepository.count({
            where: requestAcceptedCondition,
        });

        // 5. Total super likes
        const superLikes = await this.superLikeRepository.count({
            where: superLikeCondition,
        });

        return {
            giftsToday,
            messagesSent,
            friendRequestsSent,
            requestsAccepted,
            superLikes,
        };
    }

    private parseTimeRange(timeRange?: string | Date): Date | undefined {
        if (!timeRange) {
            return undefined;
        }

        if (timeRange instanceof Date) {
            return timeRange;
        }

        if (typeof timeRange === "string") {
            const match = timeRange.match(/^(\d+)([hd])$/);
            if (!match) {
                const potentialDate = new Date(timeRange);
                if (!isNaN(potentialDate.getTime())) {
                    return potentialDate;
                } else {
                    throw new Error(
                        "Invalid time range format. Use '20h', '7d' or ISO date.",
                    );
                }
            } else {
                const value = parseInt(match[1], 10);
                const unit = match[2];
                const now = new Date();
                if (unit === "h") {
                    now.setHours(now.getHours() - value);
                } else if (unit === "d") {
                    now.setDate(now.getDate() - value);
                }
                return now;
            }
        }

        return undefined;
    }
}
