import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSuperLikeEntity1742200000000 implements MigrationInterface {
    name = "CreateSuperLikeEntity1742200000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "super_like" (
                "id" SERIAL NOT NULL,
                "senderId" integer NOT NULL,
                "receiverId" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_super_like_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_super_like_senderId_createdAt" ON "super_like" ("senderId", "createdAt")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_super_like_receiverId_createdAt" ON "super_like" ("receiverId", "createdAt")
        `);

        await queryRunner.query(`
            ALTER TABLE "super_like"
            ADD CONSTRAINT "FK_super_like_sender"
            FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "super_like"
            ADD CONSTRAINT "FK_super_like_receiver"
            FOREIGN KEY ("receiverId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "super_like"
            DROP CONSTRAINT "FK_super_like_receiver"
        `);

        await queryRunner.query(`
            ALTER TABLE "super_like"
            DROP CONSTRAINT "FK_super_like_sender"
        `);

        await queryRunner.query(`
            DROP INDEX "IDX_super_like_receiverId_createdAt"
        `);

        await queryRunner.query(`
            DROP INDEX "IDX_super_like_senderId_createdAt"
        `);

        await queryRunner.query(`
            DROP TABLE "super_like"
        `);
    }
}
