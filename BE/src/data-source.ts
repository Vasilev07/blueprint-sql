import "reflect-metadata";
import { DataSource } from "typeorm";
import { Administrator } from "./entity/administrator";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "0.0.0.0",
    port: 5432,
    username: "postgres",
    password: "postgres",
    database: "bookstore",
    synchronize: true,
    logging: false,
    entities: [Administrator],
    migrations: [],
    subscribers: [],
});

export const AppTestDataSource = new DataSource({
    type: "postgres",
    host: "0.0.0.0",
    port: 5432,
    username: "postgres",
    password: "postgres",
    database: "integration-test",
    synchronize: true,
    logging: false,
    entities: [Administrator],
    migrations: [],
    subscribers: [],
});

