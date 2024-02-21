import { DataSource, DataSourceOptions, EntityManager } from "typeorm";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Administrator } from "../entity/administrator";

const buildDataSourceOptions = (database: string, username: string, password: string): DataSourceOptions => {
    return {
        type: "postgres",
        host: "0.0.0.0",
        port: 5433,
        username,
        password,
        database,
        synchronize: true,
        logging: false,
        entities: [Administrator],
        migrations: [],
        subscribers: [],
    }
};

export interface TestDBConnection {
    em: EntityManager;
    container: StartedPostgreSqlContainer;
}

export const createTestDB = async (): Promise<TestDBConnection> => {
    const container = await new PostgreSqlContainer()
        .withDatabase("bookstore-test")
        .withUsername("postgres")
        .withPassword("123456")
        .start();

    const TestDataSource = new DataSource(
        buildDataSourceOptions(container.getDatabase(), container.getUsername(), container.getPassword())
    );

    await TestDataSource.initialize();

    console.log('Test database created');

    return { em: TestDataSource.manager, container };
};

export const clearDatabase = async (db: EntityManager, container: StartedPostgreSqlContainer) => {
    await db.connection.destroy();
    await container.stop();
    console.log('Test database cleared');
};
