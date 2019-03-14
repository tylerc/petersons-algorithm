import * as http from "http";

(async () => {
    let requestsWantedTotal = 100;
    let requestsSentTotal = 0;
    let requestsOutstanding = 0;
    let requestsReturned = 0;
    let firstValueReturned = -1;

    while (requestsSentTotal < requestsWantedTotal) {
        await new Promise(resolve => setTimeout(resolve, 250));
        requestsSentTotal++;
        requestsOutstanding++;

        let thisRequestId = requestsSentTotal;

        let req = http.request(
            {
                method: "GET",
                port: 3000,
                host: "127.0.0.1",
                path: "/"
            },
            (res) => {
                let chunks: Buffer[] = [];

                res.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                res.on('end', () => {
                    let buffer = Buffer.concat(chunks);

                    try {
                        let parsed: { hitCount: number } = JSON.parse(buffer.toString());

                        if (
                            typeof parsed !== "object" ||
                            typeof parsed === null ||
                            typeof parsed.hitCount !== "number"
                        ) {
                            throw new Error("Server response had wrong form: " + buffer.toString());
                        }

                        if (firstValueReturned === -1) {
                            firstValueReturned = parsed.hitCount;
                        }

                        requestsOutstanding--;
                        requestsReturned++;
                        console.log(`Request #${requestsReturned} has returned with ${parsed.hitCount}: ${(firstValueReturned + requestsReturned - 1) === parsed.hitCount ? "GOOD" : "BAD"}`);
                        console.log(`${requestsOutstanding} additional requests are still outstanding.`);
                    } catch(e) {
                        console.error("Unable to parse!");
                        throw new Error(e);
                    }
                });

                res.on('error', (e) => {
                    console.error("Error with response:");
                    console.error(e);
                })
            }
        );

        req.on('error', (e) => {
            console.error("Error with request:");
            console.error(e);
        });

        req.end();
    }
})();