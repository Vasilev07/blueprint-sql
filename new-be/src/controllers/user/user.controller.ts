import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthMiddleware } from "src/middlewares/auth.middleware";
import { UserService } from "src/services/user.service";
import { CryptoService } from "src/services/crypto.service";
import { ApiTags } from "@nestjs/swagger";
import { User } from "@entities/user.entity";
import { UserDto } from "../../models/user.dto";
import { UserLoginDto } from "../../models/user-login.dto";

@Controller("/auth")
@ApiTags("User")
export class UserController {
    constructor(
        private userService: UserService,
        private cryptoService: CryptoService,
        private authMiddleware: AuthMiddleware,
    ) {}

    @Get("/all")
    async getAll(): Promise<UserDto[]> {
        return await this.userService.getAll();
    }

    @Post("/login")
    async login(@Body() administratorLoginDTO: UserLoginDto): Promise<any> {
        const admin: User = await this.userService.findOneByEmail(
            administratorLoginDTO.email,
        );

        if (!admin) {
            throw new Error("Invalid email or password");
        }

        const passwordMatch = await this.cryptoService.comparePasswords(
            administratorLoginDTO.password,
            admin.password,
        );

        if (!passwordMatch) {
            throw new Error("Invalid email or password");
        }

        const token = this.authMiddleware.signForUser(admin);

        return { token, expiresIn: 3600 };
    }

    @Post("/register")
    async register(@Body() userDTO: UserDto): Promise<any> {
        try {
            return await this.userService.register(userDTO);
        } catch (error) {
            console.error("Error registering admin.", error);
        }
    }
}
