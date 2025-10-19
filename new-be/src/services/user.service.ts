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
import { PhotoLike } from "@entities/photo-like.entity";
import { UserFriend, FriendshipStatus } from "@entities/friend.entity";
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
        const currentUserId = this.getUserIdFromRequest(req);
        const userId = currentUserId; // Get own photos

        const photos = await this.entityManager.find(UserPhoto, {
            where: { userId },
            order: { uploadedAt: "DESC" },
        });

        return await this.mapPhotosToDTO(photos, currentUserId);
    }

    async getUserPhotosByUserId(
        userId: number,
        currentUserId?: number,
    ): Promise<UserPhotoDTO[]> {
        // Check if currentUser can view these photos
        // if (currentUserId && currentUserId !== userId) {
        //     const areFriends = await this.areUsersFriends(
        //         currentUserId,
        //         userId,
        //     );
        //     if (!areFriends) {
        //         throw new ForbiddenException(
        //             "You must be friends to view this user's photos",
        //         );
        //     }
        // }

        const photos = await this.entityManager.find(UserPhoto, {
            where: { userId },
            order: { uploadedAt: "DESC" },
        });

        return await this.mapPhotosToDTO(photos, currentUserId);
    }

    private async areUsersFriends(
        userId1: number,
        userId2: number,
    ): Promise<boolean> {
        // Check if users are friends in either direction
        const friendship = await this.entityManager.findOne(UserFriend, {
            where: [
                {
                    userId: userId1,
                    friendId: userId2,
                    status: FriendshipStatus.ACCEPTED,
                },
                {
                    userId: userId2,
                    friendId: userId1,
                    status: FriendshipStatus.ACCEPTED,
                },
            ],
        });

        return !!friendship;
    }

    private async mapPhotosToDTO(
        photos: UserPhoto[],
        currentUserId?: number,
    ): Promise<UserPhotoDTO[]> {
        // Get all liked photo IDs for the current user in one query
        let likedPhotoIds: Set<number> = new Set();
        if (currentUserId) {
            const likes = await this.entityManager.find(PhotoLike, {
                where: { userId: currentUserId },
                select: ["photoId"],
            });
            likedPhotoIds = new Set(likes.map((like) => like.photoId));
        }

        return photos.map((p) => ({
            id: p.id,
            name: p.name,
            userId: p.userId,
            uploadedAt: p.uploadedAt,
            likesCount: p.likesCount || 0,
            isLikedByCurrentUser: currentUserId
                ? likedPhotoIds.has(p.id)
                : false,
        }));
    }

    async getPhoto(photoId: number, req: any): Promise<UserPhoto> {
        const currentUserId = this.getUserIdFromRequest(req);

        const photo = await this.entityManager.findOne(UserPhoto, {
            where: { id: photoId },
        });

        if (!photo) {
            throw new NotFoundException("Photo not found");
        }

        // Allow if it's the user's own photo
        if (photo.userId === currentUserId) {
            return photo;
        }

        // Check if users are friends
        const areFriends = await this.areUsersFriends(
            currentUserId,
            photo.userId,
        );
        if (!areFriends) {
            throw new ForbiddenException(
                "You must be friends to view this photo",
            );
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

    async getUserById(userId: number): Promise<UserDTO> {
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

    async getProfilePictureByUserId(userId: number): Promise<UserPhoto | null> {
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

    async likePhoto(
        photoId: number,
        req: any,
    ): Promise<{ likesCount: number; isLiked: boolean }> {
        const userId = this.getUserIdFromRequest(req);

        // Check if photo exists
        const photo = await this.entityManager.findOne(UserPhoto, {
            where: { id: photoId },
        });

        if (!photo) {
            throw new NotFoundException("Photo not found");
        }

        // Check if already liked
        const existingLike = await this.entityManager.findOne(PhotoLike, {
            where: { userId, photoId },
        });

        if (existingLike) {
            throw new BadRequestException("Photo already liked");
        }

        // Create like
        const like = new PhotoLike();
        like.userId = userId;
        like.photoId = photoId;
        await this.entityManager.save(like);

        // Increment like count
        await this.entityManager.increment(
            UserPhoto,
            { id: photoId },
            "likesCount",
            1,
        );

        // Get updated count
        const updatedPhoto = await this.entityManager.findOne(UserPhoto, {
            where: { id: photoId },
        });

        return {
            likesCount: updatedPhoto?.likesCount || 1,
            isLiked: true,
        };
    }

    async unlikePhoto(
        photoId: number,
        req: any,
    ): Promise<{ likesCount: number; isLiked: boolean }> {
        const userId = this.getUserIdFromRequest(req);

        // Check if photo exists
        const photo = await this.entityManager.findOne(UserPhoto, {
            where: { id: photoId },
        });

        if (!photo) {
            throw new NotFoundException("Photo not found");
        }

        // Check if like exists
        const existingLike = await this.entityManager.findOne(PhotoLike, {
            where: { userId, photoId },
        });

        if (!existingLike) {
            throw new BadRequestException("Photo not liked yet");
        }

        // Delete like
        await this.entityManager.delete(PhotoLike, { userId, photoId });

        // Decrement like count
        await this.entityManager.decrement(
            UserPhoto,
            { id: photoId },
            "likesCount",
            1,
        );

        // Get updated count
        const updatedPhoto = await this.entityManager.findOne(UserPhoto, {
            where: { id: photoId },
        });

        return {
            likesCount: Math.max(updatedPhoto?.likesCount || 0, 0),
            isLiked: false,
        };
    }

    async deletePhoto(photoId: number, req: any): Promise<void> {
        const userId = this.getUserIdFromRequest(req);

        // Find the photo
        const photo = await this.entityManager.findOne(UserPhoto, {
            where: { id: photoId },
        });

        if (!photo) {
            throw new NotFoundException("Photo not found");
        }

        // Check ownership
        if (photo.userId !== userId) {
            throw new ForbiddenException("You can only delete your own photos");
        }

        // If it's the profile picture, remove it
        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
        });

        if (user && user.profilePictureId === photoId) {
            user.profilePictureId = null;
            await this.entityManager.save(user);
        }

        // Delete the photo (likes will be cascade deleted)
        await this.entityManager.delete(UserPhoto, { id: photoId });
    }
}
