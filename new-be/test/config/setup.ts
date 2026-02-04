import {
    PostgreSqlContainer,
    StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";

const init = async () => {
    await Promise.all([initPostgres()]);
};

const initPostgres = async () => {
    console.log("Starting Postgres".repeat(10));

    const postgres: StartedPostgreSqlContainer = await new PostgreSqlContainer()
        .withDatabase("blueprint-sql-test")
        .withUser("root")
        .withPassword("root")
        .start();

    global.postgres = postgres;

    process.env.DB_HOST = postgres.getHost();
    process.env.DB_PORT = postgres.getPort().toString();
    process.env.DB_USERNAME = postgres.getUsername();
    process.env.DB_PASSWORD = postgres.getPassword();
    process.env.DB_DATABASE = postgres.getDatabase();
    process.env.DB_LOGGING_ENABLED = "false";

    console.log("Postgres started");
    console.log("DB_HOST", process.env.DB_HOST);
    console.log("DB_PORT", process.env.DB_PORT);
    console.log("DB_DATABASE", process.env.DB_DATABASE);
};

export default init;
