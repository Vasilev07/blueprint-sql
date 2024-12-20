import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";
import { CategoryGender } from "../enums/categories.enum";

export class ReplaceNameWithGenderInCategory1725715739385
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("category", "name");

        await queryRunner.addColumn(
            "category",
            new TableColumn({
                name: "gender",
                type: "enum",
                enum: [
                    CategoryGender.MEN,
                    CategoryGender.WOMEN,
                    CategoryGender.UNISEX,
                ],
                isNullable: false,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("category", "gender");

        await queryRunner.addColumn(
            "category",
            new TableColumn({
                name: "name",
                type: "varchar",
                isNullable: false,
            }),
        );
    }
}
