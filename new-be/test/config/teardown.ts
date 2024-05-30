// module.exports = async () => {
//     await globalThis.postgres.stop();
// };
const teardown = async () => {
    await global.postgres.stop();
    // await (await getDatasource()).destroy();
};

export default teardown;
