import { Body, Controller, Get, Post } from "@nestjs/common";
import { AdministratorDTO } from "src/models/administrator-dto";
import { AdministratorService } from "src/services/administrator.service";

@Controller("/auth")
export class AdminController {
    constructor(private administratorService: AdministratorService) {}

    @Get("/all")
    async getAll(): Promise<any> {
        return "0;0";
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
