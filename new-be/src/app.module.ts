import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Administrator } from "./entities/administrator.entity";
import { AdminModule } from "./controllers/admin/admin.module";
import { DevtoolsModule } from "@nestjs/devtools-integration";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
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
                    database: isTesting
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
        DevtoolsModule.register({
            http: process.env.NODE_ENV !== "production",
        }),
        ConfigModule.forRoot({
            envFilePath: "../../.env",
            isGlobal: true,
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
