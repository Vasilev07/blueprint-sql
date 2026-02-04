import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedAtToUserFriend1743200000000 implements MigrationInterface {
    name = 'AddCreatedAtToUserFriend1743200000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_friend" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_friend" DROP COLUMN "createdAt"`);
    }
}
