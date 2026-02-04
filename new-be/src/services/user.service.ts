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
import { Role } from "../enums/role.enum";
import { UserDTO } from "../models/user.dto";
import { UserPhotoDTO } from "../models/user-photo.dto";
import {
    UserProfileDTO,
    UpdateUserProfileDTO,
} from "../models/user-profile.dto";
import { sign } from "jsonwebtoken";
import { CryptoService } from "./crypto.service";
import { EntityManager, In } from "typeorm";
import { User } from "@entities/user.entity";
import { UserProfile } from "@entities/user-profile.entity";
import { UserPhoto } from "@entities/user-photo.entity";
import { PhotoLike } from "@entities/photo-like.entity";
import { SuperLike } from "@entities/super-like.entity";
import { UserFriend, FriendshipStatus } from "@entities/friend.entity";
import { VerificationRequest } from "@entities/verification-request.entity";
import { UserMapper } from "@mappers/implementations/user.mapper";
import { MapperService } from "@mappers/mapper.service";
import { VerificationStatus } from "src/enums/verification-status.enum";
import { WalletService } from "./wallet.service";

@Injectable()
export class UserService implements OnModuleInit {
    private userMapper: UserMapper;

    constructor(
        private cryptoService: CryptoService,
        private entityManager: EntityManager,
        private configService: ConfigService,
        @Inject(MapperService) private readonly mapperService: MapperService,
        private walletService: WalletService,
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

        const savedAdmin = await this.entityManager.save(adminToSave);

        // Create user profile
        const profile = new UserProfile();
        profile.userId = savedAdmin.id;
        if (dto.city) {
            profile.city = dto.city;
        }
        await this.entityManager.save(profile);

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
            relations: ['profile']
        });
    }

    async getAll(options?: {
        page?: number;
        limit?: number;
        filter?: string;
        sort?: string;
        search?: string;
        currentUserId?: number;
        gender?: string;
        ageMin?: number;
        ageMax?: number;
        interests?: string;
        relationshipStatus?: string;
        verifiedOnly?: boolean;
    }): Promise<{
        users: UserDTO[];
        page: number;
        limit: number;
        totalUsers: number;
        totalPages: number;
        hasMore: boolean;
    }> {
        // If no options provided, return old behavior for backwards compatibility
        if (!options) {
            const users = await this.entityManager.find(User, {
                relations: ["profile"],
            });

            const mappedUsers = await this.mapUsersWithProfiles(users);

            return {
                users: mappedUsers,
                page: 1,
                limit: mappedUsers.length,
                totalUsers: mappedUsers.length,
                totalPages: 1,
                hasMore: false,
            };
        }

        const {
            page = 1,
            limit = 12,
            filter = "all",
            sort = "recent",
            search = "",
            currentUserId,
            gender,
            ageMin,
            ageMax,
            interests,
            relationshipStatus,
            verifiedOnly,
        } = options;

        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Build query with QueryBuilder for more control
        let query = this.entityManager
            .createQueryBuilder(User, "user")
            .leftJoinAndSelect("user.profile", "profile");

        // Build the base where conditions
        const whereConditions: string[] = [];
        const whereParams: any = {};

        // Exclude current user if provided
        if (currentUserId) {
            console.log(`Excluding current user ID: ${currentUserId} from results`);
            whereConditions.push("user.id != :currentUserId");
            whereParams.currentUserId = currentUserId;
        }

        // Count total users before filtering
        const totalUsersBeforeFilter = await this.entityManager.count(User);
        console.log(`Total users in database: ${totalUsersBeforeFilter}`);

        // Apply search filter
        if (search && search.trim().length > 0) {
            whereConditions.push(
                "(user.firstname LIKE :search OR user.lastname LIKE :search OR user.email LIKE :search OR profile.bio LIKE :search OR profile.location LIKE :search OR profile.city LIKE :search)",
            );
            whereParams.search = `%${search}%`;
        }

        // Apply filters
        switch (filter) {
            case "online":
                // Online: last seen within 5 minutes
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                whereConditions.push("user.lastOnline >= :fiveMinutesAgo");
                whereParams.fiveMinutesAgo = fiveMinutesAgo;
                console.log(`Online filter: last seen after ${fiveMinutesAgo}`);
                break;
            case "new":
                // New users: registered in last 7 days
                const sevenDaysAgo = new Date(
                    Date.now() - 7 * 24 * 60 * 60 * 1000,
                );
                whereConditions.push("user.createdAt >= :sevenDaysAgo");
                whereParams.sevenDaysAgo = sevenDaysAgo;
                console.log(`New filter: created after ${sevenDaysAgo}`);
                break;
            case "nearby":
                // TODO: Implement geolocation-based filtering
                // For now, just return normal results
                break;
            case "friends":
                // TODO: Implement friends filtering (requires join with UserFriend table)
                // For now, just return normal results
                break;
            case "all":
            default:
                // No additional filter
                console.log(`No filter applied (filter: ${filter})`);
                break;
        }

        // Apply advanced filters
        if (gender && gender !== "all") {
            whereConditions.push("user.gender = :gender");
            whereParams.gender = gender;
        }

        // Age range filter (requires birthDate field - for now we'll skip this)
        // TODO: Add birthDate field to user profile to support age filtering
        // if (ageMin || ageMax) {
        //     const currentDate = new Date();
        //     if (ageMax) {
        //         const minBirthDate = new Date(currentDate.getFullYear() - ageMax, currentDate.getMonth(), currentDate.getDate());
        //         whereConditions.push("profile.birthDate <= :minBirthDate");
        //         whereParams.minBirthDate = minBirthDate;
        //     }
        //     if (ageMin) {
        //         const maxBirthDate = new Date(currentDate.getFullYear() - ageMin, currentDate.getMonth(), currentDate.getDate());
        //         whereConditions.push("profile.birthDate >= :maxBirthDate");
        //         whereParams.maxBirthDate = maxBirthDate;
        //     }
        // }

        // Interests filter
        if (interests && interests.trim().length > 0) {
            const interestArray = interests
                .split(",")
                .map((i) => i.trim())
                .filter((i) => i.length > 0);
            if (interestArray.length > 0) {
                const interestConditions = interestArray
                    .map(
                        (_, index) =>
                            `:interest${index} = ANY(profile.interests)`,
                    )
                    .join(" OR ");
                whereConditions.push(`(${interestConditions})`);
                interestArray.forEach((interest, index) => {
                    whereParams[`interest${index}`] = interest;
                });
            }
        }

        // Relationship status filter (requires relationshipStatus field - for now we'll skip this)
        // TODO: Add relationshipStatus field to user profile
        // if (relationshipStatus && relationshipStatus !== "all") {
        //     whereConditions.push("profile.relationshipStatus = :relationshipStatus");
        //     whereParams.relationshipStatus = relationshipStatus;
        // }

        // Verified only filter
        if (verifiedOnly) {
            whereConditions.push("profile.isVerified = :verified");
            whereParams.verified = true;
        }

        console.log(`verifiedOnly parameter: ${verifiedOnly}, type: ${typeof verifiedOnly}`);

        // Apply all where conditions at once
        if (whereConditions.length > 0) {
            console.log(`Applying ${whereConditions.length} where conditions:`, whereConditions);
            query = query.where(whereConditions.join(" AND "), whereParams);
        } else {
            console.log(`No where conditions applied`);
        }

        // Apply sorting
        switch (sort) {
            case "recent":
                query = query.orderBy("user.lastOnline", "DESC", "NULLS LAST");
                break;
            case "new":
                query = query.orderBy("user.id", "DESC");
                break;
            case "distance":
                // TODO: Implement distance-based sorting (requires geolocation)
                query = query.orderBy("user.id", "DESC");
                break;
            default:
                query = query.orderBy("user.id", "DESC");
                break;
        }

        // Get total count before pagination
        console.log(`Raw SQL query:`, query.getQuery());
        const totalUsers = await query.getCount();
        console.log(`Total users found by query: ${totalUsers}`);

        // Apply pagination using skip() and take()
        query = query.skip(skip).take(limit);

        // Execute query
        const users = await query.getMany();

        console.log(`Query result: Found ${users.length} users after filtering`);
        console.log(`User IDs returned:`, users.map(u => u.id));

        // Get profile view counts for returned users
        const userIds = users.map((u) => u.id).filter((id): id is number => id !== undefined && id !== null);
        let viewCountMap = new Map<number, number>();
        let likesCountMap = new Map<number, number>();

        if (userIds.length > 0) {
            // Get profile view counts
            const profileViewRepo =
                this.entityManager.getRepository("ProfileView");
            const viewCounts = await profileViewRepo
                .createQueryBuilder("view")
                .select("view.userId", "userId")
                .addSelect("COUNT(DISTINCT view.viewerId)", "viewCount")
                .where("view.userId IN (:...userIds)", { userIds })
                .groupBy("view.userId")
                .getRawMany();

            viewCountMap = new Map(
                viewCounts.map((v) => [v.userId, parseInt(v.viewCount)]),
            );

            // Get super likes counts (count of super likes received by each user)
            try {
                const superLikeRepo = this.entityManager.getRepository(SuperLike);
                const superLikesCounts = await superLikeRepo
                    .createQueryBuilder("superLike")
                    .select("superLike.receiverId", "userId")
                    .addSelect("COUNT(superLike.id)", "superLikesCount")
                    .where("superLike.receiverId IN (:...userIds)", { userIds })
                    .groupBy("superLike.receiverId")
                    .getRawMany();

                likesCountMap = new Map(
                    superLikesCounts.map((sl) => [
                        parseInt(sl.userId),
                        parseInt(sl.superLikesCount) || 0,
                    ]),
                );
            } catch (error) {
                console.error("Error counting super likes:", error);
                // Continue with empty map - all users will have 0 super likes
                likesCountMap = new Map();
            }
        }

        // Map users to DTOs with profile data
        const mappedUsers = users.map((user) => {
            const userDTO = this.userMapper.entityToDTO(user);
            return {
                ...userDTO,
                bio: user.profile?.bio || null,
                location: user.profile?.location || null,
                interests: user.profile?.interests || [],
                appearsInSearches: user.profile?.appearsInSearches !== false,
                profileViewsCount: viewCountMap.get(user.id) || 0,
                superLikesCount: likesCountMap.get(user.id) || 0,
                isVerified: user.profile?.isVerified || false,
            };
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalUsers / limit);
        const hasMore = page < totalPages;

        // Temporary debug logging
        console.log(
            `Pagination Debug - Page: ${page}, TotalUsers: ${totalUsers}, TotalPages: ${totalPages}, HasMore: ${hasMore}, UsersReturned: ${mappedUsers.length}`,
        );

        return {
            users: mappedUsers,
            page,
            limit,
            totalUsers,
            totalPages,
            hasMore,
        };
    }

    private async mapUsersWithProfiles(users: User[]): Promise<UserDTO[]> {
        // Get profile view counts for all users
        let viewCountMap = new Map<number, number>();
        let likesCountMap = new Map<number, number>();

        try {
            const profileViewRepo =
                this.entityManager.getRepository("ProfileView");
            const viewCounts = await profileViewRepo
                .createQueryBuilder("view")
                .select("view.userId", "userId")
                .addSelect("COUNT(DISTINCT view.viewerId)", "viewCount")
                .groupBy("view.userId")
                .getRawMany();

            viewCountMap = new Map(
                viewCounts.map((v) => [v.userId, parseInt(v.viewCount)]),
            );
        } catch (error) {
            // Continue without profile view counts
        }

        try {
            // Get super likes counts (count of super likes received by each user)
            const userIds = users.map((u) => u.id);
            if (userIds.length > 0) {
                const superLikeRepo = this.entityManager.getRepository(SuperLike);
                const superLikesCounts = await superLikeRepo
                    .createQueryBuilder("superLike")
                    .select("superLike.receiverId", "userId")
                    .addSelect("COUNT(superLike.id)", "superLikesCount")
                    .where("superLike.receiverId IN (:...userIds)", { userIds })
                    .groupBy("superLike.receiverId")
                    .getRawMany();

                likesCountMap = new Map(
                    superLikesCounts.map((sl) => [
                        parseInt(sl.userId),
                        parseInt(sl.superLikesCount) || 0,
                    ]),
                );
            }
        } catch (error) {
            console.error("Error counting super likes in mapUsersWithProfiles:", error);
            // Continue without likes counts
            likesCountMap = new Map();
        }

        return users.map((user) => {
            const userDTO = this.userMapper.entityToDTO(user);
            // Include profile data for home screen
            return {
                ...userDTO,
                bio: user.profile?.bio || null,
                location: user.profile?.location || null,
                interests: user.profile?.interests || [],
                appearsInSearches: user.profile?.appearsInSearches !== false,
                profileViewsCount: viewCountMap.get(user.id) || 0,
                superLikesCount: likesCountMap.get(user.id) || 0,
                isVerified: user.profile?.isVerified || false,
            };
        });
    }

    /**
     * Converts Buffer to PostgreSQL bytea hex format.
     * TypeORM truncates Buffer at null bytes (0x00) when saving to bytea -
     * hex format avoids this corruption for binary image data.
     */
    private bufferToByteaHex(buffer: Buffer): string {
        return "\\x" + buffer.toString("hex");
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

        // Get user profile
        const profile = await this.entityManager.findOne(UserProfile, {
            where: { userId },
        });

        if (!profile) {
            throw new NotFoundException("User profile not found");
        }

        const photo = new UserPhoto();
        photo.userProfileId = profile.id;
        photo.name = file.originalname;
        // TypeORM/PostgreSQL bytea truncates at null bytes - use hex format to avoid corruption
        photo.data = this.bufferToByteaHex(file.buffer) as any;

        const saved = await this.entityManager.save(photo);

        return {
            id: saved.id,
            name: saved.name,
            userId: userId, // Keep userId in DTO for backwards compatibility
            uploadedAt: saved.uploadedAt,
        };
    }

    async getUserPhotos(req: any): Promise<UserPhotoDTO[]> {
        const currentUserId = this.getUserIdFromRequest(req);

        const profile = await this.entityManager.findOne(UserProfile, {
            where: { userId: currentUserId },
        });

        if (!profile) {
            return [];
        }

        const photos = await this.entityManager.find(UserPhoto, {
            where: { userProfileId: profile.id },
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

        const profile = await this.entityManager.findOne(UserProfile, {
            where: { userId },
        });

        if (!profile) {
            return [];
        }

        const photos = await this.entityManager.find(UserPhoto, {
            where: { userProfileId: profile.id },
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

        // Get all user profiles to map userProfileId to userId
        const profileIds = photos.map((p) => p.userProfileId);
        const profiles =
            profileIds.length > 0
                ? await this.entityManager.find(UserProfile, {
                    where: { id: In(profileIds) },
                })
                : [];
        const profileMap = new Map(profiles.map((p) => [p.id, p.userId]));

        return photos.map((p) => ({
            id: p.id,
            name: p.name,
            userId: profileMap.get(p.userProfileId) || 0,
            uploadedAt: p.uploadedAt,
            likesCount: p.likesCount || 0,
            isLikedByCurrentUser: currentUserId
                ? likedPhotoIds.has(p.id)
                : false,
        }));
    }

    async getPhoto(photoId: number, req: any): Promise<UserPhoto> {
        this.getUserIdFromRequest(req); // Ensure user is authenticated

        const photo = await this.entityManager.findOne(UserPhoto, {
            where: { id: photoId },
            relations: ["userProfile"],
        });

        if (!photo) {
            throw new NotFoundException("Photo not found");
        }

        // Allow any authenticated user to view photos (aligned with getUserPhotosByUserId
        // which returns photo list to all authenticated users for profile viewing)
        return photo;
    }

    async getUser(req: any): Promise<UserDTO & { balance?: string }> {
        const userId = this.getUserIdFromRequest(req);

        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
            relations: ["profile"],
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        const userDto = this.userMapper.entityToDTO(user);
        const balance = await this.walletService.getBalance(userId);
        return { ...userDto, balance };
    }

    async getUserById(userId: number): Promise<UserDTO & { balance?: string }> {
        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
            relations: ["profile"],
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        const userDto = this.userMapper.entityToDTO(user);
        const balance = await this.walletService.getBalance(userId);
        return { ...userDto, balance };
    }

    async updateProfile(
        updateData: Partial<UserDTO> & {
            bio?: string;
            interests?: string[];
            appearsInSearches?: boolean;
        },
        req: any,
    ): Promise<User> {
        const userId = this.getUserIdFromRequest(req);

        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        // Update user fields
        if (updateData.gender !== undefined) {
            user.gender = updateData.gender;
        }
        if (updateData.fullName !== undefined) {
            const names = updateData.fullName.split(" ");
            user.firstname = names[0];
            user.lastname = names[names.length - 1];
        }

        const updatedUser = await this.entityManager.save(user);

        // Update profile fields
        let profile = await this.entityManager.findOne(UserProfile, {
            where: { userId },
        });

        if (!profile) {
            profile = new UserProfile();
            profile.userId = userId;
        }

        // Update all profile fields
        if (updateData.city !== undefined) {
            profile.city = updateData.city;
        }
        if (updateData.bio !== undefined) {
            profile.bio = updateData.bio;
        }
        if (updateData.interests !== undefined) {
            profile.interests = updateData.interests;
        }
        if (updateData.appearsInSearches !== undefined) {
            profile.appearsInSearches = updateData.appearsInSearches;
        }

        await this.entityManager.save(profile);

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

        // Get user profile
        let profile = await this.entityManager.findOne(UserProfile, {
            where: { userId },
        });

        if (!profile) {
            profile = new UserProfile();
            profile.userId = userId;
            profile = await this.entityManager.save(profile);
        }

        // First, upload the photo
        const photo = new UserPhoto();
        photo.userProfileId = profile.id;
        photo.name = file.originalname;
        // TypeORM/PostgreSQL bytea truncates at null bytes - use hex format to avoid corruption
        photo.data = this.bufferToByteaHex(file.buffer) as any;

        const savedPhoto = await this.entityManager.save(photo);

        // Then, set it as the profile picture
        profile.profilePictureId = savedPhoto.id;
        await this.entityManager.save(profile);

        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
        });

        return this.userMapper.entityToDTO(user);
    }

    async setProfilePicture(photoId: number, req: any): Promise<UserDTO> {
        const userId = this.getUserIdFromRequest(req);

        // Get user profile
        let profile = await this.entityManager.findOne(UserProfile, {
            where: { userId },
        });

        if (!profile) {
            profile = new UserProfile();
            profile.userId = userId;
            profile = await this.entityManager.save(profile);
        }

        // Verify the photo exists and belongs to the user
        const photo = await this.entityManager.findOne(UserPhoto, {
            where: { id: photoId, userProfileId: profile.id },
        });

        if (!photo) {
            throw new NotFoundException(
                "Photo not found or doesn't belong to you",
            );
        }

        // Set it as profile picture
        profile.profilePictureId = photoId;
        await this.entityManager.save(profile);

        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        return this.userMapper.entityToDTO(user);
    }

    async getProfilePicture(req: any): Promise<UserPhoto | null> {
        const userId = this.getUserIdFromRequest(req);

        const profile = await this.entityManager.findOne(UserProfile, {
            where: { userId },
        });

        if (!profile || !profile.profilePictureId) {
            return null;
        }

        const photo = await this.entityManager.findOne(UserPhoto, {
            where: { id: profile.profilePictureId },
        });

        return photo;
    }

    async getProfilePictureByUserId(userId: number): Promise<UserPhoto | null> {
        const profile = await this.entityManager.findOne(UserProfile, {
            where: { userId },
        });

        if (!profile || !profile.profilePictureId) {
            return null;
        }

        const photo = await this.entityManager.findOne(UserPhoto, {
            where: { id: profile.profilePictureId },
        });

        return photo;
    }

    async removeProfilePicture(req: any): Promise<UserDTO> {
        const userId = this.getUserIdFromRequest(req);

        const profile = await this.entityManager.findOne(UserProfile, {
            where: { userId },
        });

        if (profile) {
            profile.profilePictureId = null;
            await this.entityManager.save(profile);
        }

        const user = await this.entityManager.findOne(User, {
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        return this.userMapper.entityToDTO(user);
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
            relations: ["userProfile"],
        });

        if (!photo) {
            throw new NotFoundException("Photo not found");
        }

        // Check ownership
        if (photo.userProfile.userId !== userId) {
            throw new ForbiddenException("You can only delete your own photos");
        }

        // If it's the profile picture, remove it
        const profile = await this.entityManager.findOne(UserProfile, {
            where: { userId },
        });

        if (profile && profile.profilePictureId === photoId) {
            profile.profilePictureId = null;
            await this.entityManager.save(profile);
        }

        // Delete the photo (likes will be cascade deleted)
        await this.entityManager.delete(UserPhoto, { id: photoId });
    }

    async getUserProfile(req: any): Promise<UserProfileDTO> {
        const userId = this.getUserIdFromRequest(req);

        let profile = await this.entityManager.findOne(UserProfile, {
            where: { userId },
        });

        // If profile doesn't exist, create one
        if (!profile) {
            profile = new UserProfile();
            profile.userId = userId;
            profile = await this.entityManager.save(profile);
        }

        return {
            id: profile.id,
            userId: profile.userId,
            bio: profile.bio,
            city: profile.city,
            location: profile.location,
            interests: profile.interests || [],
            appearsInSearches: profile.appearsInSearches,
            profilePictureId: profile.profilePictureId,
            dateOfBirth: profile.dateOfBirth,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
        };
    }

    async getUserProfileByUserId(
        userId: number,
    ): Promise<UserProfileDTO | null> {
        const profile = await this.entityManager.findOne(UserProfile, {
            where: { userId },
        });

        if (!profile) {
            return null;
        }

        // Only return profile if user appears in searches or if they don't have this setting
        if (profile.appearsInSearches === false) {
            // Could add friend check here if needed to allow friends to view
            return null;
        }

        return {
            id: profile.id,
            userId: profile.userId,
            bio: profile.bio,
            city: profile.city,
            location: profile.location,
            interests: profile.interests || [],
            appearsInSearches: profile.appearsInSearches,
            profilePictureId: profile.profilePictureId,
            dateOfBirth: profile.dateOfBirth,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
        };
    }

    async updateUserProfile(
        updateData: UpdateUserProfileDTO,
        req: any,
    ): Promise<UserProfileDTO> {
        const userId = this.getUserIdFromRequest(req);

        let profile = await this.entityManager.findOne(UserProfile, {
            where: { userId },
        });

        // If profile doesn't exist, create one
        if (!profile) {
            profile = new UserProfile();
            profile.userId = userId;
        }

        // Update fields
        if (updateData.bio !== undefined) {
            profile.bio = updateData.bio;
        }
        if (updateData.city !== undefined) {
            profile.city = updateData.city;
        }
        if (updateData.location !== undefined) {
            profile.location = updateData.location;
        }
        if (updateData.interests !== undefined) {
            profile.interests = updateData.interests;
        }
        if (updateData.appearsInSearches !== undefined) {
            profile.appearsInSearches = updateData.appearsInSearches;
        }
        if (updateData.dateOfBirth !== undefined) {
            profile.dateOfBirth = updateData.dateOfBirth;
        }

        const savedProfile = await this.entityManager.save(profile);

        return {
            id: savedProfile.id,
            userId: savedProfile.userId,
            bio: savedProfile.bio,
            city: savedProfile.city,
            location: savedProfile.location,
            interests: savedProfile.interests || [],
            appearsInSearches: savedProfile.appearsInSearches,
            profilePictureId: savedProfile.profilePictureId,
            dateOfBirth: savedProfile.dateOfBirth,
            createdAt: savedProfile.createdAt,
            updatedAt: savedProfile.updatedAt,
        };
    }

    async uploadVerificationPhoto(
        file: Express.Multer.File,
        userId: number,
    ): Promise<number> {
        // Validate file
        if (!file) {
            throw new BadRequestException("No file provided");
        }

        const allowedMimeTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`,
            );
        }

        const maxFileSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxFileSize) {
            throw new BadRequestException(
                `File too large. Maximum size: ${maxFileSize / 1024 / 1024}MB`,
            );
        }

        // Generate filename
        const timestamp = Date.now();
        const ext = file.originalname.split(".").pop();
        const filename = `verification-${timestamp}-user${userId}-${Math.random().toString(36).substring(7)}.${ext}`;

        // Save file to verification directory
        const uploadDir = this.configService.get<string>(
            "UPLOAD_DIR",
            "./uploads",
        );
        const verificationDir = `${uploadDir}/verifications`;
        const filePath = `${verificationDir}/${filename}`;

        const fs = require("fs");
        if (!fs.existsSync(verificationDir)) {
            fs.mkdirSync(verificationDir, { recursive: true });
        }

        fs.writeFileSync(filePath, file.buffer);

        const verificationRequest = new VerificationRequest();
        verificationRequest.userId = userId;
        verificationRequest.verificationPhoto = `verifications/${filename}`;
        verificationRequest.status = VerificationStatus.PENDING;

        const savedRequest = await this.entityManager.save(verificationRequest);
        return savedRequest.id;
    }

    async getVerificationStatus(userId: number): Promise<{
        isVerified: boolean;
        verificationRequest?: any;
    }> {
        // Check if user profile is verified
        const profile = await this.entityManager.findOne(UserProfile, {
            where: { userId },
        });

        if (!profile) {
            return { isVerified: false };
        }

        // Get latest verification request
        const verificationRequest = await this.entityManager.findOne(
            VerificationRequest,
            {
                where: { userId },
                order: { createdAt: "DESC" },
            },
        );

        return {
            isVerified: profile.isVerified,
            verificationRequest: verificationRequest || null,
        };
    }

    async getAllVerificationRequests(status?: string): Promise<any[]> {

        const whereCondition = status ? { status: status as any } : {};

        const requests = await this.entityManager.find(VerificationRequest, {
            where: whereCondition,
            relations: ["user"],
            order: { createdAt: "DESC" },
        });

        return requests.map((request) =>
            this.mapperService.entityToDTO("VerificationRequest", request),
        );
    }

    async reviewVerificationRequest(
        verificationId: number,
        status: string,
        rejectionReason: string | undefined,
        adminId: number,
    ): Promise<{ userId: number }> {

        const verificationRequest = await this.entityManager.findOne(
            VerificationRequest,
            {
                where: { id: verificationId },
            },
        );

        if (!verificationRequest) {
            throw new NotFoundException("Verification request not found");
        }

        // Update verification request
        verificationRequest.status = status as any;
        verificationRequest.reviewedBy = adminId;
        verificationRequest.reviewedAt = new Date();

        if (status === "rejected" && rejectionReason) {
            verificationRequest.rejectionReason = rejectionReason;
        }

        await this.entityManager.save(verificationRequest);

        // If approved, update user profile
        if (status === "verified") {
            const profile = await this.entityManager.findOne(UserProfile, {
                where: { userId: verificationRequest.userId },
            });

            if (profile) {
                profile.isVerified = true;
                await this.entityManager.save(profile);
            }
        }

        return { userId: verificationRequest.userId };
    }

    async getVerificationPhoto(verificationId: number): Promise<any> {
        const verificationRequest = await this.entityManager.findOne(
            VerificationRequest,
            {
                where: { id: verificationId },
            },
        );

        if (!verificationRequest) {
            throw new NotFoundException("Verification request not found");
        }

        // Read the photo file from the file system
        const fs = require('fs');
        const path = require('path');

        try {
            const photoPath = path.join(process.cwd(), 'uploads', verificationRequest.verificationPhoto);
            const photoData = fs.readFileSync(photoPath);

            return {
                data: photoData,
                name: verificationRequest.verificationPhoto,
            };
        } catch (error) {
            throw new NotFoundException("Verification photo file not found");
        }
    }
}
