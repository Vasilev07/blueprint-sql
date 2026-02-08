import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDateOfBirthAndVerification1730000000000 implements MigrationInterface {
    name = "AddDateOfBirthAndVerification1730000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to user_profile table
        await queryRunner.query(`
            ALTER TABLE "user_profile"
            ADD "dateOfBirth" date
        `);

        await queryRunner.query(`
            ALTER TABLE "user_profile"
            ADD "isVerified" boolean NOT NULL DEFAULT false
        `);

        // Create verification_requests table
        await queryRunner.query(`
            CREATE TABLE "verification_request" (
                "id" SERIAL NOT NULL,
                "userId" integer NOT NULL,
                "verificationPhoto" text NOT NULL,
                "status" character varying NOT NULL DEFAULT 'pending',
                "rejectionReason" text,
                "reviewedBy" integer,
                "reviewedAt" timestamp,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_verification_request_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_verification_request_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_verification_request_reviewedBy" FOREIGN KEY ("reviewedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `);

        // Create indexes for verification_request table
        await queryRunner.query(`
            CREATE INDEX "IDX_verification_request_userId" ON "verification_request" ("userId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_verification_request_status" ON "verification_request" ("status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_verification_request_createdAt" ON "verification_request" ("createdAt")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop verification_request table and its indexes
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_verification_request_createdAt"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_verification_request_status"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_verification_request_userId"
        `);

        await queryRunner.query(`
            DROP TABLE "verification_request"
        `);

        // Remove new columns from user_profile table
        await queryRunner.query(`
            ALTER TABLE "user_profile"
            DROP COLUMN "isVerified"
        `);

        await queryRunner.query(`
            ALTER TABLE "user_profile"
            DROP COLUMN "dateOfBirth"
        `);
    }
}
