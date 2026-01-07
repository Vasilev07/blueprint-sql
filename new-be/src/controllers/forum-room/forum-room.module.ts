import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ForumRoomController } from "./forum-room.controller";
import { ForumRoomService } from "@services/forum-room.service";
import { ForumRoom } from "@entities/forum-room.entity";
import { ForumRoomMember } from "@entities/forum-room-member.entity";
import { User } from "@entities/user.entity";
import { ForumPostController } from "../forum-post/forum-post.controller";
import { ForumPostService } from "@services/forum-post.service";
import { ForumPost } from "@entities/forum-post.entity";
import { ForumCommentController } from "../forum-comment/forum-comment.controller";
import { ForumCommentService } from "@services/forum-comment.service";
import { ForumComment } from "@entities/forum-comment.entity";
import { ForumGateway } from "src/gateways/forum.gateway";


@Module({
    imports: [
        TypeOrmModule.forFeature([
            ForumRoom,
            ForumRoomMember,
            ForumPost,
            ForumComment,
            User,
        ]),
    ],
    controllers: [
        ForumRoomController,
        ForumPostController,
        ForumCommentController,
    ],
    providers: [
        ForumRoomService,
        ForumPostService,
        ForumCommentService,
        ForumGateway,
    ],
    exports: [ForumRoomService, ForumPostService, ForumCommentService, ForumGateway],
})
export class ForumModule {}

