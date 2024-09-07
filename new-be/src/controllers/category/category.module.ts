import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "@entities/category.entity";
import { CategoryService } from "@services/category.service";
import { CategoryController } from "./category.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Category])],
    exports: [TypeOrmModule],
    controllers: [CategoryController],
    providers: [CategoryService],
})
export class CategoryModule {}
