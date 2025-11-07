import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { VideoCallController } from "./video-call.controller";
import { VideoCallService } from "../../services/video-call.service";
import { MediasoupService } from "../../services/mediasoup.service";
import { VideoCallGateway } from "../../gateways/video-call.gateway";
import { VideoCall } from "../../entities/video-call.entity";
import { User } from "../../entities/user.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([VideoCall, User]),
        ConfigModule,
    ],
    controllers: [VideoCallController],
    providers: [VideoCallService, MediasoupService, VideoCallGateway],
    exports: [VideoCallService, MediasoupService],
})
export class VideoCallModule {}

