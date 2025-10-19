import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserProfileEntity1729348800000
    implements MigrationInterface
{
    name = "CreateUserProfileEntity1729348800000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create user_profile table
        await queryRunner.query(`
            CREATE TABLE "user_profile" (
                "id" SERIAL NOT NULL,
                "userId" integer NOT NULL,
                "bio" text,
                "city" text,
                "location" text,
                "interests" text array NOT NULL DEFAULT '{}',
                "appearsInSearches" boolean NOT NULL DEFAULT true,
                "profilePictureId" integer,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_profile_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_user_profile_userId" UNIQUE ("userId"),
                CONSTRAINT "FK_user_profile_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        // Create index on userId
        await queryRunner.query(`
            CREATE INDEX "IDX_user_profile_userId" ON "user_profile" ("userId")
        `);

        // Migrate existing data from user table to user_profile table
        await queryRunner.query(`
            INSERT INTO "user_profile" ("userId", "city", "profilePictureId")
            SELECT "id", "city", "profilePictureId" FROM "user"
            WHERE "id" IS NOT NULL
        `);

        // Add new column to user_photo table
        await queryRunner.query(`
            ALTER TABLE "user_photo"
            ADD "userProfileId" integer
        `);

        // Migrate user_photo references from userId to userProfileId
        await queryRunner.query(`
            UPDATE "user_photo" up
            SET "userProfileId" = (
                SELECT upr.id
                FROM "user_profile" upr
                WHERE upr."userId" = up."userId"
            )
        `);

        // Make userProfileId NOT NULL after data migration
        await queryRunner.query(`
            ALTER TABLE "user_photo"
            ALTER COLUMN "userProfileId" SET NOT NULL
        `);

        // Drop old foreign key constraint on user_photo
        await queryRunner.query(`
            ALTER TABLE "user_photo"
            DROP CONSTRAINT IF EXISTS "FK_user_photo_user"
        `);

        // Add foreign key constraint to user_profile
        await queryRunner.query(`
            ALTER TABLE "user_photo"
            ADD CONSTRAINT "FK_user_photo_userProfile"
            FOREIGN KEY ("userProfileId") REFERENCES "user_profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Update profilePictureId foreign key in user_profile
        await queryRunner.query(`
            ALTER TABLE "user_profile"
            ADD CONSTRAINT "FK_user_profile_profilePicture"
            FOREIGN KEY ("profilePictureId") REFERENCES "user_photo"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Drop old columns from user table
        await queryRunner.query(`
            ALTER TABLE "user"
            DROP COLUMN IF EXISTS "city"
        `);

        await queryRunner.query(`
            ALTER TABLE "user"
            DROP COLUMN IF EXISTS "profilePictureId"
        `);

        // Drop old userId column from user_photo (after creating userProfileId)
        await queryRunner.query(`
            ALTER TABLE "user_photo"
            DROP COLUMN "userId"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add back userId column to user_photo
        await queryRunner.query(`
            ALTER TABLE "user_photo"
            ADD "userId" integer
        `);

        // Restore userId values in user_photo
        await queryRunner.query(`
            UPDATE "user_photo" up
            SET "userId" = (
                SELECT upr."userId"
                FROM "user_profile" upr
                WHERE upr.id = up."userProfileId"
            )
        `);

        // Make userId NOT NULL
        await queryRunner.query(`
            ALTER TABLE "user_photo"
            ALTER COLUMN "userId" SET NOT NULL
        `);

        // Add back columns to user table
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "city" text
        `);

        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "profilePictureId" integer
        `);

        // Restore data to user table
        await queryRunner.query(`
            UPDATE "user" u
            SET "city" = up."city",
                "profilePictureId" = up."profilePictureId"
            FROM "user_profile" up
            WHERE u.id = up."userId"
        `);

        // Drop foreign key constraint on user_profile
        await queryRunner.query(`
            ALTER TABLE "user_profile"
            DROP CONSTRAINT IF EXISTS "FK_user_profile_profilePicture"
        `);

        // Drop foreign key constraint on user_photo
        await queryRunner.query(`
            ALTER TABLE "user_photo"
            DROP CONSTRAINT IF EXISTS "FK_user_photo_userProfile"
        `);

        // Add back foreign key to user
        await queryRunner.query(`
            ALTER TABLE "user_photo"
            ADD CONSTRAINT "FK_user_photo_user"
            FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Drop userProfileId column from user_photo
        await queryRunner.query(`
            ALTER TABLE "user_photo"
            DROP COLUMN "userProfileId"
        `);

        // Drop index
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_user_profile_userId"
        `);

        // Drop user_profile table
        await queryRunner.query(`
            DROP TABLE "user_profile"
        `);
    }
}
