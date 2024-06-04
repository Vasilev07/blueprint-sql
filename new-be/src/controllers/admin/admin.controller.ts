import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthMiddleware } from "src/middlewares/auth.middleware";
import { AdministratorDTO } from "src/models/administrator-dto";
import { AdministratorLoginDTO } from "src/models/administrator-login-dto";
import { AdministratorService } from "src/services/administrator.service";
import { CryptoService } from "src/services/crypto.service";
import { ApiTags } from "@nestjs/swagger";

@Controller("/auth")
@ApiTags("Admin")
export class AdminController {
    constructor(
        private administratorService: AdministratorService,
        private cryptoService: CryptoService,
        private authMiddleware: AuthMiddleware,
    ) {}

    @Get("/all")
    async getAll(): Promise<AdministratorDTO[]> {
        return await this.administratorService.getAll();
    }

    @Post("/login")
    async login(
        @Body() administratorLoginDTO: AdministratorLoginDTO,
    ): Promise<any> {
        console.log(administratorLoginDTO);
        const admin = await this.administratorService.findOneByEmail(
            administratorLoginDTO.email,
        );
        console.log("admin", admin);

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

        return { token: this.authMiddleware.signForUser(admin) };
    }

    @Post("/register")
    async register(@Body() administratorDTO: AdministratorDTO): Promise<any> {
        try {
            return await this.administratorService.register(administratorDTO);
        } catch (error) {
            console.error("Error registering admin.", error);
        }
    }
}
