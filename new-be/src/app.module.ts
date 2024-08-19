import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserModule } from "./controllers/user/user.module";
import { classes } from "@automapper/classes";
import { AutomapperModule } from "@automapper/nestjs";
import { OrderModule } from "./controllers/order/order.module";
import { ProductModule } from "./controllers/product/product.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { dataSourceOptions } from "./config/data-source";

@Module({
    imports: [
        AutomapperModule.forRoot({
            strategyInitializer: classes(),
        }),
        TypeOrmModule.forRoot(dataSourceOptions),
        OrderModule,
        UserModule,
        ProductModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
