import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SuperLikeController } from "./super-like.controller";
import { SuperLikeService } from "../../services/super-like.service";
import { SuperLike } from "../../entities/super-like.entity";
import { User } from "../../entities/user.entity";

@Module({
    imports: [TypeOrmModule.forFeature([SuperLike, User])],
    controllers: [SuperLikeController],
    providers: [SuperLikeService],
    exports: [SuperLikeService],
})
export class SuperLikeModule { }
