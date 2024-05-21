import { ConfigService } from "@nestjs/config";
import { createDatabase, dropDatabase } from "typeorm-extension";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { getConfig } from "../src/config/db.config";

export class TestDBInitiator {
    private readonly initialDatabase: string;
    private readonly testDatabase = "blueprint-sql-test";
    readonly dbOptions: PostgresConnectionOptions;
    readonly configService: ConfigService;

    constructor() {
        this.configService = new ConfigService();
        const config = getConfig(this.configService);
        console.log("config", config);
        // TODO FIX THIS -> might be different from test db name
        this.initialDatabase = config.database.toString();
        this.dbOptions = {
            ...config,
            database: this.testDatabase,
        } as PostgresConnectionOptions;
    }

    async createDatabase() {
        await this.dropDatabase();
        console.log(`Creating test database '${this.dbOptions.database}'`);
        const db = await createDatabase({
            options: this.dbOptions,
            initialDatabase: "blueprint-sql",
            ifNotExist: true,
        });
        console.log("db", db);

        // TODO Implement this function for running migrations
        // const dataSource = await createTestDataSource(this.dbOptions);
        // console.log("Running migrations");
        // dataSource.runMigrations({ transaction: "all" });
        // await dataSource.destroy();

        console.log("✓ Done. Test database is ready to accept connections ✓\n");
    }

    async dropDatabase(dropAll = false) {
        dropAll;
        console.log(`Dropping test database '${this.testDatabase}'`);
        // if (dropAll) {
        //     const ds = await createTestDataSource({
        //         ...this.dbOptions,
        //         database: this.initialDatabase,
        //     });
        //     await ds.query(
        //         `SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${this.testDatabase}';`,
        //     );
        // }

        await dropDatabase({
            options: this.dbOptions,
            initialDatabase: "blueprint-sql",
            ifExist: true,
        });

        console.log("✓ Done. Test database is dropped ✓\n");
    }
}
