import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProfileView } from "../entities/profile-view.entity";
import { UserFriend, FriendshipStatus } from "../entities/friend.entity";
import { ProfileViewDTO } from "../models/profile-view.dto";
import { MapperService } from "@mappers/mapper.service";

@Injectable()
export class ProfileViewService {
    constructor(
        @InjectRepository(ProfileView)
        private profileViewRepo: Repository<ProfileView>,
        @InjectRepository(UserFriend)
        private friendRepo: Repository<UserFriend>,
        private mapperService: MapperService,
    ) {}

    async recordProfileView(
        userId: number,
        viewerId: number,
    ): Promise<ProfileViewDTO> {
        // Don't record if viewing own profile
        if (userId === viewerId) {
            return null;
        }

        // Check if they are friends
        const areFriends = await this.checkIfFriends(userId, viewerId);

        // Create profile view record
        const view = this.profileViewRepo.create({
            userId,
            viewerId,
            isFriend: areFriends,
        });

        const savedView = await this.profileViewRepo.save(view);

        // Load viewer info for DTO
        const viewWithRelations = await this.profileViewRepo.findOne({
            where: { id: savedView.id },
            relations: ["viewer"],
        });

        return this.mapperService.entityToDTO<ProfileView, ProfileViewDTO>(
            "ProfileView",
            viewWithRelations,
        );
    }

    async getProfileViews(
        userId: number,
        limit: number = 50,
    ): Promise<ProfileViewDTO[]> {
        const views = await this.profileViewRepo.find({
            where: { userId },
            relations: ["viewer"],
            order: { viewedAt: "DESC" },
            take: limit,
        });

        return views.map((view) =>
            this.mapperService.entityToDTO<ProfileView, ProfileViewDTO>(
                "ProfileView",
                view,
            ),
        );
    }

    async getProfileViewCount(userId: number): Promise<number> {
        return this.profileViewRepo.count({
            where: { userId },
        });
    }

    async getUniqueViewerCount(userId: number): Promise<number> {
        const result = await this.profileViewRepo
            .createQueryBuilder("pv")
            .select("COUNT(DISTINCT pv.viewerId)", "count")
            .where("pv.userId = :userId", { userId })
            .getRawOne();

        return parseInt(result?.count || "0");
    }

    private async checkIfFriends(
        userId1: number,
        userId2: number,
    ): Promise<boolean> {
        const friendship = await this.friendRepo.findOne({
            where: [
                {
                    userId: userId1,
                    friendId: userId2,
                    status: FriendshipStatus.ACCEPTED,
                },
                {
                    userId: userId2,
                    friendId: userId1,
                    status: FriendshipStatus.ACCEPTED,
                },
            ],
        });

        return !!friendship;
    }
}
