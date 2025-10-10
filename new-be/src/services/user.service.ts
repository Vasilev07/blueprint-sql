import {
    Inject,
    Injectable,
    OnModuleInit,
    NotFoundException,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
        private configService: ConfigService,
        @Inject(MapperService) private readonly mapperService: MapperService,
    ) {
        // this.userMapper = this.mapperService.getMapper("User");
    }

    public onModuleInit(): void {
        this.userMapper = this.mapperService.getMapper("User");
    }

    async checkEmailAvailability(
        email: string,
    ): Promise<{ available: boolean }> {
        const user = await this.findOneByEmail(email);
        return { available: user === null || user === undefined };
    }

    async register(dto: UserDTO) {
        // Validate email
        if (!dto.email || !dto.email.includes("@")) {
            throw new BadRequestException("Invalid email address");
        }

        // Check if email is already in use
        const existingUser = await this.findOneByEmail(dto.email);
        if (existingUser !== null && existingUser !== undefined) {
            throw new ConflictException("Email already in use");
        }

        // Validate passwords match
        if (dto.password !== dto.confirmPassword) {
            throw new BadRequestException("Passwords do not match");
        }

        // Validate password strength (optional but recommended)
        if (dto.password.length < 6) {
            throw new BadRequestException(
                "Password must be at least 6 characters long",
            );
        }

        // Validate full name
        if (!dto.fullName || dto.fullName.trim().length === 0) {
            throw new BadRequestException("Full name is required");
        }

        const names = dto.fullName.trim().split(" ");
        if (names.length < 2) {
            throw new BadRequestException(
                "Please provide both first name and last name",
            );
        }

        const adminToSave: User = new User();
        const hashedPassword = await this.cryptoService.hashPassword(
            dto.password,
        );

        adminToSave.email = dto.email.toLowerCase().trim();
        adminToSave.password = hashedPassword;
        adminToSave.firstname = names[0];
        adminToSave.lastname = names[names.length - 1];

        // Set optional fields
        if (dto.gender) {
            adminToSave.gender = dto.gender;
        }
        if (dto.city) {
            adminToSave.city = dto.city;
        }

        const savedAdmin = await this.entityManager.save(adminToSave);

        return this.signForUser(savedAdmin);
    }

    signForUser = (admin: User) => {
        const jwtSecret = this.configService.get<string>("JWT_SECRET");
        const jwtExpiresIn = this.configService.get<string>(
            "JWT_EXPIRES_IN",
            "1h",
        );

        return sign(
            {
                name: admin.lastname,
                email: admin.email,
                id: admin.id,
            },
            jwtSecret,
            {
                expiresIn: jwtExpiresIn,
            },
        );
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
            const decoded = JSON.parse(
                Buffer.from(token.split(".")[1], "base64").toString(),
            );
            return decoded.id;
        } catch {
            throw new UnauthorizedException("Invalid token");
        }
    }

    async uploadPhoto(
        file: Express.Multer.File,
        req: any,
    ): Promise<UserPhotoDTO> {
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
            uploadedAt: saved.uploadedAt,
        };
    }

    async getUserPhotos(req: any): Promise<UserPhotoDTO[]> {
        const userId = this.getUserIdFromRequest(req);

        const photos = await this.entityManager.find(UserPhoto, {
            where: { userId },
            order: { uploadedAt: "DESC" },
        });

        return photos.map((p) => ({
            id: p.id,
            name: p.name,
            userId: p.userId,
            uploadedAt: p.uploadedAt,
        }));
    }

    async getPhoto(photoId: number, req: any): Promise<UserPhoto> {
        const userId = this.getUserIdFromRequest(req);
        
        const photo = await this.entityManager.findOne(UserPhoto, {
            where: { id: photoId },
        });

        if (!photo) {
            throw new NotFoundException("Photo not found");
        }

        // Authorization check: ensure the photo belongs to the requesting user
        if (photo.userId !== userId) {
            throw new ForbiddenException("You don't have permission to access this photo");
        }

        return photo;
    }

    async getUser(req: any): Promise<UserDTO> {
        const userId = this.getUserIdFromRequest(req);

        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        return this.userMapper.entityToDTO(user);
    }

    async updateProfile(updateData: Partial<UserDTO>, req: any): Promise<User> {
        const userId = this.getUserIdFromRequest(req);

        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
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

    async uploadProfilePicture(
        file: Express.Multer.File,
        req: any,
    ): Promise<UserDTO> {
        if (!file) {
            throw new BadRequestException("No file provided");
        }

        const userId = this.getUserIdFromRequest(req);

        // First, upload the photo
        const photo = new UserPhoto();
        photo.userId = userId;
        photo.name = file.originalname;
        photo.data = file.buffer as any;

        const savedPhoto = await this.entityManager.save(photo);

        // Then, set it as the profile picture
        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        user.profilePictureId = savedPhoto.id;
        const updatedUser = await this.entityManager.save(user);

        return this.userMapper.entityToDTO(updatedUser);
    }

    async setProfilePicture(photoId: number, req: any): Promise<UserDTO> {
        const userId = this.getUserIdFromRequest(req);

        // Verify the photo exists and belongs to the user
        const photo = await this.entityManager.findOne(UserPhoto, {
            where: { id: photoId, userId },
        });

        if (!photo) {
            throw new NotFoundException(
                "Photo not found or doesn't belong to you",
            );
        }

        // Set it as profile picture
        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        user.profilePictureId = photoId;
        const updatedUser = await this.entityManager.save(user);

        return this.userMapper.entityToDTO(updatedUser);
    }

    async getProfilePicture(req: any): Promise<UserPhoto | null> {
        const userId = this.getUserIdFromRequest(req);

        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
        });

        if (!user || !user.profilePictureId) {
            return null;
        }

        const photo = await this.entityManager.findOne(UserPhoto, {
            where: { id: user.profilePictureId },
        });

        return photo;
    }

    async removeProfilePicture(req: any): Promise<UserDTO> {
        const userId = this.getUserIdFromRequest(req);

        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        user.profilePictureId = null;
        const updatedUser = await this.entityManager.save(user);

        return this.userMapper.entityToDTO(updatedUser);
    }
}
