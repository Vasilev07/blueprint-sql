import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AdminModule } from "./controllers/admin/admin.module";
import { Administrator } from "./entities/administrator.entity";
import { AppService } from "./app.service";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const isTesting = configService.get("NODE_ENV") === "test";
                console.log("isTesting", isTesting);
                console.log("NODE_ENV", configService.get("NODE_ENV"));

                return {
                    type: "postgres",
                    host: "0.0.0.0",
                    port: 5432,
                    username: "postgres",
                    password: "postgres",
                    database: !isTesting
                        ? "blueprint-sql"
                        : "blueprint-sql-test",
                    synchronize: true,
                    logging: false,
                    entities: [Administrator],
                    migrations: [],
                    subscribers: [],
                };
            },
        }),
        AdminModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
