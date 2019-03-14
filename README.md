Peterson's Algorithm in Node.js
===============================

What is this?
-------------

Peterson's algorithm allows us to safely lock data in shared memory so only one thread can access it at a time.

This is some simple code that implements [Peterson's Algorithm as described by the Wikipedia
article](https://en.wikipedia.org/wiki/Peterson%27s_algorithm) in Node.js.

Specifically, I've implemented the more generalized algorithm for 2 or more processes.

Why use this?
-------------

If you want to do some thinking about concurrency primitives, and specifically if you want see some example code for
Peterson's algorithm, this is for you.

**Do not use this for production code.**

Why not?:

1. Since Node.js is single-threaded, this code is providing safety amongst conceptual threads-of-execution (e.g.
   closures you've created that are responding to events Node.js is sending you) rather than real threads or processes.
   Given the single-threaded constraint, we could provide similar safety guarantees this in simpler and more efficient
   ways, e.g. by having a simple queue of functions that access the shared state.
2. Processors have instructions for atomic access that you can use to implement alternate algorithms that should be much
   more efficient.
3. While this has been tested and works, concurrency is hard and it's very possible there are bugs I haven't found.
4. Other languages and libraries offer better tested, more performant, and more versatile concurrency primitives.
5. If you can avoid it, just don't share mutable data across threads. Handling that properly is slow and error-prone and
   you're bound to shoot yourself in the foot at least once.

How do I run this?
------------------

### Installing dependencies, compiling TypeScript code

First, you need [Node.js installed](https://nodejs.org). Any recent version should do.

Then, install the npm dependencies (mainly we're just need TypeScript and some type files for TypeScript):

```sh
npm install
```

Then we can compile the TypeScript files:

```sh
./node_modules/.bin/tsc
```

Or if you already have TypeScript installed globally:

```
tsc
```

### Running the Program

There's a standalone version of the algorithm with some hardcoded actions. You can run it with:

```sh
node fixed-data-fixed-thread-count.js
```

There is an equivalent program that uses the the nicer `SharedMemory` API I created:

```sh
node shared-memory-example.js
```

I have also implemented a small test program that has a shared hit counter variable that you can increment by sending it
HTTP requests. You can start the server like so:

```sh
node main.js
```

And then you can send it requests by running:

```sh
node tester.js
```

`tester.js` will send a number of simultaneous requests to the server and log `GOOD` or `BAD` if the hit counter returns
in sequentially increasing order. If things return out of order, or we get the same value back multiple times, that
means our locking mechanism isn't working.

You can also visit http://localhost:3000 in your browser.

What are the files?
-------------------

Main files:

- `shared-memory.ts` - An implementation of the algorithm with a nice API around it so you can make any value safely
  shared access multiple threads of execution. It copies its stored value using JSON.stringify/JSON.parse so that
  mutable versions of the shared data can't escape can wreak havoc. It also supports an arbitrary number of threads
  created at any time that you like. Since we don't have true threads or processes, attempts to gain a lock on the
  stored value are done via ES2017 `async`/`await` with random short delays between locking attempts.
- `shared-memory-example.ts` - Shows a simple usage of the `SharedMemory` API created by the above file.
- `fixed-data-fixed-thread-count.ts` - A simpler version of the algorithm, closer to what Wikipedia describes. It
  requires the number of threads to be specified in advance. It immediately executes some simple tests and so isn't
  suited for re-use anywhere in other code.
- `main.ts` - A server that increments a hit counter using the locking mechanism provided by `shared-memory.ts`. It
  introduces some delays to simulate the server doing actual work so that we can actually perceive whether the locking
  is working correctly.
- `tester.ts` - Sends requests to the server created by `main.ts` and checks whether the responses are what we expect.

Auxillary files:

- `tsconfig.json` - TypeScript configuration.
- `package.json` - NPM packages we use (just TypeScript stuff, no outside libraries)
- `package-lock.json` - Specific versions of packages pulled when `npm install` was used on the above `package.json`
- `.gitignore` - Tell Git we don't want to track `node_modules`, compiled `.js` files, and other things.
- `README.md` - This file.