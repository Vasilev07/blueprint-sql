import { Injectable } from "@nestjs/common";
import { UserDTO } from "../models/user.dto";
import { sign } from "jsonwebtoken";
import { CryptoService } from "./crypto.service";
import { EntityManager } from "typeorm";
import { User } from "@entities/user.entity";
import { UserMapper } from "@mappers/implementations/user.mapper";
import { MapperService } from "@mappers/mapper.service";

@Injectable()
export class UserService {
    private userMapper: UserMapper;

    constructor(
        private cryptoService: CryptoService,
        private entityManager: EntityManager,
        private readonly mapperService: MapperService,
    ) {
        // this.userMapper = this.mapperService.getMapper("User");
    }

    async register(dto: UserDTO) {
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

    async getAll(): Promise<UserDTO[]> {
        const users = await this.entityManager.find(User);
        console.log(users);
        return Promise.all([]);
    }
}
