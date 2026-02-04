import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserModule } from "./controllers/user/user.module";
import { OrderModule } from "./controllers/order/order.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { dataSourceOptions } from "./config/data-source";
import { CategoryModule } from "./controllers/category/category.module";
import { ProductModule } from "./controllers/product/product.module";
import { MulterConfigService } from "./config/multer.config";
import { MapperModule } from "@mappers/mapper.module";
import { MessageModule } from "./controllers/message/message.module";
import { FriendModule } from "./controllers/friend/friend.module";
import { MessageGateway } from "./gateways/message.gateway";
import { ChatModule } from "./controllers/chat/chat.module";
import { StoryModule } from "./controllers/story/story.module";
import { WalletModule } from "./controllers/wallet/wallet.module";
import { GiftModule } from "./controllers/gift/gift.module";
import { ConfigModule } from "@nestjs/config";
import { AuthGuard } from "./guards/auth.guard";
import { LiveStreamSessionModule } from "./controllers/live-stream-session/live-stream-session.module";
import { SuperLikeModule } from "./controllers/super-like/super-like.module";
import { ForumModule } from "./controllers/forum-room/forum-room.module";
import { StatisticsModule } from "./controllers/statistics/statistics.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [
                `.env.${process.env.NODE_ENV || "development"}`,
                ".env",
            ],
        }),
        TypeOrmModule.forRoot({ ...dataSourceOptions, autoLoadEntities: true }),
        MapperModule,
        OrderModule,
        UserModule,
        CategoryModule,
        ProductModule,
        MessageModule,
        FriendModule,
        ChatModule,
        StoryModule,
        WalletModule,
        GiftModule,
        LiveStreamSessionModule,
        SuperLikeModule,
        SuperLikeModule,
        ForumModule,
        StatisticsModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        MulterConfigService,
        MessageGateway,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
    ],
})
export class AppModule { }
