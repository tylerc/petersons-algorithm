// Shared memory:
let numberOfProcesses = 3; // n
let level: number[] = new Array(numberOfProcesses).fill(-1);
let lastToEnter: number[] = new Array(numberOfProcesses - 1).fill(-1);

function* waitForLock(processId: number): IterableIterator<any> {
    for (let waitingRoom = 0; waitingRoom < numberOfProcesses - 1; waitingRoom++) {
        level[processId] = waitingRoom;
        lastToEnter[waitingRoom] = processId;

        let iAmLastToEnter: boolean;
        let someoneElseIsWaiting: boolean;

        do {
            iAmLastToEnter = lastToEnter[waitingRoom] === processId;
            someoneElseIsWaiting = false;
            for (let k = 0; k < level.length; k++) {
                if (level[k] >= waitingRoom && k !== processId) {
                    someoneElseIsWaiting = true;
                }
            }

            console.log(
                "process #" + processId + ":" +
                " iAmLastToEnter: " + iAmLastToEnter +
                " someoneElseIsWaiting: " + someoneElseIsWaiting +
                " level: " + JSON.stringify(level) +
                " lastToEnter: " + JSON.stringify(lastToEnter)
            );

            if (iAmLastToEnter && someoneElseIsWaiting) {
                yield;
                continue;
            } else {
                break;
            }
        } while (true);
    }
}

async function lockAndExecute(processId: number, func: () => Promise<any>) {
    console.log("process #" + processId + ": Attempting to acquire lock...");
    let waiter = waitForLock(processId);
    while (!waiter.next().done) {
        console.log("process #" + processId + ": Waiting for unlock.");
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log("process #" + processId + ": Lock acquired.");
    console.log("process #" + processId + ": Performing work...");
    await func();
    console.log("process #" + processId + ": Work completed.");
    console.log("process #" + processId + ": Releasing lock...");
    level[processId] = -1;
    console.log("process #" + processId + ": Lock released.");
}

lockAndExecute(2, async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log("process #2: complete!");
});

lockAndExecute(1, async () => {
    console.log("process #1: complete!");
});

lockAndExecute(0, async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log("process #0: complete!");
});

export let makeMeAModule = true;