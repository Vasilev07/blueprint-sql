import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class AddCategoryEntity1680000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "category",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "name",
                        type: "text",
                    },
                    {
                        name: "type",
                        type: "enum",
                        enum: [
                            "rings",
                            "pendants",
                            "bracelets",
                            "earrings",
                            "necklaces",
                            "watches",
                        ],
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("category");
    }
}
