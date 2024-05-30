import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DbModule } from "./config/db.module";
import { AdminModule } from "./controllers/admin/admin.module";

@Module({
    imports: [DbModule, AdminModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
