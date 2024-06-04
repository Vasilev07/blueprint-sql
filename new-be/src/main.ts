import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder } from "@nestjs/swagger";
import { OpenApiNestFactory } from "nest-openapi-tools";
import { BE_PORT } from "./constants";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        snapshot: true,
    });

    app.enableCors({ origin: "http://localhost:4200" });

    await OpenApiNestFactory.configure(
        app,
        new DocumentBuilder()
            .setTitle("My API")
            .setDescription("An API to do awesome things")
            .addServer(`http://localhost:${BE_PORT}`)
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
                outputFolderPath: "../ngx-admin/src/typescript-api-client/src",
                additionalProperties:
                    "apiPackage=clients,modelPackage=models,withoutPrefixEnums=true,withSeparateModelsAndApi=true,ngVersion=16.2.12",
                openApiFilePath: "./openapi.json", // or ./openapi.json
                skipValidation: true, // optional, false by default
            },
        },
        {
            operationIdFactory: (c: string, method: string) => method,
        },
    );
    await app.listen(3000);
}

bootstrap();
