    import { NestFactory } from "@nestjs/core";
    import { AppModule } from "./app.module";
    import { DocumentBuilder } from "@nestjs/swagger";
    import { OpenApiNestFactory } from "nest-openapi-tools";
    import { BE_PORT } from "./constants";
    import { IoAdapter } from "@nestjs/platform-socket.io";
    import "reflect-metadata";
    import { ConfigService } from "@nestjs/config";

    async function bootstrap() {
        const app = await NestFactory.create(AppModule, {
            snapshot: true,
        });
        const configService = app.get(ConfigService);
        const apiUrl = configService.get('API_URL') || 'http://localhost:3000';
        console.log(apiUrl, 'apiUrl');
        console.log('NODE_ENV:', process.env.NODE_ENV);

        app.enableCors({
            origin: ["http://localhost:4200", 'https://app.impulseapp.net'],
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            allowedHeaders: ["Content-Type", "Authorization"],
        });

        await OpenApiNestFactory.configure(
            app,
            new DocumentBuilder()
                .setTitle("My API")
                .setDescription("An API to do awesome things")
                .addServer(apiUrl)
                .addBearerAuth(),
            {
                webServerOptions: {
                    enabled: true,
                    path: "api-docs",
                },
                fileGeneratorOptions: {
                    enabled: true,
                    outputFilePath: "./openapi.json", // or ./openapi.json
                },
                clientGeneratorOptions: {
                    enabled: true,
                    type: "typescript-angular",
                    outputFolderPath: "../new-fe/src/typescript-api-client/src",
                    additionalProperties:
                        "withoutPrefixEnums=true,ngVersion=16.2.12,fileNaming=kebab-case",
                    openApiFilePath: "./openapi.json", // or ./openapi.json
                    skipValidation: true, // optional, false by default
                },
            },
            {
                operationIdFactory: (c: string, method: string) => method,
            },
        );

        const server = await app.listen(3000, "0.0.0.0");
        app.useWebSocketAdapter(new IoAdapter(server));

        // Handle shutdown
        process.on("SIGTERM", async () => {
            console.log("Received SIGTERM - shutting down...");
            await app.close();
            process.exit(0);
        });

        process.on("SIGINT", async () => {
            console.log("Received SIGINT - shutting down...");
            await app.close();
            process.exit(0);
        });
    }

    bootstrap();
