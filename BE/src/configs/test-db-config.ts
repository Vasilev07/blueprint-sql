import { EntityManager } from "typeorm";
import { TestDataSource, TestDataSourceOptions } from "../data-source";
import { createDatabase } from 'typeorm-extension';

export const createTestDB = async (): Promise<EntityManager> => {
    await createDatabase({
        options: TestDataSourceOptions
    });
    await TestDataSource.initialize();

    return TestDataSource.manager;
};
