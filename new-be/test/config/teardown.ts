const teardown = async () => {
    await global.postgres.stop();
};

export default teardown;
