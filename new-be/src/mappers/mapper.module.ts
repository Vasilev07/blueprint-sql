import { MapperService } from "@mappers/mapper.service";
import { ProductMapper } from "@mappers/implementations/product.mapper";
import { Global, Module, OnModuleInit } from "@nestjs/common";
import { UserMapper } from "@mappers/implementations/user.mapper";
import { CategoryMapper } from "@mappers/implementations/category.mapper";

@Global()
@Module({
    providers: [MapperService, ProductMapper, UserMapper, CategoryMapper],
    exports: [MapperService],
})
export class MapperModule implements OnModuleInit {
    constructor(
        private readonly mapperService: MapperService,
        private readonly productMapper: ProductMapper,
        private readonly userMapper: UserMapper,
        private readonly categoryMapper: CategoryMapper,
    ) {
        console.log("MapperModule constructor called");
    }

    public onModuleInit() {
        console.log("MapperModule initialized");
        this.mapperService.registerMapper("User", this.userMapper);
        this.mapperService.registerMapper("Product", this.productMapper);
        this.mapperService.registerMapper("Category", this.categoryMapper);
    }
}
