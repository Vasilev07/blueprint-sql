import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Administrator } from "./entities/administrator.entity";
import { AdminModule } from "./controllers/admin/admin.module";
import { DevtoolsModule } from "@nestjs/devtools-integration";

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
        DevtoolsModule.register({
            http: process.env.NODE_ENV !== "production",
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
