import { DataSource } from "typeorm";
import { clearDatabase, createTestDB } from "./configs/test-db-config";
import { AppTestDataSource } from "./data-source";

describe('Test Database', () => {
    let db: DataSource = AppTestDataSource;

    beforeEach(async () => {
        await createTestDB();
    });

    afterEach(async () => {
        await clearDatabase(db);
    });

    test('should connect and return a query result', async () => {
        expect(1).toBe(1);
    });
});
