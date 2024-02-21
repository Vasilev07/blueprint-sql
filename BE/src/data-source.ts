import "reflect-metadata"
import { DataSource } from "typeorm"
import { Administrator } from "./entity/administrator"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "0.0.0.0",
    port: 5433,
    username: "postgres",
    password: "123456",
    database: "bookstore",
    synchronize: true,
    logging: false,
    entities: [Administrator],
    migrations: [],
    subscribers: [],
});

export const TestDataSource = new DataSource({
    type: "postgres",
    host: "0.0.0.0",
    port: 5433,
    username: "postgres",
    password: "123456",
    database: "bookstore-test",
    synchronize: true,
    logging: false,
    entities: [Administrator],
    migrations: [],
    subscribers: [],
});
