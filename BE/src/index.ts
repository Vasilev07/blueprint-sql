import { port } from "./confiigs";
import { startServer } from "./server";

startServer()
    .then((app: any) => {
        const hostname = '0.0.0.0';
        const server = app.listen(port, hostname, () => console.log(`Listening on ${hostname}:${port}`));
        server.keepAliveTimeout = 65000;
        console.log('Server successfully started');
    })
    .catch((error: Error) => {
        console.error('Server failed on startup', error);
    });