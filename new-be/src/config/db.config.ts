import { ConfigService } from "@nestjs/config";
import { DataSource, DataSourceOptions } from "typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

const ENTITIES = [__dirname + "/../**/entity/*.{ts,js}"];
const MIGRATIONS = [__dirname + "/../../migration/*.{ts,js}"];

export const getConfig = (config: ConfigService) => {
    console.log("DB_HOST", config.get<string>("DB_HOST"));
    console.log("NODE_ENV", config.get<string>("NODE_ENV"));

    return {
        type: "postgres",
        host: config.get<string>("DB_HOST"),
        port: config.get<number>("POSTGRESDB_LOCAL_PORT"),
        username: config.get<string>("POSTGRES_USER"),
        password: config.get<string>("POSTGRES_PASSWORD"),
        database:
            config.get<string>("NODE_ENV") !== "test"
                ? config.get<string>("POSTGRES_DB")
                : "blueprint-sql-test",
        entities: ENTITIES,
        migrations: MIGRATIONS,
        synchronize: false,
    } as DataSourceOptions;
};

export async function createTestDataSource(
    dbOptions: PostgresConnectionOptions,
) {
    const dataSource = new DataSource(dbOptions);
    await dataSource.initialize();
    return dataSource;
}
