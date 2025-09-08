import { Module } from "@nestjs/common";
import { MessageController } from "./message.controller";
import { MessageService } from "src/services/message.service";
import { MapperModule } from "src/mappers/mapper.module";

@Module({
    imports: [MapperModule],
    controllers: [MessageController],
    providers: [MessageService],
    exports: [MessageService],
})
export class MessageModule {}
