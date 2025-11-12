import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { LiveStreamSessionController } from "./live-stream-session.controller";
import { LiveStreamSessionService } from "../../services/live-stream-session.service";
import { MediasoupService } from "../../services/mediasoup.service";
import { LiveStreamSessionGateway } from "../../gateways/live-stream-session.gateway";
import { LiveStreamSession } from "../../entities/live-stream-session.entity";
import { User } from "../../entities/user.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([LiveStreamSession, User]),
        ConfigModule,
    ],
    controllers: [LiveStreamSessionController],
    providers: [
        LiveStreamSessionService,
        MediasoupService,
        LiveStreamSessionGateway,
    ],
    exports: [LiveStreamSessionService, MediasoupService],
})
export class LiveStreamSessionModule {}
