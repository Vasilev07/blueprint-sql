import { EntityManager } from 'typeorm';
import { createTestDB } from '../configs/test-db-config';
import { Administrator } from '../entity/administrator';

describe('AdministratorService', () => {
    let db: EntityManager;

    beforeEach(async () => {
        const { em } = await createTestDB();

        const testAdmin = new Administrator();
        testAdmin.email = 'test@gmail.com';
        testAdmin.password = '123456';
        testAdmin.firstname = 'TestFirstName';
        testAdmin.lastname = 'TestFamily';

        await em.insert(Administrator, testAdmin);
    });

    afterEach(async () => {
        // await clearDatabase(db);
    }, 3000);

    test('should be defined', async () => {
        try {
            const user = await db.findOne(Administrator, { where: { email: 'test@gmail.com' } });
            expect(user).toBeDefined();
        } catch (error) {
            console.log('error', error);

        }
    }, 10000);
});
