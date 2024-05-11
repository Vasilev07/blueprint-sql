import { ConfigService } from "@nestjs/config";
import { createTestDataSource, getConfig } from "../src/config/db.config";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { createDatabase, dropDatabase } from "typeorm-extension";

export class TestDBInitiator {
    private readonly initialDatabase: string;
    private readonly testDatabase = "blueprint-sql-test";
    readonly dbOptions: PostgresConnectionOptions;
    readonly configService: ConfigService;

    constructor() {
        this.configService = new ConfigService();
        const config = getConfig(this.configService);
        console.log("config", config);

        this.initialDatabase = config.database;
        this.dbOptions = {
            ...config,
            database: this.testDatabase,
        };
    }

    async createDatabase() {
        await this.dropDatabase();
        console.log(`Creating test database '${this.dbOptions.database}'`);
        await createDatabase({
            options: this.dbOptions,
            initialDatabase: this.initialDatabase,
            ifNotExist: false,
        });

        // TODO Implement this function for running migrations
        // const dataSource = await createTestDataSource(this.dbOptions);
        // console.log("Running migrations");
        // dataSource.runMigrations({ transaction: "all" });
        // await dataSource.destroy();

        console.log("✓ Done. Test database is ready to accept connections ✓\n");
    }

    async dropDatabase(dropAll = false) {
        console.log(`Dropping test database '${this.testDatabase}'`);
        if (dropAll) {
            const ds = await createTestDataSource({
                ...this.dbOptions,
                database: this.initialDatabase,
            });
            await ds.query(
                `SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${this.testDatabase}';`,
            );
        }

        await dropDatabase({
            options: this.dbOptions,
            initialDatabase: this.initialDatabase,
        });

        console.log("✓ Done. Test database is dropped ✓\n");
    }
}
