import { DataSource, DataSourceOptions } from "typeorm";
import { Order } from "../entities/order.entity";
import { Product } from "../entities/product.entity";
import { User } from "../entities/user.entity";
import { Category } from "../entities/category.entity";

export const dataSourceOptions: DataSourceOptions = {
    type: "postgres",
    host: process.env.DB_HOST || "0.0.0.0",
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_DATABASE || "blueprint-sql",
    logging: ["query", "error"],
    entities: [Order, Product, User, Category],
    migrations: ["src/migrations/*{.ts,.js}"],
    synchronize: true,
};

const dataSource: DataSource = new DataSource(dataSourceOptions);

export default dataSource;
