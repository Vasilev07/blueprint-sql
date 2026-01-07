import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateForumRoomTables1743000000000 implements MigrationInterface {
    name = "CreateForumRoomTables1743000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create forum_room table
        await queryRunner.query(`
            CREATE TABLE "forum_room" (
                "id" SERIAL NOT NULL,
                "name" varchar(255) NOT NULL,
                "description" text,
                "visibility" varchar(50) NOT NULL DEFAULT 'public',
                "createdBy" integer,
                "memberCount" integer NOT NULL DEFAULT 0,
                "maxMembers" integer,
                "status" varchar(20) NOT NULL DEFAULT 'active',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_forum_room_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_forum_room_createdBy" FOREIGN KEY ("createdBy") 
                    REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `);

        // Create forum_room_member table
        await queryRunner.query(`
            CREATE TABLE "forum_room_member" (
                "id" SERIAL NOT NULL,
                "roomId" integer NOT NULL,
                "userId" integer NOT NULL,
                "role" varchar(20) NOT NULL DEFAULT 'member',
                "status" varchar(20) NOT NULL DEFAULT 'joined',
                "unreadCount" integer NOT NULL DEFAULT 0,
                "joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_forum_room_member_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_forum_room_member_roomId" FOREIGN KEY ("roomId") 
                    REFERENCES "forum_room"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_forum_room_member_userId" FOREIGN KEY ("userId") 
                    REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "UQ_forum_room_member_room_user_status" UNIQUE ("roomId", "userId", "status")
            )
        `);

        // Create forum_post table
        await queryRunner.query(`
            CREATE TABLE "forum_post" (
                "id" SERIAL NOT NULL,
                "roomId" integer NOT NULL,
                "authorId" integer NOT NULL,
                "title" varchar(500) NOT NULL,
                "content" text NOT NULL,
                "type" varchar(20) NOT NULL DEFAULT 'text',
                "commentCount" integer NOT NULL DEFAULT 0,
                "likeCount" integer NOT NULL DEFAULT 0,
                "isPinned" boolean NOT NULL DEFAULT false,
                "isLocked" boolean NOT NULL DEFAULT false,
                "status" varchar(20) NOT NULL DEFAULT 'active',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_forum_post_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_forum_post_roomId" FOREIGN KEY ("roomId") 
                    REFERENCES "forum_room"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_forum_post_authorId" FOREIGN KEY ("authorId") 
                    REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        // Create forum_comment table
        await queryRunner.query(`
            CREATE TABLE "forum_comment" (
                "id" SERIAL NOT NULL,
                "postId" integer NOT NULL,
                "parentCommentId" integer,
                "authorId" integer NOT NULL,
                "content" text NOT NULL,
                "type" varchar(20) NOT NULL DEFAULT 'text',
                "replyCount" integer NOT NULL DEFAULT 0,
                "likeCount" integer NOT NULL DEFAULT 0,
                "depth" integer NOT NULL DEFAULT 0,
                "status" varchar(20) NOT NULL DEFAULT 'active',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_forum_comment_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_forum_comment_postId" FOREIGN KEY ("postId") 
                    REFERENCES "forum_post"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_forum_comment_parentCommentId" FOREIGN KEY ("parentCommentId") 
                    REFERENCES "forum_comment"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_forum_comment_authorId" FOREIGN KEY ("authorId") 
                    REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        // Indexes for forum_room
        await queryRunner.query(`
            CREATE INDEX "IDX_forum_room_visibility_status" ON "forum_room" ("visibility", "status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_forum_room_createdBy" ON "forum_room" ("createdBy")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_forum_room_status" ON "forum_room" ("status")
        `);

        // Indexes for forum_room_member
        await queryRunner.query(`
            CREATE INDEX "IDX_forum_room_member_roomId" ON "forum_room_member" ("roomId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_forum_room_member_userId" ON "forum_room_member" ("userId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_forum_room_member_status" ON "forum_room_member" ("status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_forum_room_member_room_user_status" 
            ON "forum_room_member" ("roomId", "userId", "status")
        `);

        // Indexes for forum_post
        await queryRunner.query(`
            CREATE INDEX "IDX_forum_post_roomId" ON "forum_post" ("roomId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_forum_post_authorId" ON "forum_post" ("authorId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_forum_post_createdAt" ON "forum_post" ("createdAt")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_forum_post_room_pinned_created" 
            ON "forum_post" ("roomId", "isPinned", "createdAt")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_forum_post_status" ON "forum_post" ("status")
        `);

        // Indexes for forum_comment
        await queryRunner.query(`
            CREATE INDEX "IDX_forum_comment_postId" ON "forum_comment" ("postId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_forum_comment_parentCommentId" ON "forum_comment" ("parentCommentId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_forum_comment_authorId" ON "forum_comment" ("authorId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_forum_comment_post_parent_created" 
            ON "forum_comment" ("postId", "parentCommentId", "createdAt")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_forum_comment_depth" ON "forum_comment" ("depth")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_forum_comment_status" ON "forum_comment" ("status")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes for forum_comment
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_comment_status"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_comment_depth"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_comment_post_parent_created"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_comment_authorId"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_comment_parentCommentId"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_comment_postId"
        `);

        // Drop indexes for forum_post
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_post_status"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_post_room_pinned_created"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_post_createdAt"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_post_authorId"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_post_roomId"
        `);

        // Drop indexes for forum_room_member
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_room_member_room_user_status"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_room_member_status"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_room_member_userId"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_room_member_roomId"
        `);

        // Drop indexes for forum_room
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_room_status"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_room_createdBy"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_forum_room_visibility_status"
        `);

        // Drop tables (in reverse order due to foreign keys)
        await queryRunner.query(`
            DROP TABLE IF EXISTS "forum_comment"
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "forum_post"
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "forum_room_member"
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "forum_room"
        `);
    }
}

