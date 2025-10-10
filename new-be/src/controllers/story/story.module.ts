import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { ScheduleModule } from "@nestjs/schedule";
import { StoryController } from "./story.controller";
import { StoryService } from "../../services/story.service";

@Module({
    imports: [
        MulterModule.register({
            storage: require("multer").memoryStorage(),
            limits: {
                fileSize: 30 * 1024 * 1024,
            },
        }),
        ScheduleModule.forRoot(),
    ],
    controllers: [StoryController],
    providers: [StoryService],
    exports: [StoryService],
})
export class StoryModule {}

