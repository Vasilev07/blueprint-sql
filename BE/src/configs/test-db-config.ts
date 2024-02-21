import { DataSource, EntityManager } from "typeorm";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Administrator } from "../entity/administrator";

export interface TestDBConnection {
    em: EntityManager;
    container: StartedPostgreSqlContainer;
}

export const createTestDB = async (): Promise<TestDBConnection> => {
    try {
        const container = await new PostgreSqlContainer().start();
        console.log('Test database started');

        const TestDataSource = new DataSource(
            {
                type: "postgres",
                host: container.getHost(),
                port: container.getPort(),
                username: container.getUsername(),
                password: container.getPassword(),
                database: container.getDatabase(),
                synchronize: true,
                logging: false,
                entities: [Administrator],
                migrations: [],
                subscribers: [],
            }
        );
        await TestDataSource.initialize();

        console.log('Test database created');

        return { em: TestDataSource.manager, container };
    } catch (error) {
        throw new Error(`Error starting test database: ${error}`);
    }
};

export const clearDatabase = async (db: EntityManager, container: StartedPostgreSqlContainer) => {
    await db.connection.destroy();
    await container.stop();
    console.log('Test database cleared');
};
