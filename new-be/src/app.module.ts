import { Module } from "@nestjs/common";
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

@Module({
    imports: [
        TypeOrmModule.forRoot(dataSourceOptions),
        MapperModule,
        OrderModule,
        UserModule,
        CategoryModule,
        ProductModule,
    ],
    controllers: [AppController],
    providers: [AppService, MulterConfigService],
})
export class AppModule {}
