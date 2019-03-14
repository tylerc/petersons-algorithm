import * as http from "http";
import { SharedMemory, randomWait } from "./shared-memory";

let hitCount = new SharedMemory<number>(0);

const server = http.createServer(async (req, res) => {
    res.on('error', (e) => {
        console.error("Response error:");
        console.error(e);
    });

    let thread = hitCount.threadRegister();

    let valueWritten: number = -1;
    await thread.lockAndExecute(async (value, valueSet) => {
        await randomWait(10, 10);
        valueWritten = value + 1;
        valueSet(valueWritten);
    });
    thread.releaseProcessId();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ hitCount: valueWritten }));
});

server.on("error", (e) => {
    console.error("Server error:");
    console.error(e);
});

const port = parseInt(process.env["PORT"] || "") || 3000;
server.listen(port, "0.0.0.0", () => {
    console.log(`Server running at http://127.0.0.1:${port}`);
});
