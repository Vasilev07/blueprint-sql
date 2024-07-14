import { CategoryType } from "../enums/categories.enum";
import { ApiProperty } from "@nestjs/swagger";
import { AutoMap } from "@automapper/classes";

export class CategoryDTO {
    @ApiProperty()
    @AutoMap()
    id?: number;

    @ApiProperty()
    @AutoMap()
    name: string;

    @ApiProperty()
    @AutoMap()
    type: CategoryType;
}
