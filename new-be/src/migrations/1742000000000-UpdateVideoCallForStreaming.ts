import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateVideoCallForStreaming1742000000000 implements MigrationInterface {
    name = "UpdateVideoCallForStreaming1742000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make recipient_id nullable for streaming rooms
        await queryRunner.query(`
            ALTER TABLE "video_call"
            ALTER COLUMN "recipient_id" DROP NOT NULL
        `);

        // Add room_name column for streaming rooms
        await queryRunner.query(`
            ALTER TABLE "video_call"
            ADD COLUMN "room_name" text
        `);

        // Update composite index to handle null recipient_id
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_video_call_user_status"
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_video_call_user_status"
            ON "video_call" ("initiator_id", "recipient_id", "status")
            WHERE "recipient_id" IS NOT NULL
        `);

        // Add index for streaming rooms
        await queryRunner.query(`
            CREATE INDEX "IDX_video_call_is_live_stream_status"
            ON "video_call" ("is_live_stream", "status")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop new indexes
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_video_call_is_live_stream_status"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_video_call_user_status"
        `);

        // Drop room_name column
        await queryRunner.query(`
            ALTER TABLE "video_call"
            DROP COLUMN "room_name"
        `);

        // Make recipient_id NOT NULL again (this will fail if there are null values)
        await queryRunner.query(`
            ALTER TABLE "video_call"
            ALTER COLUMN "recipient_id" SET NOT NULL
        `);

        // Recreate original composite index
        await queryRunner.query(`
            CREATE INDEX "IDX_video_call_user_status"
            ON "video_call" ("initiator_id", "recipient_id", "status")
        `);
    }
}
