import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameVideoCallToLiveStreamSession1742100000000 implements MigrationInterface {
    name = "RenameVideoCallToLiveStreamSession1742100000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Simply rename the table - TypeORM will handle constraints and indexes
        await queryRunner.query(`
            ALTER TABLE "video_call" RENAME TO "live_stream_session"
        `);

        // Note: All constraints and indexes will be automatically recreated by TypeORM
        // with proper names when the application starts with updated entity definitions
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Simply rename the table back - TypeORM will handle constraints and indexes
        await queryRunner.query(`
            ALTER TABLE "live_stream_session" RENAME TO "video_call"
        `);

        // Note: All constraints and indexes will be automatically recreated by TypeORM
        // with original names when rolling back to previous entity definitions
    }
}
