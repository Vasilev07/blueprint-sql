import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/user"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "0.0.0.0",
    port: 5433,
    username: "postgres",
    password: "123456",
    database: "bookstore",
    synchronize: true,
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
});

