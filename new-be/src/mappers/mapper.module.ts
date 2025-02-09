import { MapperService } from "@mappers/mapper.service";
import { ProductMapper } from "@mappers/implementations/product.mapper";
import { Global, Module, OnModuleInit } from "@nestjs/common";
import { UserMapper } from "@mappers/implementations/user.mapper";
import { CategoryMapper } from "@mappers/implementations/category.mapper";
import { OrderMapper } from "@mappers/implementations/order.mapper";

@Global()
@Module({
    providers: [
        MapperService,
        ProductMapper,
        UserMapper,
        CategoryMapper,
        OrderMapper,
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
    ) {
        console.log("MapperModule constructor called");
        this.mapperService.registerMapper("User", this.userMapper);
        this.mapperService.registerMapper("Product", this.productMapper);
        this.mapperService.registerMapper("Category", this.categoryMapper);
        this.mapperService.registerMapper("Order", this.orderMapper);
    }
}
