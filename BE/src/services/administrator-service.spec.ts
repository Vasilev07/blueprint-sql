import { TestDataSource } from '../data-source';

describe('AdministratorService', () => {
    beforeEach(async () => {
        await TestDataSource.initialize();
    });

    it('should be defined', () => {
        expect(1).toBe(1);
    });
});
