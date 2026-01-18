import { MigrationInterface, QueryRunner } from "typeorm";

export class AddForumCommentVotes1743100000000 implements MigrationInterface {
    name = "AddForumCommentVotes1743100000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add upvoteCount and downvoteCount columns to forum_comment table
        await queryRunner.query(`
            ALTER TABLE "forum_comment"
            ADD COLUMN IF NOT EXISTS "upvoteCount" integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "downvoteCount" integer NOT NULL DEFAULT 0
        `);

        // Migrate existing likeCount to upvoteCount (optional - only if likeCount exists and has data)
        await queryRunner.query(`
            UPDATE "forum_comment"
            SET "upvoteCount" = COALESCE("likeCount", 0)
            WHERE "upvoteCount" = 0 AND COALESCE("likeCount", 0) > 0
        `);

        // Create forum_comment_vote table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "forum_comment_vote" (
                "id" SERIAL NOT NULL,
                "commentId" integer NOT NULL,
                "userId" integer NOT NULL,
                "voteType" varchar(10) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_forum_comment_vote_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_forum_comment_vote_commentId" FOREIGN KEY ("commentId") 
                    REFERENCES "forum_comment"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_forum_comment_vote_userId" FOREIGN KEY ("userId") 
                    REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "UQ_forum_comment_vote_comment_user" UNIQUE ("commentId", "userId"),
                CONSTRAINT "CHK_forum_comment_vote_type" CHECK ("voteType" IN ('upvote', 'downvote'))
            )
        `);

        // Create indexes for forum_comment_vote
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_forum_comment_vote_commentId" 
            ON "forum_comment_vote" ("commentId")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_forum_comment_vote_userId" 
            ON "forum_comment_vote" ("userId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_comment_vote_userId"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_comment_vote_commentId"
        `);

        // Drop forum_comment_vote table
        await queryRunner.query(`
            DROP TABLE IF EXISTS "forum_comment_vote"
        `);

        // Remove upvoteCount and downvoteCount columns from forum_comment table
        await queryRunner.query(`
            ALTER TABLE "forum_comment"
            DROP COLUMN IF EXISTS "upvoteCount",
            DROP COLUMN IF EXISTS "downvoteCount"
        `);
    }
}
