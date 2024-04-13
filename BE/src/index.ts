import { AppModule } from "./app.module";
import { startServer } from "./server";
import { NestFactory } from '@nestjs/core';

startServer()
    .then(async () => {
        const app = await NestFactory.create(AppModule);
        const hostname = '0.0.0.0';
        await app.listen(hostname);
        console.log('Server successfully started');
    })
    .catch((error: Error) => {
        console.error('Server failed on startup', error);
    });
