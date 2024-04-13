import { Controller, Get } from "@nestjs/common";

@Controller("/auth")
export class AdminController {
    @Get("/all")
    async getAll(): Promise<any> {
        return "0;0";
    }
}
