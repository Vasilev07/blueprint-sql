import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SuperLike } from "../entities/super-like.entity";
import { User } from "../entities/user.entity";

@Injectable()
export class SuperLikeService {
    constructor(
        @InjectRepository(SuperLike)
        private superLikeRepo: Repository<SuperLike>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    async sendSuperLike(senderId: number, receiverId: number): Promise<SuperLike> {
        if (senderId === receiverId) {
            throw new BadRequestException("You cannot super like yourself");
        }

        const receiver = await this.userRepo.findOne({ where: { id: receiverId } });
        if (!receiver) {
            throw new BadRequestException("Receiver not found");
        }

        // Check if already super liked? The user didn't explicitly ask for this constraint, 
        // but it's common. For now, I'll allow multiple super likes as it might be a consumable feature.
        // If I wanted to restrict, I'd check here.

        const superLike = this.superLikeRepo.create({
            senderId,
            receiverId,
        });

        return this.superLikeRepo.save(superLike);
    }

    async getSuperLikesForUser(userId: number): Promise<SuperLike[]> {
        return this.superLikeRepo.find({
            where: { receiverId: userId },
            relations: ["sender", "sender.profile"], // Load sender profile to show who liked
            order: { createdAt: "DESC" },
        });
    }
}
