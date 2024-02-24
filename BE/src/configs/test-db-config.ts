import { DataSource, EntityManager } from "typeorm";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Administrator } from "../entity/administrator";

export interface TestDBConnection {
    em: EntityManager;
    container: StartedPostgreSqlContainer;
}

export const createTestDB = async (): Promise<TestDBConnection> => {
    try {
        debugger;
        const container = await new PostgreSqlContainer("postgres:alpine").start();

        const stream = await container.logs();
        stream
            .on("data", line => console.log(line))
            .on("err", line => console.error(line))
            .on("end", () => console.log("Stream closed"));
        debugger;

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
