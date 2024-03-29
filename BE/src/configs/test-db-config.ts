import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { EntityManager } from "typeorm";
import { AppTestDataSource } from "../data-source";
import { Client } from "pg";

const DB_NAME = "integration-test";

export const createTestDB = async (): Promise<void> => {
    await AppTestDataSource.initialize()
        .then(async () => {
            console.log("Data source initialized");
        })
        .catch(async (error) => {
            if (error.code === '3D000') {
                await createDatabaseIfNotExists();
                //TODO ->  MIGHT LEAD TO RECURSIVE CALL createTestDB -> should have a limit of retries
                await createTestDB();
            } else {
                console.error("Error creating database:", error);
                throw error;
            }
        });
}

const createDatabaseIfNotExists = async () => {
    const client = new Client({
        host: '0.0.0.0',
        user: 'postgres',
        password: '123456',
        port: 5433,
    });

    await client.connect();

    const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${DB_NAME}'`);

    if (res.rowCount === 0) {
        console.log(`${DB_NAME} database not found, creating it.`);
        await client.query(`CREATE DATABASE "${DB_NAME}";`);
        console.log(`created database ${DB_NAME}.`);
    } else {
        console.log(`${DB_NAME} database already exists.`);
    }

    await client.end();
}

export const clearDatabase = async (db: EntityManager, container: StartedPostgreSqlContainer) => {
    await db.connection.destroy();
    await container.stop();
    console.log('Test database cleared');
};
