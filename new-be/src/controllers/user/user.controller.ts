import {
    Body,
    Controller,
    Get,
    Post,
    Put,
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

    @Get("photos/:photoId")
    @ApiOperation({ summary: "Get a specific photo by ID" })
    @ApiResponse({ status: 200, description: "Returns photo data" })
    async getPhoto(
        @Param("photoId") photoId: number,
        @Res() res: Response,
    ): Promise<void> {
        const photo = await this.userService.getPhoto(photoId);
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

    @Get("online-users")
    @ApiOperation({ summary: "Get online user IDs" })
    @ApiResponse({
        status: 200,
        description: "Returns array of online user IDs",
    })
    async getOnlineUsers(): Promise<number[]> {
        return this.chatGateway.getOnlineUserIds();
    }
}
