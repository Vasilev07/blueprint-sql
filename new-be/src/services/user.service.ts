import { Inject, Injectable, OnModuleInit, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UserDTO } from "../models/user.dto";
import { UserPhotoDTO } from "../models/user-photo.dto";
import { sign } from "jsonwebtoken";
import { CryptoService } from "./crypto.service";
import { EntityManager } from "typeorm";
import { User } from "@entities/user.entity";
import { UserPhoto } from "@entities/user-photo.entity";
import { UserMapper } from "@mappers/implementations/user.mapper";
import { MapperService } from "@mappers/mapper.service";

@Injectable()
export class UserService implements OnModuleInit {
    private userMapper: UserMapper;

    constructor(
        private cryptoService: CryptoService,
        private entityManager: EntityManager,
        @Inject(MapperService) private readonly mapperService: MapperService,
    ) {
        // this.userMapper = this.mapperService.getMapper("User");
    }

    public onModuleInit(): void {
        this.userMapper = this.mapperService.getMapper("User");
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
        return sign({ name: admin.lastname, email: admin.email, id: admin.id }, "secred", {
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
        return users.map((user) => {
            // Don't include passwords in the list
            return this.userMapper.entityToDTO(user);
        });
    }

    private getUserIdFromRequest(req: any): number {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) throw new UnauthorizedException("No token provided");
        
        try {
            const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
            return decoded.id;
        } catch {
            throw new UnauthorizedException("Invalid token");
        }
    }

    async uploadPhoto(file: Express.Multer.File, req: any): Promise<UserPhotoDTO> {
        if (!file) {
            throw new Error("No file provided");
        }

        const userId = this.getUserIdFromRequest(req);
        
        const photo = new UserPhoto();
        photo.userId = userId;
        photo.name = file.originalname;
        photo.data = file.buffer as any;

        const saved = await this.entityManager.save(photo);

        return {
            id: saved.id,
            name: saved.name,
            userId: saved.userId,
            uploadedAt: saved.uploadedAt
        };
    }

    async getUserPhotos(req: any): Promise<UserPhotoDTO[]> {
        const userId = this.getUserIdFromRequest(req);
        
        const photos = await this.entityManager.find(UserPhoto, {
            where: { userId },
            order: { uploadedAt: "DESC" }
        });

        return photos.map(p => ({
            id: p.id,
            name: p.name,
            userId: p.userId,
            uploadedAt: p.uploadedAt
        }));
    }

    async getPhoto(photoId: number): Promise<UserPhoto> {
        const photo = await this.entityManager.findOne(UserPhoto, {
            where: { id: photoId }
        });

        if (!photo) {
            throw new NotFoundException("Photo not found");
        }

        return photo;
    }

    async getUser(req: any): Promise<UserDTO> {
        const userId = this.getUserIdFromRequest(req);
        
        const user = await this.entityManager.findOne(User, {
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        return this.userMapper.entityToDTO(user);
    }

    async updateProfile(updateData: Partial<UserDTO>, req: any): Promise<User> {
        const userId = this.getUserIdFromRequest(req);
        
        const user = await this.entityManager.findOne(User, {
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        // Update allowed fields
        if (updateData.gender !== undefined) {
            user.gender = updateData.gender;
        }
        if (updateData.city !== undefined) {
            user.city = updateData.city;
        }
        if (updateData.fullName !== undefined) {
            const names = updateData.fullName.split(" ");
            user.firstname = names[0];
            user.lastname = names[names.length - 1];
        }

        const updatedUser = await this.entityManager.save(user);
        return updatedUser;
    }

    mapUserToDTO(user: User): UserDTO {
        return this.userMapper.entityToDTO(user);
    }
}
