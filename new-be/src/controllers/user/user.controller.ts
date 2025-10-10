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
import { Response } from "express";
import { Public } from "../../decorators/public.decorator";

@Controller("/auth")
@ApiTags("User")
export class UserController {
    constructor(
        private userService: UserService,
        private cryptoService: CryptoService,
        private authMiddleware: AuthMiddleware,
        private chatGateway: ChatGateway,
    ) {}

    @Get("/all")
    async getAll(): Promise<UserDTO[]> {
        return await this.userService.getAll();
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
    @ApiResponse({ status: 403, description: "Forbidden - Must be friends to view photos" })
    async getUserPhotosByUserId(
        @Param("userId") userId: number,
        @Req() req: any
    ): Promise<UserPhotoDTO[]> {
        // Try to get current user ID if authenticated
        let currentUserId: number | undefined;
        try {
            currentUserId = req.user?.id;
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
            'image/jpeg': {
                schema: {
                    type: 'string',
                    format: 'binary'
                }
            },
            'image/png': {
                schema: {
                    type: 'string',
                    format: 'binary'
                }
            }
        }
    })
    @ApiResponse({ status: 403, description: "Forbidden - Must be friends to view photo" })
    @ApiResponse({ status: 404, description: "Photo not found" })
    async getPhoto(
        @Param("photoId") photoId: number,
        @Req() req: any,
        @Res() res: Response,
    ): Promise<void> {
        const photo = await this.userService.getPhoto(photoId, req);
        res.set("Content-Type", "image/jpeg");
        res.send(Buffer.from(photo.data));
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
    @ApiOperation({ summary: "Get user by ID" })
    @ApiResponse({
        status: 200,
        description: "Returns user by ID",
        type: UserDTO,
    })
    @ApiResponse({ status: 404, description: "User not found" })
    async getUserById(@Param("userId") userId: number): Promise<UserDTO> {
        return this.userService.getUserById(userId);
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
            res.status(404).send("Profile picture not found");
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
            res.status(404).send("Profile picture not found");
            return;
        }

        res.set("Content-Type", "image/jpeg");
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
}
