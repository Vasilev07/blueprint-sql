import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DbModule } from "./config/db.module";
import { AdminModule } from "./controllers/admin/admin.module";
import { classes } from "@automapper/classes";
import { AutomapperModule } from "@automapper/nestjs";
import { OrderModule } from "./controllers/order/order.module";
import { ProductModule } from "./controllers/product/product.module";

@Module({
    imports: [
        AutomapperModule.forRoot({
            strategyInitializer: classes(),
        }),
        DbModule,
        OrderModule,
        AdminModule,
        ProductModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
