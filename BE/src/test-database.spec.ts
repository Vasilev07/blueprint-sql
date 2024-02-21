import { TestDBConnection, createTestDB } from "./configs/test-db-config";

test('should connect and return a query result', async () => {
    const { em, container }: TestDBConnection = await createTestDB();

    const result = await em.query("SELECT 1");

    expect(result.rows[0]).toEqual({ "?column?": 1 });

    container.stop();
}, 30000);
