import {Module} from "@nestjs/common";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Administrator} from "src/entities/administrator.entity";

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
                console.log("after tests start", configService);

                return {
                    type: "postgres",
                    host: "0.0.0.0",
                    port: 5432,
                    username: "postgres",
                    password: "postgres",
                    database: isTesting
                        ? "blueprint-sql-test"
                        : "blueprint-sql",
                    synchronize: true,
                    logging: true,
                    entities: [Administrator],
                    migrations: [],
                    subscribers: [],
                };
            },
        }),
    ],
    controllers: [],
    providers: [],
})
export class DbModule {
}
