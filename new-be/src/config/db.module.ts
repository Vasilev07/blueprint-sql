// import { Module } from "@nestjs/common";
// import { ConfigModule, ConfigService } from "@nestjs/config";
// import { TypeOrmModule } from "@nestjs/typeorm";
// import { dataSourceOptions } from "./data-source";
//
// export interface DatabaseConfig {
//     host: string;
//     port: number;
//     database: string;
//     username: string;
//     password: string;
//     logging: boolean;
// }
//
// @Module({
//     imports: [
//         ConfigModule.forRoot({
//             isGlobal: true,
//         }),
//         TypeOrmModule.forRoot(dataSourceOptions),
//         TypeOrmModule.forRootAsync({
//             inject: [ConfigService],
//             useFactory: (configService: ConfigService) => {
//                 const isTesting = configService.get("NODE_ENV") === "test";
//                 console.log("isTesting", isTesting);
//                 console.log("NODE_ENV", configService.get("NODE_ENV"));
//                 console.log("after tests start", configService);
//
//                 return {
//                     type: "postgres",
//                     host: process.env.DB_HOST || "0.0.0.0",
//                     port: process.env.DB_PORT || 5432,
//                     username: process.env.DB_USERNAME || "postgres",
//                     password: process.env.DB_PASSWORD || "postgres",
//                     database: process.env.DB_DATABASE || "blueprint-sql",
//                     synchronize: true,
//                     logging: true,
//                     entities: ["dist/entities/*.entity{.ts,.js}"],
//                     migrations: ["src/migrations/*.js"],
//                     subscribers: [],
//                 } as DatabaseConfig;
//             },
//         }),
//     ],
//     controllers: [],
//     providers: [],
// })
// export class DbModule {}
