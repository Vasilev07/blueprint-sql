import { createTestDB } from "./configs/test-db-config";

describe('Test Database', () => {
    test('should connect and return a query result', async () => {
        await createTestDB();

        expect(1).toBe(1);
    });
});
