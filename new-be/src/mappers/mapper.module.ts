import { MapperService } from "@mappers/mapper.service";
import { ProductMapper } from "@mappers/implementations/product.mapper";
import { Global, Module } from "@nestjs/common";
import { UserMapper } from "@mappers/implementations/user.mapper";
import { CategoryMapper } from "@mappers/implementations/category.mapper";
import { OrderMapper } from "@mappers/implementations/order.mapper";
import { MessageMapper } from "@mappers/implementations/message.mapper";
import { ChatMessageMapper } from "@mappers/implementations/chat-message.mapper";
import { ChatConversationMapper } from "@mappers/implementations/chat-conversation.mapper";
import { ProfileViewMapper } from "@mappers/implementations/profile-view.mapper";
import { UserProfileMapper } from "@mappers/implementations/user-profile.mapper";

@Global()
@Module({
    providers: [
        MapperService,
        ProductMapper,
        UserMapper,
        CategoryMapper,
        OrderMapper,
        MessageMapper,
        ChatMessageMapper,
        ChatConversationMapper,
        ProfileViewMapper,
        UserProfileMapper,
    ],
    exports: [MapperService],
})
export class MapperModule {
    constructor(
        private readonly mapperService: MapperService,
        private readonly productMapper: ProductMapper,
        private readonly userMapper: UserMapper,
        private readonly categoryMapper: CategoryMapper,
        private readonly orderMapper: OrderMapper,
        private readonly messageMapper: MessageMapper,
        private readonly chatMessageMapper: ChatMessageMapper,
        private readonly chatConversationMapper: ChatConversationMapper,
        private readonly profileViewMapper: ProfileViewMapper,
        private readonly userProfileMapper: UserProfileMapper,
    ) {
        this.mapperService.registerMapper("User", this.userMapper);
        this.mapperService.registerMapper("Product", this.productMapper);
        this.mapperService.registerMapper("Category", this.categoryMapper);
        this.mapperService.registerMapper("Order", this.orderMapper);
        this.mapperService.registerMapper("Message", this.messageMapper);
        this.mapperService.registerMapper(
            "ChatMessage",
            this.chatMessageMapper,
        );
        this.mapperService.registerMapper(
            "ChatConversation",
            this.chatConversationMapper,
        );
        this.mapperService.registerMapper(
            "ProfileView",
            this.profileViewMapper,
        );
        this.mapperService.registerMapper(
            "UserProfile",
            this.userProfileMapper,
        );
    }
}
