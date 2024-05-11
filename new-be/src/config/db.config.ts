import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";

const ENTITIES = [__dirname + "/../**/entity/*.{ts,js}"];
const MIGRATIONS = [__dirname + "/../../migration/*.{ts,js}"];

export const getConfig = (config: ConfigService) => {
    console.log("DB_HOST", config.get<string>("DB_HOST"));

    return {
        type: "postgres",
        host: config.get<string>("DB_HOST"),
        port: config.get<number>("POSTGRESDB_LOCAL_PORT"),
        username: config.get<string>("POSTGRES_USER"),
        password: config.get<string>("POSTGRES_PASSWORD"),
        database: config.get<string>("POSTGRES_DB"),
        entities: ENTITIES,
        migrations: MIGRATIONS,
        synchronize: false,
    } as PostgresConnectionOptions;
};

export async function createTestDataSource(
    dbOptions: PostgresConnectionOptions,
) {
    const dataSource = new DataSource(dbOptions);
    await dataSource.initialize();
    return dataSource;
}
