import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StatisticsController } from "./statistics.controller";
import { StatisticsService } from "./statistics.service";
import { Gift } from "../../entities/gift.entity";
import { ChatMessage } from "../../entities/chat-message.entity";
import { UserFriend } from "../../entities/friend.entity";
import { SuperLike } from "../../entities/super-like.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Gift, ChatMessage, UserFriend, SuperLike]),
    ],
    controllers: [StatisticsController],
    providers: [StatisticsService],
    exports: [StatisticsService],
})
export class StatisticsModule { }
