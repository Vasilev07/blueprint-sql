import { TestDBConnection, createTestDB } from "./configs/test-db-config";

describe('Test Database', () => {
    // jest.setTimeout(180_000);
    test('should connect and return a query result', async () => {
        const { em, container }: TestDBConnection = await createTestDB();

        const result = await em.query("SELECT 1");

        expect(result.rows[0]).toEqual({ "?column?": 1 });

        container.stop();
    }, 30000);
});

// describe("Redis", () => {
//     let container: any;
//     let redisClient: any;

//     beforeAll(async () => {
//         container = await new GenericContainer("redis")
//             .withExposedPorts(6379)
//             .start();

//         redisClient = asyncRedis.createClient(
//             container.getMappedPort(6379),
//             container.getHost(),
//         );
//     }, 30000);

//     afterAll(async () => {
//         await redisClient.quit();
//         await container.stop();
//     });

//     it("works", async () => {
//         await redisClient.set("key", "val");
//         expect(await redisClient.get("key")).toBe("val");
//     });
// });
