import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CategoryDTO {
    @ApiPropertyOptional()
    id?: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    description: string;

    @ApiPropertyOptional()
    parent?: CategoryDTO;

    @ApiPropertyOptional()
    children?: CategoryDTO[];
}
