import { EntityManager } from 'typeorm';
import { createTestDB } from '../configs/test-db-config';
import { Administrator } from '../entity/administrator';

describe('AdministratorService', () => {
    beforeEach(async () => {
        const db: EntityManager = await createTestDB();
        db.insert(Administrator, {})
    });

    it('should be defined', () => {
        expect(1).toBe(1);
    });
});
