import { Injectable } from "@nestjs/common";
import { Administrator } from "src/entities/administrator.entity";
import { AdministratorDTO } from "src/models/administrator-dto";
import { sign } from "jsonwebtoken";
import { CryptoService } from "./crypto.service";
import { EntityManager } from "typeorm";
import { mapper } from "../mappers/mapper";
import { addProfile } from "@automapper/core";
import { AdministratorProfile } from "../mappers/profiles/administrator.profile";

@Injectable()
export class AdministratorService {
    constructor(
        private cryptoService: CryptoService,
        private entityManager: EntityManager,
    ) {
        addProfile(mapper, AdministratorProfile);
    }

    async register(dto: AdministratorDTO) {
        const isEmailAvailable = await this.findOneByEmail(dto.email);
        console.log("isEmailAvailable", isEmailAvailable);

        if (isEmailAvailable !== null && isEmailAvailable !== undefined) {
            throw new Error("Email already in use");
        }

        if (dto.password !== dto.confirmPassword) {
            throw new Error("Passwords do not match");
        }

        const names = dto.fullName.split(" ");

        const adminToSave: Administrator = new Administrator();
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

    signForUser = (admin: Administrator) => {
        return sign({ name: admin.lastname, email: admin.email }, "secred", {
            expiresIn: "1h",
        });
    };

    async findOneByEmail(email: string) {
        return await this.entityManager.findOne(Administrator, {
            where: { email },
        });
    }

    async getAll(): Promise<AdministratorDTO[]> {
        const users = await this.entityManager.find(Administrator);

        return users.map((user: Administrator) => {
            return mapper.map(user, Administrator, AdministratorDTO);
        });
    }
}
