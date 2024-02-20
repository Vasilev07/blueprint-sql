import { AppDataSource } from "../data-source";
import { Administrator } from "../entity/administrator";
import { signForUser } from "../middleware/check-auth";
import { AdministratorDTO } from "../models/administrator-dto";
import { cryptoService } from "./crypto-service";

const findOneByEmail = async (email: string) => {
    return await AppDataSource.manager.findOne(Administrator, { where: { email } });
};

const register = async (dto: AdministratorDTO) => {
    const isEmailAvailable = await administratorService.findOneByEmail(dto.email);

    if (isEmailAvailable !== null && isEmailAvailable !== undefined) {
        throw new Error('Email already in use');
    }

    if (dto.password !== dto.confirmPassword) {
        throw new Error('Passwords do not match');
    }

    const names = dto.fullName.split(' ');

    const adminToSave: Administrator = new Administrator();
    const hashedPassword = await cryptoService.hashPassword(dto.password);

    adminToSave.email = dto.email;
    adminToSave.password = hashedPassword;
    adminToSave.firstname = names[0];
    adminToSave.lastname = names[names.length - 1];

    const savedAdmin = await AppDataSource.manager.save(adminToSave);

    return signForUser(savedAdmin);
};

export const getAll = async () => {
    return await AppDataSource.manager.find(Administrator);
};

export const administratorService = {
    findOneByEmail,
    getAll,
    register
};
