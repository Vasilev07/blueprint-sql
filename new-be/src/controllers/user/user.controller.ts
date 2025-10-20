import {
    Body,
    Controller,
    Get,
    Post,
    Put,
    Delete,
    UploadedFile,
    UseInterceptors,
    Param,
    Res,
    Req,
    Query,
    HttpCode,
    HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthMiddleware } from "src/middlewares/auth.middleware";
import { UserService } from "src/services/user.service";
import { ProfileViewService } from "src/services/profile-view.service";
import { CryptoService } from "src/services/crypto.service";
import { ChatGateway } from "src/gateways/chat.gateway";
import {
    ApiTags,
    ApiBody,
    ApiResponse,
    ApiConsumes,
    ApiOperation,
} from "@nestjs/swagger";
import { User } from "@entities/user.entity";
import { UserDTO } from "../../models/user.dto";
import { UserPhotoDTO } from "../../models/user-photo.dto";
import { ProfileViewDTO } from "../../models/profile-view.dto";
import {
    UserProfileDTO,
    UpdateUserProfileDTO,
} from "../../models/user-profile.dto";
import { Response } from "express";
import { Public } from "../../decorators/public.decorator";

@Controller("/auth")
@ApiTags("User")
export class UserController {
    constructor(
        private userService: UserService,
        private profileViewService: ProfileViewService,
        private cryptoService: CryptoService,
        private authMiddleware: AuthMiddleware,
        private chatGateway: ChatGateway,
    ) {}

    @Get("/all")
    @ApiOperation({ summary: "Get all users with pagination and filters" })
    @ApiResponse({
        status: 200,
        description: "Returns paginated users",
        schema: {
            type: "object",
            properties: {
                users: { type: "array", items: { $ref: "#/components/schemas/UserDTO" } },
                page: { type: "number" },
                limit: { type: "number" },
                totalUsers: { type: "number" },
                totalPages: { type: "number" },
                hasMore: { type: "boolean" },
            },
        },
    })
    async getAll(
        @Query("page") page?: number,
        @Query("limit") limit?: number,
        @Query("filter") filter?: string,
        @Query("sort") sort?: string,
        @Query("search") search?: string,
        @Req() req?: any,
    ): Promise<{
        users: UserDTO[];
        page: number;
        limit: number;
        totalUsers: number;
        totalPages: number;
        hasMore: boolean;
    }> {
        // Get current user ID if authenticated
        let currentUserId: number | undefined;
        try {
            currentUserId = req?.userData?.id;
        } catch (error) {
            currentUserId = undefined;
        }

        return await this.userService.getAll({
            page: page || 1,
            limit: limit || 12,
            filter: filter || "all",
            sort: sort || "recent",
            search: search || "",
            currentUserId: currentUserId,
        });
    }

    @Get("/check-email")
    @ApiOperation({ summary: "Check if email is available for registration" })
    @ApiResponse({
        status: 200,
        description: "Returns email availability status",
        schema: {
            type: "object",
            properties: {
                available: { type: "boolean" },
            },
        },
    })
    async checkEmail(
        @Query("email") email: string,
    ): Promise<{ available: boolean }> {
        if (!email) {
            return { available: false };
        }
        return await this.userService.checkEmailAvailability(email);
    }

    @Public()
    @Post("/login")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                email: { type: "string", example: "user@example.com" },
                password: { type: "string", example: "password123" },
            },
            required: ["email", "password"],
        },
    })
    @ApiResponse({
        status: 201,
        description: "Login successful",
        schema: {
            type: "object",
            properties: {
                token: { type: "string" },
                expiresIn: { type: "number" },
            },
        },
    })
    async login(@Body() administratorLoginDTO: any): Promise<any> {
        console.log("Login attempt:", administratorLoginDTO);

        const admin: User = await this.userService.findOneByEmail(
            administratorLoginDTO.email,
        );

        console.log("Found user:", admin);

        if (!admin) {
            throw new Error("Invalid email or password");
        }

        console.log("Comparing passwords:", {
            provided: administratorLoginDTO.password,
            stored: admin.password,
        });

        const passwordMatch = await this.cryptoService.comparePasswords(
            administratorLoginDTO.password,
            admin.password,
        );

        console.log("Password match:", passwordMatch);

        if (!passwordMatch) {
            throw new Error("Invalid email or password");
        }

        const token = this.authMiddleware.signForUser(admin);

        return { token, expiresIn: 3600 };
    }

    @Public()
    @Post("/register")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Register a new user" })
    @ApiBody({ type: UserDTO })
    @ApiResponse({
        status: 201,
        description: "User registered successfully",
        schema: {
            type: "object",
            properties: {
                token: { type: "string" },
                expiresIn: { type: "number" },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: "Bad request - validation failed",
    })
    @ApiResponse({
        status: 409,
        description: "Conflict - email already in use",
    })
    async register(@Body() userDTO: UserDTO): Promise<any> {
        const token = await this.userService.register(userDTO);
        return { token, expiresIn: 3600 };
    }

    @Post("photos/upload")
    @ApiOperation({ summary: "Upload a user photo" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                photo: {
                    type: "string",
                    format: "binary",
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: "Photo uploaded successfully",
        type: UserPhotoDTO,
    })
    @UseInterceptors(FileInterceptor("photo"))
    async uploadPhoto(
        @UploadedFile() file: Express.Multer.File,
        @Req() req: any,
    ): Promise<UserPhotoDTO> {
        return this.userService.uploadPhoto(file, req);
    }

    @Get("photos")
    @ApiOperation({ summary: "Get all photos for current user" })
    @ApiResponse({
        status: 200,
        description: "Returns user photos",
        type: [UserPhotoDTO],
    })
    async getUserPhotos(@Req() req: any): Promise<UserPhotoDTO[]> {
        return this.userService.getUserPhotos(req);
    }

    @Get("photos/user/:userId")
    @ApiOperation({ summary: "Get all photos for a specific user" })
    @ApiResponse({
        status: 200,
        description: "Returns user photos",
        type: [UserPhotoDTO],
    })
    @ApiResponse({
        status: 403,
        description: "Forbidden - Must be friends to view photos",
    })
    async getUserPhotosByUserId(
        @Param("userId") userId: number,
        @Req() req: any,
    ): Promise<UserPhotoDTO[]> {
        // Try to get current user ID if authenticated
        let currentUserId: number | undefined;
        try {
            currentUserId = req.userData?.id;
        } catch {
            currentUserId = undefined;
        }
        return this.userService.getUserPhotosByUserId(userId, currentUserId);
    }

    @Get("photos/:photoId")
    @ApiOperation({ summary: "Get a specific photo by ID" })
    @ApiResponse({
        status: 200,
        description: "Returns photo data",
        content: {
            "image/jpeg": {
                schema: {
                    type: "string",
                    format: "binary",
                },
            },
            "image/png": {
                schema: {
                    type: "string",
                    format: "binary",
                },
            },
        },
    })
    @ApiResponse({
        status: 403,
        description: "Forbidden - Must be friends to view photo",
    })
    @ApiResponse({ status: 404, description: "Photo not found" })
    async getPhoto(
        @Param("photoId") photoId: number,
        @Req() req: any,
        @Res() res: Response,
    ): Promise<void> {
        try {
            const photo = await this.userService.getPhoto(photoId, req);

            // Detect content type based on file extension or data
            let contentType = "image/jpeg"; // default
            if (photo.name) {
                if (photo.name.endsWith(".svg")) {
                    contentType = "image/svg+xml";
                } else if (photo.name.endsWith(".png")) {
                    contentType = "image/png";
                } else if (photo.name.endsWith(".gif")) {
                    contentType = "image/gif";
                } else if (photo.name.endsWith(".webp")) {
                    contentType = "image/webp";
                }
            }

            res.set("Content-Type", contentType);
            res.send(Buffer.from(photo.data));
        } catch (error) {
            // Return default image for missing photos
            const defaultAvatar = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                    <rect fill="#ddd" width="100" height="100"/>
                    <circle cx="50" cy="35" r="15" fill="#999"/>
                    <path d="M25 70 c20-10 30-10 50 0" stroke="#999" stroke-width="10" fill="none"/>
                </svg>`;
            res.set("Content-Type", "image/svg+xml");
            res.send(defaultAvatar);
        }
    }

    @Put("profile")
    @ApiOperation({ summary: "Update user profile" })
    @ApiBody({ type: UserDTO })
    @ApiResponse({
        status: 200,
        description: "Profile updated successfully",
        type: UserDTO,
    })
    async updateProfile(
        @Body() updateData: Partial<UserDTO>,
        @Req() req: any,
    ): Promise<any> {
        const updatedUser = await this.userService.updateProfile(
            updateData,
            req,
        );
        const token = this.authMiddleware.signForUser(updatedUser);
        return {
            token,
            expiresIn: 3600,
            user: this.userService.mapUserToDTO(updatedUser),
        };
    }

    @Get("user-profile")
    @ApiOperation({ summary: "Get current user's profile details" })
    @ApiResponse({
        status: 200,
        description: "User profile retrieved successfully",
        type: UserProfileDTO,
    })
    async getUserProfile(@Req() req: any): Promise<UserProfileDTO> {
        return this.userService.getUserProfile(req);
    }

    @Put("user-profile")
    @ApiOperation({
        summary: "Update user profile details (bio, interests, privacy)",
    })
    @ApiBody({ type: UpdateUserProfileDTO })
    @ApiResponse({
        status: 200,
        description: "User profile updated successfully",
        type: UserProfileDTO,
    })
    async updateUserProfile(
        @Body() updateData: UpdateUserProfileDTO,
        @Req() req: any,
    ): Promise<UserProfileDTO> {
        return this.userService.updateUserProfile(updateData, req);
    }

    @Get("user")
    @ApiOperation({ summary: "Get current user" })
    @ApiResponse({
        status: 200,
        description: "Returns current user",
        type: UserDTO,
    })
    async getUser(@Req() req: any): Promise<UserDTO> {
        return this.userService.getUser(req);
    }

    @Get("user/:userId")
    @ApiOperation({ summary: "Get user by ID and record profile view" })
    @ApiResponse({
        status: 200,
        description:
            "Returns user by ID with profile data and records the profile view",
        schema: {
            type: "object",
            properties: {
                user: { $ref: "#/components/schemas/UserDTO" },
                profile: { $ref: "#/components/schemas/UserProfileDTO" },
            },
        },
    })
    @ApiResponse({ status: 404, description: "User not found" })
    async getUserById(
        @Param("userId") userId: number,
        @Req() req: any,
    ): Promise<{ user: UserDTO; profile: UserProfileDTO | null }> {
        const viewerId = req.userData?.id;

        // Record profile view if viewer is authenticated
        if (viewerId && viewerId !== Number(userId)) {
            // Don't await - record async to not slow down response
            this.profileViewService
                .recordProfileView(Number(userId), viewerId)
                .then(async () => {
                    // Get viewer information for the notification
                    try {
                        const viewer =
                            await this.userService.getUserById(viewerId);
                        // Emit Socket.IO event to notify the profile owner
                        this.chatGateway.server
                            .to(`user:${userId}`)
                            .emit("profile:view", {
                                viewerId: viewerId,
                                viewerName: viewer.fullName,
                                viewerEmail: viewer.email,
                                viewerProfilePictureId: viewer.profilePictureId,
                                viewedAt: new Date().toISOString(),
                                message: `${viewer.fullName} viewed your profile`,
                            });
                    } catch (error) {
                        console.error(
                            "Failed to get viewer info for notification:",
                            error,
                        );
                        // Fallback notification without viewer details
                        this.chatGateway.server
                            .to(`user:${userId}`)
                            .emit("profile:view", {
                                viewerId: viewerId,
                                viewedAt: new Date().toISOString(),
                                message: "Someone viewed your profile",
                            });
                    }
                })
                .catch((err) =>
                    console.error("Failed to record profile view:", err),
                );
        }

        const user = await this.userService.getUserById(userId);
        const profile = await this.userService.getUserProfileByUserId(userId);
        
        return { user, profile };
    }

    @Get("online-users")
    @ApiOperation({ summary: "Get online user IDs" })
    @ApiResponse({
        status: 200,
        description: "Returns array of online user IDs",
    })
    async getOnlineUsers(): Promise<number[]> {
        return this.chatGateway.getOnlineUserIds();
    }

    @Post("profile-picture/upload")
    @ApiOperation({ summary: "Upload and set profile picture" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                photo: {
                    type: "string",
                    format: "binary",
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: "Profile picture uploaded and set successfully",
        type: UserDTO,
    })
    @UseInterceptors(FileInterceptor("photo"))
    async uploadProfilePicture(
        @UploadedFile() file: Express.Multer.File,
        @Req() req: any,
    ): Promise<UserDTO> {
        return this.userService.uploadProfilePicture(file, req);
    }

    @Put("profile-picture/:photoId")
    @ApiOperation({ summary: "Set an existing photo as profile picture" })
    @ApiResponse({
        status: 200,
        description: "Profile picture set successfully",
        type: UserDTO,
    })
    async setProfilePicture(
        @Param("photoId") photoId: number,
        @Req() req: any,
    ): Promise<UserDTO> {
        return this.userService.setProfilePicture(photoId, req);
    }

    @Get("profile-picture")
    @ApiOperation({ summary: "Get current user's profile picture" })
    @ApiResponse({
        status: 200,
        description: "Returns profile picture data",
        content: {
            "image/jpeg": {
                schema: {
                    type: "string",
                    format: "binary",
                },
            },
            "image/png": {
                schema: {
                    type: "string",
                    format: "binary",
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: "Profile picture not found" })
    async getProfilePicture(
        @Req() req: any,
        @Res() res: Response,
    ): Promise<void> {
        const photo = await this.userService.getProfilePicture(req);

        if (!photo) {
            // Return default avatar SVG instead of 404
            const defaultAvatar = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <rect fill="#ddd" width="100" height="100"/>
                <circle cx="50" cy="35" r="15" fill="#999"/>
                <path d="M25 70 c20-10 30-10 50 0" stroke="#999" stroke-width="10" fill="none"/>
            </svg>`;
            res.set("Content-Type", "image/svg+xml");
            res.send(defaultAvatar);
            return;
        }

        res.set("Content-Type", "image/jpeg");
        res.send(Buffer.from(photo.data));
    }

    @Get("profile-picture/user/:userId")
    @ApiOperation({ summary: "Get profile picture for a specific user" })
    @ApiResponse({
        status: 200,
        description: "Returns profile picture data",
        content: {
            "image/jpeg": {
                schema: {
                    type: "string",
                    format: "binary",
                },
            },
            "image/png": {
                schema: {
                    type: "string",
                    format: "binary",
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: "Profile picture not found" })
    async getProfilePictureByUserId(
        @Param("userId") userId: number,
        @Res() res: Response,
    ): Promise<void> {
        const photo = await this.userService.getProfilePictureByUserId(userId);

        if (!photo) {
            // Return default avatar SVG instead of 404
            const defaultAvatar = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <rect fill="#ddd" width="100" height="100"/>
                <circle cx="50" cy="35" r="15" fill="#999"/>
                <path d="M25 70 c20-10 30-10 50 0" stroke="#999" stroke-width="10" fill="none"/>
            </svg>`;
            res.set("Content-Type", "image/svg+xml");
            res.send(defaultAvatar);
            return;
        }

        // Detect content type based on file extension or data
        let contentType = "image/jpeg"; // default
        if (photo.name) {
            if (photo.name.endsWith(".svg")) {
                contentType = "image/svg+xml";
            } else if (photo.name.endsWith(".png")) {
                contentType = "image/png";
            } else if (photo.name.endsWith(".gif")) {
                contentType = "image/gif";
            } else if (photo.name.endsWith(".webp")) {
                contentType = "image/webp";
            }
        }

        res.set("Content-Type", contentType);
        res.send(Buffer.from(photo.data));
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Put("profile-picture/remove")
    @ApiOperation({ summary: "Remove profile picture" })
    @ApiResponse({
        status: 204,
        description: "Profile picture removed successfully",
    })
    async removeProfilePicture(@Req() req: any): Promise<void> {
        await this.userService.removeProfilePicture(req);
    }

    @Post("photos/:photoId/like")
    @ApiOperation({ summary: "Like a photo" })
    @ApiResponse({
        status: 200,
        description: "Photo liked successfully",
        schema: {
            type: "object",
            properties: {
                likesCount: { type: "number" },
                isLiked: { type: "boolean" },
            },
        },
    })
    @ApiResponse({ status: 400, description: "Photo already liked" })
    @ApiResponse({ status: 404, description: "Photo not found" })
    async likePhoto(
        @Param("photoId") photoId: number,
        @Req() req: any,
    ): Promise<{ likesCount: number; isLiked: boolean }> {
        return this.userService.likePhoto(photoId, req);
    }

    @Delete("photos/:photoId/like")
    @ApiOperation({ summary: "Unlike a photo" })
    @ApiResponse({
        status: 200,
        description: "Photo unliked successfully",
        schema: {
            type: "object",
            properties: {
                likesCount: { type: "number" },
                isLiked: { type: "boolean" },
            },
        },
    })
    @ApiResponse({ status: 400, description: "Photo not liked yet" })
    @ApiResponse({ status: 404, description: "Photo not found" })
    async unlikePhoto(
        @Param("photoId") photoId: number,
        @Req() req: any,
    ): Promise<{ likesCount: number; isLiked: boolean }> {
        return this.userService.unlikePhoto(photoId, req);
    }

    @Delete("photos/:photoId")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Delete a photo" })
    @ApiResponse({
        status: 204,
        description: "Photo deleted successfully",
    })
    @ApiResponse({ status: 403, description: "Forbidden - Not your photo" })
    @ApiResponse({ status: 404, description: "Photo not found" })
    async deletePhoto(
        @Param("photoId") photoId: number,
        @Req() req: any,
    ): Promise<void> {
        await this.userService.deletePhoto(photoId, req);
    }

    @Get("profile-views")
    @ApiOperation({ summary: "Get who viewed your profile" })
    @ApiResponse({
        status: 200,
        description: "Returns list of profile views",
        type: [ProfileViewDTO],
    })
    async getProfileViews(
        @Req() req: any,
        @Query("limit") limit?: number,
    ): Promise<ProfileViewDTO[]> {
        const userId = req.userData.id;
        return this.profileViewService.getProfileViews(userId, limit);
    }

    @Get("profile-views/stats")
    @ApiOperation({ summary: "Get profile view statistics" })
    @ApiResponse({
        status: 200,
        description: "Returns profile view statistics",
        schema: {
            type: "object",
            properties: {
                totalViews: { type: "number" },
                uniqueViewers: { type: "number" },
            },
        },
    })
    async getProfileViewStats(@Req() req: any): Promise<{
        totalViews: number;
        uniqueViewers: number;
    }> {
        const userId = req.userData.id;
        const totalViews =
            await this.profileViewService.getProfileViewCount(userId);
        const uniqueViewers =
            await this.profileViewService.getUniqueViewerCount(userId);
        return { totalViews, uniqueViewers };
    }
}
