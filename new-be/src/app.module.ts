import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Administrator } from "./entities/administrator.entity";
import { AdminModule } from "./controllers/admin/admin.module";

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: "postgres",
            host: "0.0.0.0",
            port: 5432,
            username: "postgres",
            password: "postgres",
            database: "blueprint-sql",
            synchronize: true,
            logging: false,
            entities: [Administrator],
            migrations: [],
            subscribers: [],
        }),
        AdminModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
