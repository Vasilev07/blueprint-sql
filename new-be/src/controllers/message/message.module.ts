import { Module } from "@nestjs/common";
import { MessageController } from "./message.controller";
import { MessageService } from "src/services/message.service";
import { MapperModule } from "src/mappers/mapper.module";
import { MessageGateway } from "src/gateways/message.gateway";

@Module({
    imports: [MapperModule],
    controllers: [MessageController],
    providers: [MessageService, MessageGateway],
    exports: [MessageService],
})
export class MessageModule {}
