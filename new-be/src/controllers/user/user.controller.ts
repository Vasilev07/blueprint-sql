import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthMiddleware } from "src/middlewares/auth.middleware";
import { UserService } from "src/services/user.service";
import { CryptoService } from "src/services/crypto.service";
import { ApiTags } from "@nestjs/swagger";
import { User } from "@entities/user.entity";
import { UserDTO } from "../../models/user.dto";
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
    async getAll(): Promise<UserDTO[]> {
        return await this.userService.getAll();
    }

    @Post("/login")
    async login(@Body() administratorLoginDTO: any): Promise<any> {
        console.log('Login attempt:', administratorLoginDTO);

        const admin: User = await this.userService.findOneByEmail(
            administratorLoginDTO.email,
        );
        
        console.log('Found user:', admin);

        if (!admin) {
            throw new Error("Invalid email or password");
        }

        console.log('Comparing passwords:', {
            provided: administratorLoginDTO.password,
            stored: admin.password
        });
        
        const passwordMatch = await this.cryptoService.comparePasswords(
            administratorLoginDTO.password,
            admin.password,
        );
        
        console.log('Password match:', passwordMatch);

        if (!passwordMatch) {
            throw new Error("Invalid email or password");
        }

        const token = this.authMiddleware.signForUser(admin);

        return { token, expiresIn: 3600 };
    }

    @Post("/register")
    async register(@Body() userDTO: UserDTO): Promise<any> {
        try {
            return await this.userService.register(userDTO);
        } catch (error) {
            console.error("Error registering admin.", error);
        }
    }
}
