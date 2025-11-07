import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVideoCallEntity1741000000000 implements MigrationInterface {
    name = "CreateVideoCallEntity1741000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for call status
        await queryRunner.query(`
            CREATE TYPE "video_call_status_enum" AS ENUM (
                'pending',
                'ringing',
                'active',
                'ended',
                'rejected',
                'missed',
                'failed'
            )
        `);

        // Create video_call table
        await queryRunner.query(`
            CREATE TABLE "video_call" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "initiator_id" integer NOT NULL,
                "recipient_id" integer NOT NULL,
                "status" "video_call_status_enum" NOT NULL DEFAULT 'pending',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "started_at" TIMESTAMP,
                "ended_at" TIMESTAMP,
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "duration_seconds" integer,
                "end_reason" text,
                "is_live_stream" boolean NOT NULL DEFAULT false,
                "max_participants" integer NOT NULL DEFAULT 2,
                CONSTRAINT "PK_video_call_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_video_call_initiator" FOREIGN KEY ("initiator_id") 
                    REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_video_call_recipient" FOREIGN KEY ("recipient_id") 
                    REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        // Create indexes for performance
        await queryRunner.query(`
            CREATE INDEX "IDX_video_call_initiator_id" ON "video_call" ("initiator_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_video_call_recipient_id" ON "video_call" ("recipient_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_video_call_status" ON "video_call" ("status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_video_call_created_at" ON "video_call" ("created_at")
        `);

        // Create composite index for finding active calls by user
        await queryRunner.query(`
            CREATE INDEX "IDX_video_call_user_status" 
            ON "video_call" ("initiator_id", "recipient_id", "status")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_video_call_user_status"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_video_call_created_at"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_video_call_status"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_video_call_recipient_id"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_video_call_initiator_id"
        `);

        // Drop table
        await queryRunner.query(`
            DROP TABLE "video_call"
        `);

        // Drop enum type
        await queryRunner.query(`
            DROP TYPE "video_call_status_enum"
        `);
    }
}

