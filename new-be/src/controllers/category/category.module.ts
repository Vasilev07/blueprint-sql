import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "@entities/category.entity";
import { CategoryService } from "@services/category.service";
import { CategoryController } from "./category.controller";
import { CategoryProfile } from "@mappers/profiles/category.profile";

@Module({
    imports: [TypeOrmModule.forFeature([Category])],
    exports: [TypeOrmModule],
    controllers: [CategoryController],
    providers: [CategoryService, CategoryProfile],
})
export class CategoryModule {}
