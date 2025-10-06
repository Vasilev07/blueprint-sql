import { MapperService } from "@mappers/mapper.service";
import { ProductMapper } from "@mappers/implementations/product.mapper";
import { Global, Module } from "@nestjs/common";
import { UserMapper } from "@mappers/implementations/user.mapper";
import { CategoryMapper } from "@mappers/implementations/category.mapper";
import { OrderMapper } from "@mappers/implementations/order.mapper";
import { MessageMapper } from "@mappers/implementations/message.mapper";

@Global()
@Module({
    providers: [
        MapperService,
        ProductMapper,
        UserMapper,
        CategoryMapper,
        OrderMapper,
        MessageMapper,
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
    ) {
        this.mapperService.registerMapper("User", this.userMapper);
        this.mapperService.registerMapper("Product", this.productMapper);
        this.mapperService.registerMapper("Category", this.categoryMapper);
        this.mapperService.registerMapper("Order", this.orderMapper);
        this.mapperService.registerMapper("Message", this.messageMapper);
    }
}
