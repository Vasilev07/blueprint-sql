import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder } from "@nestjs/swagger";
import { OpenApiNestFactory } from "nest-openapi-tools";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        snapshot: true,
    });

    await OpenApiNestFactory.configure(
        app,
        new DocumentBuilder()
            .setTitle("My API")
            .setDescription("An API to do awesome things")
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
                    "apiPackage=clients,modelPackage=models,withoutPrefixEnums=true,withSeparateModelsAndApi=true",
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
