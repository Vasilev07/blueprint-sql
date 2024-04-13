import { DataSource, EntityManager } from 'typeorm';
import { clearDatabase, createTestDB } from '../configs/test-db-config';
import { Administrator } from '../entity/administrator.entity';
import { AppTestDataSource } from '../data-source';

describe('AdministratorService', () => {
    let db: DataSource = AppTestDataSource;
    let em: EntityManager;

    beforeEach(async () => {
        await createTestDB();

        em = AppTestDataSource.manager;

        const testAdmin = new Administrator();
        testAdmin.email = 'test@gmail.com1';
        testAdmin.password = '123456';
        testAdmin.firstname = 'TestFirstName';
        testAdmin.lastname = 'TestFamily';

        const admin = await em.insert(Administrator, testAdmin);
        console.log('admin', admin);

    });

    afterEach(async () => {
        await clearDatabase(db);
    });

    test('should be defined', async () => {
        try {
            const user = await em.findOne(Administrator, { where: { email: 'test@gmail.com1' } });
            console.log('user', user);

            expect(user).toBeDefined();
        } catch (error) {
            console.log('error', error);
        }
    });
});
