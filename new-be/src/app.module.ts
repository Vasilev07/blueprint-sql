import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DbModule } from "./config/db.module";
import { AdminModule } from "./controllers/admin/admin.module";
import { OrderModule } from "./controllers/order/order.module";

@Module({
    imports: [DbModule, AdminModule, OrderModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
