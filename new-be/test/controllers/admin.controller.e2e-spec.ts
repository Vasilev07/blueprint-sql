import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import { AdministratorService } from "src/services/administrator.service";

describe("AdminController (e2e)", () => {
    let app: INestApplication;
    let administratorService: AdministratorService;
    // let cryptoService: CryptoService;
    // let authMiddleware: AuthMiddleware;
    // let httpServer: any;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        administratorService =
            moduleFixture.get<AdministratorService>(AdministratorService);
        // cryptoService = moduleFixture.get<CryptoService>(CryptoService);
        // authMiddleware = moduleFixture.get<AuthMiddleware>(AuthMiddleware);

        await app.init();
        // httpServer = app.getHttpServer();
    });

    it("/ (GET)", async () => {
        const administratorDTO = {
            email: "gvasilev@hedgeserv.com",
            password: "123456",
            fullName: "Georgi Vasilev",
            confirmPassword: "123456",
        };
        await administratorService.register(administratorDTO);

        const allAdministrators = await administratorService.getAll();

        expect(allAdministrators.length).toBe(1);
        expect(allAdministrators[0].email).toBe(administratorDTO.email);
    });
});
