import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: "postgres",
            host: "0.0.0.0",
            port: 5432,
            username: "postgres",
            password: "postgres",
            database: "bookstore",
            synchronize: true,
            logging: false,
            entities: [__dirname + './entity/**/*.entity{.ts,.js}'],
            migrations: [],
            subscribers: [],
        })
    ]
})
export class AppModule {}
