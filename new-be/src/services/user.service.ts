import { Injectable } from "@nestjs/common";
import { UserDto } from "src/models/user-dto";
import { sign } from "jsonwebtoken";
import { CryptoService } from "./crypto.service";
import { EntityManager } from "typeorm";
import { Mapper } from "@automapper/core";
import { InjectMapper } from "@automapper/nestjs";
import { User } from "../entities/user.entity";

@Injectable()
export class UserService {
    constructor(
        private cryptoService: CryptoService,
        private entityManager: EntityManager,
        @InjectMapper() private mapper: Mapper,
    ) {}

    async register(dto: UserDto) {
        const isEmailAvailable = await this.findOneByEmail(dto.email);
        console.log("isEmailAvailable", isEmailAvailable);

        if (isEmailAvailable !== null && isEmailAvailable !== undefined) {
            throw new Error("Email already in use");
        }

        if (dto.password !== dto.confirmPassword) {
            throw new Error("Passwords do not match");
        }

        const names = dto.fullName.split(" ");

        const adminToSave: User = new User();
        const hashedPassword = await this.cryptoService.hashPassword(
            dto.password,
        );

        adminToSave.email = dto.email;
        adminToSave.password = hashedPassword;
        adminToSave.firstname = names[0];
        adminToSave.lastname = names[names.length - 1];

        const savedAdmin = await this.entityManager.save(adminToSave);

        return this.signForUser(savedAdmin);
    }

    signForUser = (admin: User) => {
        return sign({ name: admin.lastname, email: admin.email }, "secred", {
            expiresIn: "1h",
        });
    };

    async findOneByEmail(email: string) {
        return await this.entityManager.findOne(User, {
            where: { email },
        });
    }

    async getAll(): Promise<UserDto[]> {
        const users = await this.entityManager.find(User);

        return users.map((user: User) => {
            return this.mapper.map(user, User, UserDto);
        });
    }
}
