import { SharedMemory, randomWait } from "./shared-memory";

let hitCount = new SharedMemory<number>(0);
let t0 = hitCount.threadRegister();
let t1 = hitCount.threadRegister();
let t2 = hitCount.threadRegister();

(async () => {
    await t0.lockAndExecute(async (value, valueSet) => {
        await randomWait();
        console.log("process #0: initial value: " + value);
        valueSet(value + 1);
    });
    t0.releaseProcessId();
    t0 = hitCount.threadRegister();
    t0.lockAndExecute(async (value, valueSet) => {
        await randomWait();
        console.log("process #0 (new): initial value: " + value);
        valueSet(value + 1);
    });
})()

t1.lockAndExecute(async (value, valueSet) => {
    console.log("process #1: initial value: " + value);
    valueSet(value + 1);
});

t2.lockAndExecute(async (value, valueSet) => {
    await randomWait(5000);
    console.log("process #2: initial value: " + value);
    valueSet(value + 1);
});