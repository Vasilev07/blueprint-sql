import * as dotenv from "dotenv";
import { TestDBInitiator } from "../config.e2e";

dotenv.config();

module.exports = async () => {
    console.log("\n\nSetup test environment");
    const initiator = new TestDBInitiator();

    globalThis.databaseConfig = initiator;
    await initiator.createDatabase();
};
