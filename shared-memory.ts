export function randomWait(base = 50, multiplier = 1000): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * multiplier + base)));
}

function log(message: string) {
    console.log(message);
}

export class SharedMemory<T> {
    numberOfProcesses = 0;
    lastProcessId = -1;
    processIdsAvailable: number[] = [];

    level: number[] = [];
    lastToEnter: number[] = [];
    private value: T;

    constructor(
        value: T
    ) {
        this.value = JSON.parse(JSON.stringify(value));
    }

    threadRegister() {
        let processId: number;
        if (this.processIdsAvailable.length > 0) {
            processId = this.processIdsAvailable.pop() as number;
        } else {
            this.lastProcessId++;
            processId = this.lastProcessId;
            this.numberOfProcesses++;
            this.level.push(-1);
            if (this.lastToEnter.length !== this.level.length - 1) {
                this.lastToEnter.push(-1);
            }
            // Anything already locking or waiting for lock should increase it's level by 1 when we add a new process
            // to ensure that the new process doesn't go thinking it can just take a lock right away:
            this.level.forEach((level, index) => {
                if (level !== -1) {
                    this.level[index] = level + 1;
                }
            });
        }

        let released = false;
        let running = false;

        return {
            lockAndExecute: async (func: (value: T, valueSet: (newValue: T) => any) => Promise<any>) => {
                if (released) {
                    throw new Error("Attempted to use process #" + processId + " after it had been released.");
                }
                running = true;

                log("process #" + processId + ": Attempting to acquire lock...");
                let waiter = this.waitForLock(processId);
                while (!waiter.next().done) {
                    log("process #" + processId + ": Waiting for unlock.");
                    await randomWait(50, 50);
                }
                log("process #" + processId + ": Lock acquired.");
                log("process #" + processId + ": Performing work...");
                let lockValid = true;
                await func(
                    JSON.parse(JSON.stringify(this.value)),
                    (newValue) => {
                        if (!lockValid) {
                            throw new Error("Attempted to call valueSet outside of lock. Do not capture and re-use valueSet!");
                        }

                        this.value = JSON.parse(JSON.stringify(newValue));
                    }
                );
                lockValid = false;
                log("process #" + processId + ": Work completed.");
                log("process #" + processId + ": Releasing lock...");
                this.level[processId] = -1;
                log("process #" + processId + ": Lock released.");

                running = false;
            },
            releaseProcessId: () => {
                if (running) {
                    throw new Error("Attempted to release process #" + processId + " while it was running.");
                }

                this.processIdsAvailable.push(processId);
                released = true;
                log("process #" + processId + " has been released.");
            }
        };
    }

    *waitForLock(processId: number): IterableIterator<any> {
        for (let waitingRoom = 0; waitingRoom < this.numberOfProcesses - 1; waitingRoom++) {
            this.level[processId] = waitingRoom;
            this.lastToEnter[waitingRoom] = processId;

            let iAmLastToEnter: boolean;
            let someoneElseIsWaiting: boolean;

            do {
                iAmLastToEnter = this.lastToEnter[waitingRoom] === processId;
                someoneElseIsWaiting = false;
                for (let k = 0; k < this.level.length; k++) {
                    if (this.level[k] >= waitingRoom && k !== processId) {
                        someoneElseIsWaiting = true;
                    }
                }

                // log(
                //     "process #" + processId + ":" +
                //     " iAmLastToEnter: " + iAmLastToEnter +
                //     " someoneElseIsWaiting: " + someoneElseIsWaiting +
                //     " level: " + JSON.stringify(this.level) +
                //     " lastToEnter: " + JSON.stringify(this.lastToEnter)
                // );

                if (iAmLastToEnter && someoneElseIsWaiting) {
                    yield;
                    continue;
                } else {
                    yield;
                    break;
                }
            } while (true);
        }

        // Ensure a sufficiently high initial level (mostly for the case of the very first process):
        this.level[processId] = this.numberOfProcesses - 1;
    }
}