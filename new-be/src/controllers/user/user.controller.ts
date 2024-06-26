import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthMiddleware } from "src/middlewares/auth.middleware";
import { UserDTO } from "src/models/user-d-t-o";
import { AdministratorLoginDTO } from "src/models/administrator-login-dto";
import { UserService } from "src/services/user.service";
import { CryptoService } from "src/services/crypto.service";
import { ApiTags } from "@nestjs/swagger";

@Controller("/auth")
@ApiTags("Admin")
export class UserController {
    constructor(
        private userService: UserService,
        private cryptoService: CryptoService,
        private authMiddleware: AuthMiddleware,
    ) {}

    @Get("/all")
    async getAll(): Promise<UserDTO[]> {
        return await this.userService.getAll();
    }

    @Post("/login")
    async login(
        @Body() administratorLoginDTO: AdministratorLoginDTO,
    ): Promise<any> {
        const admin = await this.userService.findOneByEmail(
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

        console.log("token", token);
        return { token, expiresIn: 3600 };
    }

    @Post("/register")
    async register(@Body() administratorDTO: UserDTO): Promise<any> {
        try {
            return await this.userService.register(administratorDTO);
        } catch (error) {
            console.error("Error registering admin.", error);
        }
    }
}
