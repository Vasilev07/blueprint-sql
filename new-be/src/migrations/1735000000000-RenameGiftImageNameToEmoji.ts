import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameGiftImageNameToEmoji1735000000000 implements MigrationInterface {
    name = "RenameGiftImageNameToEmoji1735000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename the column from giftImageName to giftEmoji
        await queryRunner.query(`
            ALTER TABLE "gift"
            RENAME COLUMN "giftImageName" TO "giftEmoji"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rename back in case of rollback
        await queryRunner.query(`
            ALTER TABLE "gift"
            RENAME COLUMN "giftEmoji" TO "giftImageName"
        `);
    }
}
