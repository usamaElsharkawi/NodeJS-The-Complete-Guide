# Section 3: Understanding the Basics

> TypeScript (native `.ts`) running on Node.js v24+.
> Toolchain: `node app.ts` (type-stripping) + `tsc --noEmit` (type-checking)

## 🔧 Project Setup (run once)

```bash
# 1) scaffold (skip if present)
npm init -y
npm install -D typescript @types/node

# 2) use the provided tsconfig.json below (Node-native strict)

# 3) every lecture:  (a) type-check, then (b) run natively
npm run lint      # tsc --noEmit  (strict: erasableSyntaxOnly, verbatimModuleSyntax)
npm start         # node app.ts   (or: node --watch app.ts for auto-restart)
```

### tsconfig.json (native TypeScript strict, no emit)

```jsonc
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2023"],
    "noEmit": true, // tsc = type-check only; Node strips types at runtime
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "erasableSyntaxOnly": true,   // 🔑 native-TS guard (blocks enums/const-enum/param props)
    "verbatimModuleSyntax": true, // 🔑 forces explicit `import type`
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"]
  },
  "include": ["*.ts"],
  "exclude": ["node_modules"]
}
```

### package.json (scripts)

```json
{
  "name": "nodejs-complete-guide-section3",
  "type": "module",
  "scripts": {
    "start": "node app.ts",
    "dev": "node --watch app.ts",
    "lint": "tsc --noEmit"
  }
}
```

---

# Lecture 25: How The Web Works

## What I learned
- **Web exchange = client makes a request, server sends back a response.** The unit of work is a single request/response pair.
- **Protocol = HTTP** (and **HTTPS = HTTP over TLS**). These define *how* that text message is formatted and transmitted over the network.
- **HTTP = HyperText Transfer Protocol.** "HyperText" = text with links (hypertext) — historically HTML pages referencing each other. Today it transfers *any* hypertext (JSON, images, etc.), but the name is historical.
- **HTTP vs HTTPS — essentials:** HTTPS wraps HTTP inside TLS (so everything is encrypted), runs on port 443 instead of 80, requires a TLS certificate, and is mandatory for anything real (browsers require it). Plain HTTP is unencrypted and exposes everything. To our TS code, both look identical — TLS is handled below us.
- **Request components:** METHOD (GET/POST/etc.) + URL + path + query string + headers (e.g. `Host`, `Accept`).
- **Response components:** status-code + status-text + headers (e.g. `Content-Type`) + body (the actual data).
- **The `Host` header is mandatory** — it tells a (often shared) server *which site* the client wants.

## TypeScript mapping
- Node's `'node:http'` built-in module already ships types. The Web's "request/response" maps directly onto Node's types:
  - **request** -> `http.IncomingMessage`
  - **response** -> `http.ServerResponse`
  - headers -> `req.headers` (typed record), query/path -> `new URL(req.url ?? '', base)`
- So "HTTP/HTTPS on the transport level" = **irrelevant to our TypeScript code's types** — plain HTTP and HTTPS deliver the same `IncomingMessage`/`ServerResponse` objects. TLS happens below us (Node's `https` module, or a reverse proxy like nginx).
- `node app.ts` runs our TypeScript **natively** via Node's built-in type-stripping on Node 24 (`import { createServer } from 'node:http'` works directly). `tsc --noEmit` (with `erasableSyntaxOnly: true`) still type-checks + enforces native-TS compatibility before we run.

## Notes & gotchas (our toolchain)
- `node app.ts` => runs TypeScript **natively on Node 24** (no compile step — Node strips types itself).
- `tsc --noEmit` => still required separately — **Node strips types but does NOT type-check**.
- `module: "NodeNext"` + `"type": "module"` => **ESM is required** (use `import`, never `require`).
- **No `tsconfig.json` is read by Node** for execution — it only guides `tsc`/the editor.
- **Constraints for our native-TS approach:**
  - `.ts` file extensions are **required** in imports (`import {x} from './y.ts'`).
  - `enum`, `const enum`, **parameter properties**, and `import()` aliases need a transpiler — avoided via `erasableSyntaxOnly: true`.
- **Biome / Prettier / ESLint / dotenv deferred** — not in scope for now.

---

# Lecture 26: Understanding the request listener (createServer)

## What I learned
- The **first argument** to `http.createServer(...)` is the `requestListener` function — Node
  calls it **once per incoming HTTP request** (it is the `'request'` event handler).
- `req` is the incoming request (`http.IncomingMessage`); `res` is the outgoing response
  (`http.ServerResponse`) you write to.
- The server only starts accepting traffic after `server.listen(...)` — before that it is
  just a `Server` object (an `EventEmitter` subclass) that exists in memory.

## TypeScript mapping
- `import http from "node:http"` (ESM default import). `@types/node` ships the types, so:
  - `req` is typed as `IncomingMessage` (a readable stream).
  - `res` is typed as `ServerResponse` (a writable stream).
- Every request handler **must end the response** — either `res.end()` or `res.writeHead(...)` + `res.end(...)`. Otherwise the client **hangs until socket timeout** (the underlying writable stream is never closed).
- `server` is `http.Server` (extends `EventEmitter`), so you can also attach events:
  `server.on('listening', ...)`, `server.on('error', ...)`.

## Notes & gotchas
- `res.end()` returns void — always call it as the last statement in the handler body, or
  the request never completes (silent hang). `console.log(req)` alone does not send a response
  back to the client.
- If you destructure `server.address()` (for logging), TS narrows it as `AddressInfo | string | null`,
  so null-check + `typeof === 'object'` guards are needed — TS saves you from JS footguns here.

## Notes & gotchas (listen method)
- `server.listen()` is intentionally **non-blocking** and **async** — it starts binding to the OS
  port/socket and returns immediately (the `Server` object); you must NOT chain logic right after it.
- Use the **callback** (or `'listening'` event) to know the server is truly accepting connections:
  `server.listen(PORT, () => { ... })`.
- The most common early failure is `EADDRINUSE` (port in use). Always wire up an `'error'` handler
  to catch it and retry another port — otherwise Node throws, exits the process, and the loop dies.
- `server.listen(0)` → OS picks a free ephemeral port (great for dynamic assignment / tests).
- For production: bind to a specific interface (`server.listen(PORT, HOST)`) rather than relying
  on `0.0.0.0` defaults; and prefer a reverse proxy (nginx) in front.
- TS signature: `listen(port: number, hostname: string, backlog: number, listeningListener?: () => void): this`.
  The `.address()` return is typed as `AddressInfo | string | null` — hence the `typeof === 'object'`
  narrowing before reading `.port`/`.address`.

---

# Lecture 27: The Node Lifecycle & Event Loop

## What I learned

### Event-driven architecture
- The request listener passed to `http.createServer(fn)` is **not called by us** — Node calls it
  automatically **whenever a request reaches our server**. This is the defining trait of
  **event-driven architecture**: instead of writing a `while` loop that polls "any new request?",
  we *register a callback* and Node *invokes* it when the event occurs. Control is **inverted** —
  you hand Node a function value; Node decides when to run it.
- The request listener is literally a **`'request'` event handler**. Under the hood:
  `http.createServer(fn)` ≡ `new Server().on('request', fn)`.
- `http.Server` **extends `EventEmitter`** — and `EventEmitter` is the bedrock of Node's
  event-driven model. Anything that can emit events (servers, streams, the process itself)
  inherits from it. Even `process.on('SIGINT', ...)` is another event-driven handler: the whole
  runtime is event emitters all the way down.

### The Node.js lifecycle (process level)
- A Node process has a clear top-to-bottom lifecycle:
  1. V8 engine + Node runtime initialize.
  2. **Your code runs TOP-TO-BOTTOM, synchronously** (define listener, call `server.listen(3000)`).
  3. Synchronous code finishes.
  4. The **event loop keeps the process ALIVE** while events are pending.
  5. The event loop empties → the process **EXITS**.
- Node does **not** sit in a `while(true)` loop in your code. After synchronous code finishes, the
  *only* reason the process stays alive is the event loop detecting **pending events** (an open
  server, a timer, an open file handle). When nothing is pending, Node exits cleanly.
- That is exactly why `server.listen(3000)` keeps the app running: it registers a pending event
  source (the listening socket), so the loop waits instead of exiting.

### The event loop (what keeps it alive)
- The event loop is a set of **phases**, each a FIFO queue of callbacks, cycled repeatedly:
  - **Timers**: `setTimeout` / `setInterval` callbacks whose time has elapsed.
  - **Pending callbacks**: deferred I/O callbacks (rare, system-level).
  - **Poll**: retrieves new I/O events, executes their callbacks, and waits for more.
  - **Check**: `setImmediate` callbacks run here.
  - **Close**: `'close'` event handlers (e.g. `server.close()` finishing).
- Your **request listener fires inside the Poll phase** — where new connection/request events are
  dispatched to your `requestListener`.

### What is a "process"?
- A **process** is a running instance of your program — an OS object with its own memory space, its
  own JS heap, its own call stack, and its own event loop. Running `node app.ts` makes the OS create
  a new process (with a PID) in which V8 runs your code and spins up the event loop.
- Distinct from a **thread** (the event loop runs on one main thread inside that process) and from
  the **OS** (which schedules the process and manages the network socket).

### What is a "pending event"?
- A **pending event** = an event that has been *registered* but hasn't *fired yet*, so the loop must
  keep waiting for it. These keep the process alive:
  - Listening socket (`server.listen(3000)`) → fires `'request'` when a request arrives.
  - Timer (`setTimeout(fn, 1000)`) → fires when 1000ms elapse.
  - Open file/socket handle (`fs.readFile`, open connection) → fires when I/O completes.
  - `setInterval(fn, 500)` → stays pending forever (fires every 500ms).
- Node's rule: **if there are zero pending events/handles, the event loop has nothing to wait for →
  the process exits.** That's why `server.close()` lets the process exit once it's the last handle.

### Does callback code execute synchronously?
- **Yes — each individual callback runs synchronously, start to finish, on the single main thread.**
  The *scheduling* is async (the callback is deferred to a later loop iteration), but the
  *execution* of the callback body is synchronous and blocking for that moment.
- Example: `server.listen(3000, () => console.log("A"))` then `console.log("B")` prints `B` first
  (synchronous, immediate) then `A` (callback, later on the loop) — because `listen()` registers the
  callback and returns instantly.
- **Critical rule:** because only one callback runs at a time on the main thread, **if a callback does
  something slow synchronously, it blocks the entire event loop** — no other request can be handled
  until it finishes (e.g. a `while` busy-wait blocks every other request).

### OS world: is the process multi-threaded?
- **Yes — a Node.js process has multiple OS threads**, but your *JavaScript* runs on only **one** of
  them (the main thread / event loop thread). The other threads are hidden infrastructure. So "Node is
  single-threaded" really means: **your JS is single-threaded** (one call stack, one event loop); the
  *process* is multi-threaded.
- Threads inside a Node process:
  - **Main thread** — runs the event loop and *all* your JavaScript, one callback at a time.
  - **libuv thread pool** — default **4** worker threads (tunable via `UV_THREADPOOL_SIZE`), used for
    operations that can't be done truly asynchronously by the OS.
  - **V8 internal threads** — GC, JIT compiler, etc. (never touched directly).
- Which operations use the thread pool:
  - **Network I/O** (HTTP, DB over TCP) → OS kernel (epoll/kqueue/IOCP), **not** the pool — no block.
  - **File I/O** (`fs.readFile`) → libuv thread pool — offloaded, no block.
  - **DNS** (`dns.lookup`) → libuv thread pool — offloaded, no block.
  - **CPU-heavy crypto / zlib** → libuv thread pool — offloaded, no block.
  - **Your JS** (`while` loop, `JSON.parse`, `crypto` sync hashing) → **main thread — blocks everything**.
- When you call `fs.readFile(path, cb)`: Node hands the read to a thread-pool worker; the main thread
  is free (loop keeps serving); when done, Node queues the callback; on a future loop iteration the
  `cb` runs **on the main thread** (synchronously, like every callback).
- Incoming **network** requests are handled by the OS kernel and dispatched to your **main-thread**
  listener — only *file/DNS/crypto* work spills onto the thread pool. So the threads do **not** serve
  incoming requests directly.
- The real bottleneck: because JS is single-threaded, **CPU-bound work in a callback kills
  throughput**. The modern fix is **`worker_threads`** (separate API, not libuv's pool) for heavy
  computation on its own thread. (Advanced, later topic.)

## TypeScript mapping
- Node's types carry the event-driven surface for free — you don't add types yourself:
  - The request listener is `(req: IncomingMessage, res: ServerResponse) => void`.
  - `http.Server extends EventEmitter` → `server.on("request" | "listening" | "error" | "close", listener)`;
    event args are typed per event (`err: NodeJS.ErrnoException` for `'error'`).
  - `process` is typed `NodeJS.Process`; `process.on("SIGINT", ...)` is another typed event handler.
- Timers: `setTimeout(fn, ms)` returns `NodeJS.Timeout` (clear with `clearTimeout(t)`).
- The lifecycle/event-loop is runtime behavior, so TS mostly types the *surfaces* you touch
  (process, server events, listener args, timer handles). The architecture is identical to JS; the
  upgrade is the safety/typing.
- File I/O callback pattern is **error-first**: `(err: NodeJS.ErrnoException | null, data: string) => ...`.
  In modern TS you'd more likely use the **Promise** versions (`fs.promises.readFile` / `await`) which
  wrap the same offloading with `async`/`await` — same threading model underneath.
- Typed lifecycle sketch:
  ```ts
  import http, { IncomingMessage, ServerResponse } from "node:http";
  import process from "node:process";

  const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
    res.end("hello");
  });

  server.listen(3000, () => {
    console.log("listening — event loop now keeping process alive");
  });

  process.on("SIGINT", () => {
    server.close(() => process.exit(0)); // graceful shutdown
  });
  ```
- Non-blocking read vs blocking read (feel the difference):
  ```ts
  import fs from "node:fs";

  // ✅ offloaded to libuv thread pool; callback runs on main thread later
  fs.readFile("data.txt", "utf8", (err: NodeJS.ErrnoException | null, data: string) => {
    if (err) { console.error(err); return; }
  });

  // ❌ readFileSync blocks the main thread → entire event loop freezes
  // const data = fs.readFileSync("data.txt", "utf8");
  ```

## Notes & gotchas
- The request listener is an event handler, not a function you call — control is inverted.
- After your synchronous code finishes, the process lives **only** as long as pending events exist.
- The request listener runs in the **Poll phase** of the event loop.
- **Each callback runs synchronously on the main thread**; only scheduling is async. Long synchronous
  work inside a callback blocks the whole loop.
- Node is **single-threaded for your JS**, but the *process* is multi-threaded (main thread + libuv
  pool + V8 threads).
- Incoming network requests are handled by the OS kernel and dispatched to your main-thread listener;
  only file/DNS/crypto work uses the libuv thread pool.
- CPU-bound JS blocks everything → use `worker_threads` for heavy computation (advanced topic).
- Tune the libuv pool via `UV_THREADPOOL_SIZE` env var if file/DNS work saturates the default 4.
- `process.pid` / `process.uptime()` let you inspect the OS process from TS.
- `server.close(cb)` removes the listening handle; once it's the last pending handle, the process exits.

---

# Lecture 28: Controlling the Node.js Process

## What I learned
- The simplest way to quit a running Node server is **`CTRL+C`** in the terminal where you started it
  (where you ran `node app.ts`). That is the user-facing tip; the deeper idea is **OS signals control
  the process lifecycle**.
- `CTRL+C` does **not** kill the window — it sends the **`SIGINT`** signal (SIGnal INTerrupt) to the
  **foreground process group** in that terminal. The Node process receives it and, by default,
  **terminates immediately**. This ties back to Lecture 27: the process was alive because of pending
  events (the listening socket); `SIGINT` stops it regardless.

### The signal family
- `SIGINT` — sent by `CTRL+C` in the terminal. Default: terminate.
- `SIGTERM` — sent by `kill <pid>` (the conventional *graceful* stop). Default: terminate.
- `SIGHUP` — sent when the terminal/session is closed. Default: terminate.
- `SIGKILL` — sent by `kill -9 <pid>`. **Forced** — cannot be caught or ignored.
- `SIGUSR1` — sent by `kill -USR1 <pid>`. Starts the debugger.
- `SIGKILL` and `SIGSTOP` are the only signals a process **cannot intercept** — important when a
  server is truly hung and won't respond to anything else.

### Handling signals (graceful shutdown)
- You can **intercept** `SIGINT`/`SIGTERM` to shut down gracefully: stop accepting new requests,
  finish in-flight ones, then exit. This is the real-world reason Lecture 28 exists.
- `server.close(cb)` stops accepting *new* connections but lets *existing* requests finish — that is
  "graceful" vs the hard cut of default `SIGINT`.
- A safety net (e.g. `setTimeout(...).unref()`) force-exits if in-flight connections hang too long.

### process.exit() and exit codes
- `process.exit(0)` → success (clean). Any non-zero code (e.g. `1`) → error. Exit codes are read by
  tooling/orchestrators (Docker, systemd, CI).
- You rarely call `process.exit()` directly — normally the event loop draining (no pending events)
  exits with `0` on its own. Calling it **mid-code** skips pending callbacks and can truncate
  logs/responses.
- `process.on("exit", (code) => {...})` runs **synchronously** on exit — no async I/O can complete
  here (callbacks like `fs.writeFile` won't fire). Use only for last-moment sync cleanup.
- `process.on("beforeExit", ...)` fires when the loop is about to drain **but before** exit — async is
  allowed here (you can even add new work to keep the process alive).

### Crash vs clean exit (error signals)
- By default an **uncaught exception** crashes the process (exit code 1). In production you often add
  handlers to log + shut down cleanly instead of dying silently:
  - `process.on("uncaughtException", (err: Error) => {...; process.exit(1);})`
  - `process.on("unhandledRejection", (reason: unknown) => {...; process.exit(1);})`

## TypeScript mapping
- `import process from "node:process"` → typed as `NodeJS.Process`.
- Signal handlers: `process.on("SIGINT", () => void)` — the signal name is a string-literal union
  `NodeJS.Signals`, so TS validates the signal name.
- Exit: `process.exit(code: number)`. Exit-code parameter in handlers: `process.on("exit", (code: number) => void)`.
- Inspect the OS process: `process.pid`, `process.uptime()`.
- The architecture is identical to JS; TS adds safety by typing the process surface and signal names.

### Typed graceful-shutdown sketch
```ts
import http, { IncomingMessage, ServerResponse } from "node:http";

const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  res.end("hello");
});

server.listen(3000, () => console.log("listening on 3000"));

function shutdown(signal: string): void {
  console.log(`\nReceived ${signal} — shutting down gracefully...`);
  server.close(() => {
    console.log("All connections closed. Exiting.");
    process.exit(0);
  });
  // safety net: force-exit if connections hang too long
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
```

## Notes & gotchas
- `CTRL+C` = `SIGINT` to the foreground process group → default immediate termination.
- `SIGKILL` (`kill -9`) cannot be caught — last resort for a hung process.
- Catch `SIGINT`/`SIGTERM` to implement **graceful shutdown** with `server.close(cb)`.
- `server.close()` stops *new* connections but lets *existing* ones finish.
- Avoid calling `process.exit()` mid-code — it skips pending callbacks and can truncate output.
- `process.on("exit", ...)` is **sync-only**; use `beforeExit` for async cleanup.
- Non-zero exit codes communicate failure to Docker/systemd/CI.
- `uncaughtException` / `unhandledRejection` handlers prevent silent crashes in production.

---

# Concept: The Port ↔ Process Relationship

> Supplementary note (pre-Lecture 29) clarifying how an OS port relates to a Node process.

## What I learned
- A **port** is a 16-bit number (0–65535) naming a specific **endpoint inside a host** (an IP
  address). The OS identifies a connection by a 4-tuple:
  `(source IP, source port, destination IP, destination port)`.
- When a request hits the machine, the OS reads **(destination IP, destination port)** and asks
  *"which process is listening on this?"*, then delivers the packet to **that process**. So the port
  is the **address the OS uses to route incoming traffic to the right process**.
- A **listening process** calls `bind()` + `listen()` (Node wraps this as `server.listen(3000)`),
  telling the OS *"I own port 3000 on this IP."* The OS records the mapping **`(IP, port) → process`**
  in its socket table; every packet to that port goes to that one process.

### Key rules
- **One listener per (IP, port, protocol) at a time.** Two processes can't both `listen()` on
  `3000/TCP` — the second gets **`EADDRINUSE`**. This is the direct, enforceable link between "port"
  and "process."
- **One process can listen on many ports.** A single Node process can `server.listen(3000)` *and*
  `server.listen(8080)` — multiple servers, multiple sockets, same process.
- **Ports are per-protocol.** TCP port 3000 and UDP port 3000 are independent socket tables.
- **Port 0 = let the OS pick.** `server.listen(0)` → OS chooses a free **ephemeral** port; the process
  still owns whatever was assigned.
- **Privileged ports (1–1023)** typically need root/admin (e.g. 80, 443) — why we use 3000/8080 in dev.
- **Outgoing connections also get a port.** When *your* process makes a request, the OS assigns a random
  **source** port from the ephemeral range (49152–65535) — so the process is a *listener* on one port
  and a *client* on another simultaneously.

### Why EADDRINUSE proves the link
- A second `server.listen(3000)` in the same (or another) process emits `'error'` → `EADDRINUSE`,
  because port 3000 is already bound to a listening socket owned by a process — there can be only one owner.

## TypeScript mapping
- `server.listen(port: number, cb?)` — the `port` is the OS-level binding; TS types it as `number`.
- `EADDRINUSE` surfaces as `err.code === "EADDRINUSE"` where `err: NodeJS.ErrnoException`.
- `server.address()` returns `AddressInfo | string | null` → `AddressInfo.port` is the *actual* bound
  port (essential after `listen(0)`).
- Multiple servers in one process:
  ```ts
  const s1 = http.createServer((_q, r) => r.end("one")).listen(3000);
  const s2 = http.createServer((_q, r) => r.end("two")).listen(8080);
  // one process, two ports, two sockets
  ```

## Notes & gotchas
- **Process ↔ port is 1-to-many ownership:** a process may own many ports; a port (per IP+protocol) is
  owned by exactly one process. The OS is the bookkeeper; `server.listen(port)` claims the entry.
- `EADDRINUSE` = the port is already owned by a listening socket — change port or free the old process.
- `listen(0)` → OS-assigned ephemeral port; always read `server.address()` to learn which one.
- Privileged ports (<1024) usually require elevated permissions.

---

# Lecture 29: Understanding Requests

## What I learned
- Lecture 29 digs into the **`req` object** — the first argument the request listener receives on
  every request. Formally it is an `http.IncomingMessage`. The single most important idea: **it is a
  Readable stream** — some data is available as properties immediately (connection metadata), but the
  **body is streamed** and must be read with event listeners. There is **no `req.body` built in**
  (a common JS misconception).
- `IncomingMessage` **extends `stream.Readable`**. So metadata properties are ready the moment the
  request arrives, while the body arrives asynchronously via `'data'`/`'end'` events.

### The most important properties
- `req.url` — the **path + query** requested (e.g. `/users?page=2`). Does **not** include
  protocol/host (those live in headers).
- `req.method` — the HTTP verb (`GET`, `POST`, `PUT`, `DELETE`…). Conceptually defaults to `GET`.
- `req.headers` — key/value object of request headers (`Host`, `Accept`, `Content-Type`, `User-Agent`…).
- `req.httpVersion` — e.g. `"1.1"` — the HTTP protocol version.
- `req.socket` — the underlying TCP socket; exposes `remoteAddress` / `remotePort` (who connected).
- `req.rawHeaders` — flat `[key, val, key, val, …]` array (preserves duplicates/order vs `headers`).
- `req.complete` — `true` once the full request (incl. body) has been received.

### Reading the body (the stream part)
- There is **no `req.body`**. The body comes in as chunks you collect:
  ```ts
  import http, { IncomingMessage, ServerResponse } from "node:http";

  const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => { chunks.push(chunk); });
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString();
      console.log(req.method, req.url, body);
      res.end("received");
    });
    req.on("error", (err: Error) => {
      res.statusCode = 400;
      res.end("bad request");
    });
  });
  server.listen(3000);
  ```
- `req.on("data", ...)` fires **zero or more times** with `Buffer` chunks.
- `req.on("end", ...)` fires once the body is fully received — **act on the body here**.
- `GET` requests usually have no body, so `end` fires with no `data` chunks.
- `req.setEncoding("utf8")` switches chunks to `string` instead of `Buffer`.

### Extracting path + query safely (ties to Lecture 25)
- `req.url` is only the path+query string. Use the Web `URL` API to get structured parts:
  ```ts
  const url = new URL(req.url ?? "", "http://localhost");
  const pathname = url.pathname;              // "/users"
  const page = url.searchParams.get("page");  // "2" | null
  ```

## TypeScript mapping
- `req` is typed `IncomingMessage` (a `stream.Readable`); `res` is `ServerResponse`.
- **`req.url` and `req.method` are `string | undefined`** — with `strict` + `exactOptionalPropertyTypes`
  you **must** null-check before use:
  ```ts
  const url = req.url ?? "/";
  const method = req.method ?? "GET";
  ```
  This is the #1 TS error vs the JS course (which treats `undefined` loosely).
- **`req.headers` values are `string | string[] | undefined`** — a header can repeat (e.g. `Set-Cookie`)
  or be absent, so guard with `typeof`:
  ```ts
  const ct = req.headers["content-type"]; // string | string[] | undefined
  if (typeof ct === "string") { /* use it */ }
  ```
- `req.socket.remoteAddress` → `string | undefined` (client IP, for logging/rate-limiting).
- Buffer handling is type-safe: chunks are `Buffer`; `Buffer.concat(chunks)` is correctly typed — no `any`.
- The architecture is identical to JS; TS forces you to acknowledge `url`/`method`/`headers` may be
  `undefined` — the safety the JS course skips.

## Notes & gotchas
- `req` = connection metadata (properties, ready now) + a body stream (chunks via `'data'`/`'end'`).
- Properties answer **who/what/how**; the stream delivers **the payload**.
- No `req.body` — collect the stream (frameworks like Express parse it later; the course teaches raw Node).
- Always null-check `req.url` / `req.method` / `req.headers[...]` under strict TS.
- Read the body inside `req.on("end", ...)`; handle `req.on("error", ...)` for malformed streams.
- `req.rawHeaders` preserves order/duplicates that `req.headers` collapses.
- Use `new URL(req.url ?? "", base)` to parse path + query safely.

---

# Lecture 30: Sending Responses

## What I learned
- Lecture 30 is the mirror of Lecture 29: `req` is a **Readable** stream you *consume*, while `res` is
  an `http.ServerResponse` — a **Writable** stream you *produce*. Sending a response means writing
  bytes into `res` and then ending it.
- `ServerResponse` **extends `stream.Writable`**. You push data with `res.write(...)` and signal "done"
  with `res.end(...)`. The browser can only render once the response is *ended* and the connection closes.

### The three things you control
- **Status code** — `res.statusCode` (default `200`) or via `writeHead`.
- **Headers** — `res.setHeader(...)` (or inside `writeHead`).
- **Body** — `res.write(...)` / `res.end(body)`.

### The methods
- `res.end(body?)` — writes the (optional) final chunk **and closes** the response. **Must be called
  exactly once.**
- `res.write(chunk)` — writes a chunk *without* ending (for streaming). Returns `boolean`
  (backpressure). You must still call `res.end()` after.
- `res.setHeader(name, value)` — sets a response header (buffered until the first write/end).
- `res.writeHead(status, headers?)` — sets status + headers **and flushes** them immediately.
- `res.statusCode` / `res.statusMessage` — properties to set status before ending.

### Minimal correct response
```ts
import http, { IncomingMessage, ServerResponse } from "node:http";

const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello from Node!");
});
server.listen(3000);
```
- `res.end("Hello from Node!")` writes the body **and** ends the response. Until `end()` is called,
  the browser keeps waiting — the silent **hang** warned about in Lecture 26.

### Headers + status together
```ts
res.writeHead(201, {
  "Content-Type": "application/json",
  "X-Powered-By": "Node",
});
res.end(JSON.stringify({ ok: true }));
```

### Sending HTML (why Content-Type matters)
- `res.end("<h1>Hi</h1>")` with default `text/plain` shows **raw tags**. Set the type so it renders:
  ```ts
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end("<h1>مرحباً</h1>"); // charset=utf-8 → Arabic/unicode renders correctly
  ```

### Streaming with res.write (multiple chunks)
```ts
res.setHeader("Content-Type", "text/plain");
res.write("chunk 1\n");
res.write("chunk 2\n");
res.end("chunk 3\n"); // still must end!
```
- `res.write` returns `false` when the internal buffer is full (backpressure) — advanced; remember
  **every `write` must be followed by exactly one `end`**.

## TypeScript mapping
- `res` is typed `ServerResponse` (a `stream.Writable`) — autocompletion + safety on every method.
- **Header value type is `number | string | string[]`** — `res.setHeader("X", 5)` is fine, but you
  can't pass an object:
  ```ts
  res.setHeader("Content-Type", "text/html"); // ✅ string
  ```
- **`res.end` / `res.write` accept `string | Buffer`** — TS rejects other types (no accidental `end({})`).
- `res.writeHead(statusCode, headers?)` returns `this` (chainable); `statusCode` is a `number`.
- **Strict property order:** headers must be set **before** the first `write`/`end`. After the first
  body byte is sent, the header block is locked — calling `setHeader`/`writeHead` again throws
  `ERR_HTTP_HEADERS_SENT`.

## Notes & gotchas
- `res` is an outgoing Writable stream: **configure headers + status first, push body with `write`,
  then `end` exactly once.**
- Two failure modes (checklist items):
  - **Hang** — never call `res.end()` → client waits forever (Lecture 26).
  - **Double-end** — call `res.end()` twice → `ERR_STREAM_WRITE_AFTER_END` / headers already sent.
    Exactly **one** `end` per request.
- Set `Content-Type` (with `charset=utf-8`) so the browser renders HTML/unicode instead of raw text.
- `res.writeHead` flushes headers immediately; `res.setHeader` buffers them until first write/end.
- `res.write` returning `false` = backpressure (advanced) — still end the response once.

---

# Lecture 31: Request & Response Headers

## What I learned
- Lecture 31 formalizes **headers** — metadata key/value pairs that travel *alongside* the body in both
  directions. Request headers are read via `req.headers`; response headers are set via `res.setHeader`
  / `res.writeHead`. Headers carry metadata (content type, length, encoding, caching, auth, cookies) —
  everything *about* the payload, not the payload itself.
- **Request headers** — sent by the client (browser/curl) → you **read** them via `req.headers`.
- **Response headers** — sent by your server → you **set** them via `res.setHeader` / `res.writeHead`.

### Request headers (req.headers)
- Typed `IncomingHttpHeaders`, read-only. Common ones: `Host`, `User-Agent`, `Accept`,
  `Accept-Encoding`, `Content-Type`, `Content-Length`, `Authorization`, `Cookie`.
- **Critical rule — Node lowercases header names.** At the HTTP protocol level headers are
  **case-insensitive** (`Content-Type` ≡ `content-type`), and Node normalizes them to lowercase in
  `req.headers`. Always read with lowercase keys: `req.headers["content-type"]`.
  ```ts
  const ua = req.headers["user-agent"];  // string | string[] | undefined
  const ct = req.headers["content-type"];
  const host = req.headers["host"];
  ```

### Response headers (setHeader / getHeader / removeHeader)
- `setHeader` **buffers** the header until the first `write`/`end` (or `writeHead` flushes it).
- `getHeader` / `hasHeader` / `removeHeader` inspect/alter headers you've set (before they're sent).
  ```ts
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const ct = res.getHeader("Content-Type"); // number | string | string[] | undefined
  res.hasHeader("Content-Type");             // boolean
  res.removeHeader("Cache-Control");
  res.end("<h1>مرحباً</h1>");
  ```

### Multiple values & arrays
- A header name can repeat on the wire (e.g. `Set-Cookie`). Node collapses repeats into an **array**:
  - request side: `req.headers["set-cookie"]` is `string[]` when repeated.
  - response side: set multiple values explicitly — `res.setHeader("Set-Cookie", ["a=1", "b=2"])`.

### The golden constraint (ties Lectures 29–30)
- **Headers must be configured before the body is written.** The HTTP frame order is
  `STATUS → HEADERS → BODY`. Once the first body byte leaves (`res.write`/`res.end`), the header block
  is **locked**: `res.write("hi"); res.setHeader("Content-Type", "text/plain");` throws
  `ERR_HTTP_HEADERS_SENT`. So: **set status + headers first → then write/end body.**

## TypeScript mapping
- **`req.headers` values are `string | string[] | undefined`** — guard before use:
  ```ts
  const ct = req.headers["content-type"];
  if (typeof ct === "string") { /* single value */ }
  ```
- **`res.setHeader(name, value)` value type is `number | string | readonly string[]`** — no objects.
- **`res.getHeader` returns `number | string | string[] | undefined`** — nullable, guard it.
- Header **names are `string`**; read request headers in **lowercase** (Node lowercases them).
- `req.rawHeaders: string[]` preserves original **case + order + duplicates** (use when that matters).

## Notes & gotchas
- Headers = the envelope; body = the letter. Request headers describe what the client sent; response
  headers tell the client how to interpret what's coming.
- Configure response headers **before** the body; HTTP treats header names case-insensitively, but
  Node stores them lowercase.
- After the first body byte, headers are locked → `ERR_HTTP_HEADERS_SENT` if you try to set them.
- Repeated headers become arrays (`Set-Cookie`); set arrays to send multiple header lines.
- Always null-check header values under strict TS (`string | string[] | undefined`).

---

# Lecture 32: Routing Requests

## What I learned
- Lecture 32 introduces **routing** — inspecting the incoming request and deciding *what* to send back
  based on its **URL path** and **method**. Up to now every request got the same response; routing makes
  the server actually useful.
- Routing = branching the request listener on request metadata: **path** (`req.url` →
  `new URL(...).pathname`) → *what resource*; **method** (`req.method`) → *what action* (GET = read,
  POST = create, …).

### The basic router
```ts
import http, { IncomingMessage, ServerResponse } from "node:http";

const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "", "http://localhost");
  const pathname = url.pathname;

  if (pathname === "/") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("<h1>Home</h1>");
  } else if (pathname === "/users") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("<h1>Users</h1>");
  } else if (pathname === "/products") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("<h1>Products</h1>");
  } else {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("<h1>404 - Not Found</h1>");
  }
});
server.listen(3000);
```

### Key points
- **Use `pathname`, not `req.url`.** `req.url` includes the query string (`/users?page=2`), so an exact
  `=== "/users"` check would fail. `new URL(...).pathname` strips the query → clean routing key.
- **Always end the response in every branch**, including the `404` default. A branch without `res.end()`
  = silent **hang** (Lecture 26 checklist item).
- **Default/404 branch is mandatory.** Without it, unknown paths fall through with no response sent.
- **Method-aware routing** (preview of POST in Lecture 34):
  `if (pathname === "/users" && req.method === "POST") { /* create user */ }`.
- A `switch (pathname)` reads cleanly for many routes; the `default:` case is your 404.

### Sending different content types per route
```ts
if (pathname === "/api/users") {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify([{ id: 1, name: "Ada" }]));
}
```
- This is where Lecture 31's `Content-Type` matters: the client renders JSON vs HTML based on the
  header you set.

## TypeScript mapping
- **Null-safety from Lecture 29:** `req.url` and `req.method` are `string | undefined` — always
  `req.url ?? ""` and `req.method ?? "GET"` before comparing.
- **`pathname` is `string`** (from `URL`) — safe to compare directly.
- **Set `res.statusCode = 404`** (a `number`) for the not-found branch — TS validates the type.
- Every branch must call `res.end(body)` exactly once — TS won't catch a missing `end` (runtime), so it
  is manual checklist discipline, not a type error.
- Use strict `===` (TS `strict` + style) — pathnames are strings, no coercion needed.

## Notes & gotchas
- Routing = read `pathname` (+ `method`) → pick a branch → set `Content-Type`/`statusCode` → `res.end()`
  exactly once. Unknown paths must hit a `404` default.
- Parse with `new URL`, never match on raw `req.url` (it carries the query string).
- Method + path together define a route (GET `/users` vs POST `/users` differ).
- No framework yet — this is raw `if`/`switch` routing; later tooling (Express) abstracts it.

---

# Lecture 33: Redirecting Requests

## What I learned
- Lecture 33 covers **redirects** — telling the client "go look over there instead." A redirect isn't
  your server sending the new content; it's your server sending a **status code + a `Location` header**,
  and the **browser then makes a second request** to that location.
- A redirect handler just points the way; it does **not** serve the new content itself.

### How a redirect works
```text
 Browser                Server
   │                      │
   │── GET /old ────────▶│
   │                      │  (sets statusCode = 302,
   │                      │   Location: "/new")
   │◀── 302 + Loc ────────│
   │                      │
   │── GET /new ────────▶│  (browser auto-follows Location)
   │                      │
   │◀── 200 + HTML ───────│
   ▼                      ▼
```
- The server replies with a **3xx status** + `Location` header. The browser reads it, issues a *new*
  request to `Location`, and your server serves that route normally. So **two requests happen**.

### The code
```ts
import http, { IncomingMessage, ServerResponse } from "node:http";

const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "", "http://localhost");

  if (url.pathname === "/old") {
    res.statusCode = 302;
    res.setHeader("Location", "/new");
    res.end(); // still required — ends the response (no body needed)
    return;
  }

  if (url.pathname === "/new") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("<h1>New page</h1>");
    return;
  }

  res.statusCode = 404;
  res.end("<h1>404</h1>");
});
server.listen(3000);
```
- Visiting `/old` → server replies `302 Location: /new` → browser auto-requests `/new` → server returns
  the HTML.

### The status codes
- **`301 Moved Permanently`** — new *permanent* home. Browsers **cache** it aggressively; future visits
  to `/old` may skip your server entirely.
- **`302 Found`** (temporary) — "look here for now." Not cached permanently; the browser re-asks each time.
- (Advanced, later: `307`/`308` preserve the method; `301`/`302` historically changed POST→GET. The
  course focuses on 301/302.)
- **Dev tip:** use `302` while learning — `301` gets cached and makes debugging confusing.

### Common patterns
- **Trailing slash normalization:** `/about/` → `/about`.
- **Old URL → new URL** after a site restructure.
- **HTTP → HTTPS** (usually at a proxy/load-balancer, not the app).
- **POST → GET** after a form submit (the classic "Post/Redirect/Get" pattern; Lecture 34 ties in).

## TypeScript mapping
- **Both pieces required:** a 3xx `statusCode` **and** the `Location` header. Either alone does nothing.
- **`res.statusCode` is a `number`** — `301`/`302` are valid; TS validates the type.
- **`Location` value is a `string`** — absolute URL (`https://...`) or path (`/new`) both work.
- **You must still call `res.end()`** — even with no body. Without it, the response hangs (Lecture 26).
  A `return` right after keeps you from accidentally falling through to more code.
- **The target route must exist** on your server, or the second request 404s. The redirect doesn't serve
  content itself.
- **No body needed** for a redirect — `res.end()` with no argument is correct.

## Notes & gotchas
- A redirect = `statusCode = 301|302` + `Location` + `res.end()`. You hand the browser a signpost; the
  browser makes the *next* request itself. Two requests total; your handler only points, it doesn't serve.
- `301` is cached by browsers — prefer `302` during development to avoid stale-redirect confusion.
- Always `return` after a redirect/`end` to prevent double-writing the response.
- Use `new URL(req.url ?? "", base).pathname` for matching (query string stripped), consistent with Lecture 32.

---

# Lecture 34: Parsing Request Bodies

## What I learned
- Lecture 34 combines Lectures 29 (reading the body stream), 32/33 (routing + methods): handling
  **`POST`** requests by **parsing the request body** into usable data (JSON or form fields).
- `GET` requests carry no body. But `POST`/`PUT` (the "create/update" verbs) send a **payload** — and
  as learned in Lecture 29, that payload arrives as a **stream** (`req.on("data")` / `req.on("end")`),
  never as a ready `req.body`. Lecture 34 is about **collecting that stream and parsing it into a real
  object**.

### Step 1: Collect the body (from Lecture 29)
```ts
const chunks: Buffer[] = [];
req.on("data", (chunk: Buffer) => chunks.push(chunk));
req.on("end", () => {
  const body = Buffer.concat(chunks).toString(); // raw string payload
  // parse `body` based on its Content-Type ...
});
```

### Step 2: Parse based on Content-Type
- The `Content-Type` request header tells you the format:

| `Content-Type` | How to parse |
|---|---|
| `application/json` | `JSON.parse(body)` |
| `application/x-www-form-urlencoded` | `new URLSearchParams(body)` |

```ts
import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";

interface UserInput {
  name: string;
  email: string;
}

function parseUser(raw: unknown): UserInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.name !== "string" || typeof r.email !== "string") return null;
  return { name: r.name, email: r.email };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", (err: Error) => reject(err));
  });
}

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "", "http://localhost");
  const pathname = url.pathname;

  if (req.method === "GET" && pathname === "/") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<form method="POST" action="/users" enctype="application/x-www-form-urlencoded">
      <input name="name" placeholder="name" />
      <input name="email" placeholder="email" />
      <button>Send</button>
    </form>`);
    return;
  }

  if (req.method === "POST" && pathname === "/users") {
    try {
      const raw = await readBody(req);
      const ct = req.headers["content-type"];

      let user: UserInput | null = null;
      if (ct === "application/json") {
        user = parseUser(JSON.parse(raw));
      } else if (ct === "application/x-www-form-urlencoded") {
        const p = new URLSearchParams(raw);
        user = parseUser({ name: p.get("name"), email: p.get("email") });
      }

      if (!user) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Invalid input");
        return;
      }

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true, user }));
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Invalid body");
    }
    return;
  }

  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("Not found");
});
server.listen(3000, () => console.log("Server on http://localhost:3000"));
```

### The Post/Redirect/Get tie-in (from Lecture 33)
- A classic real flow: a form `POST`s, the server **parses the body**, then **redirects** (`302` +
  `Location`) so a refresh doesn't resubmit. That's why Lectures 33 + 34 go together.

## TypeScript mapping
- **`JSON.parse` returns `any`** by design — which violates our checklist rule **"No `any`."** Fix by
  casting to a **typed shape**: `JSON.parse(raw) as CreateUser`. Better, validate at runtime (client
  data is untrusted) via a `parseUser(raw: unknown): UserInput | null` guard.
- **`Content-Type` is `string | string[] | undefined`** (Lecture 31) — compare with `===` against the
  exact string; guard with `typeof` first.
- **`JSON.parse` throws on invalid/empty input** — always wrap in `try/catch` (returns `400`).
- **`new URLSearchParams(raw)`** is fully typed; `.get(key)` returns `string | null` → default with `?? ""`.
- **Empty body:** `POST` with no body still fires `end` with no `data` chunks → `raw === ""` →
  `JSON.parse("")` throws → caught as `400`.
- **`req.method` is `string | undefined`** — check `req.method === "POST"` (Lecture 29 null-safety).
- **Always `return` after wiring the stream** so you don't fall through and double-`end`.
- `import type { IncomingMessage, ServerResponse } from "node:http"` (verbatimModuleSyntax requires
  type-only imports; `http` stays a value import).

## Notes & gotchas
- Read the body stream → get a raw string → **parse by `Content-Type`** (`JSON.parse` / `URLSearchParams`)
  → **type/validate** it (never trust `any`) → respond. Wrap parsing in `try/catch` for malformed input.
- `415 Unsupported Media Type` is the right status for an unknown `Content-Type`.
- `400` for malformed/invalid bodies (bad JSON, missing fields). `201` for successful creation.
- The body only exists on `POST`/`PUT`/etc., never on `GET`.
- A framework (Express/Fastify) does this same gather-then-parse underneath; we do it at the raw layer.

---

# Concept: Streams & Buffers (the mechanics under Lecture 34)

> Supplementary note deepening *how* a request body becomes usable data.

## What I learned
- A **`Buffer`** is Node's way of holding **binary data** (a sequence of bytes). Network data arrives as
  bytes, not strings or objects. So when a request body streams in, each `data` chunk is a `Buffer` —
  raw bytes waiting to be interpreted.
- A **stream** is an interface for handling data **sequentially, in pieces**, without loading everything
  into memory at once. `req` is a **Readable** stream (body flows in); `res` is a **Writable** stream
  (response flows out).

### Buffer — raw bytes
- To turn bytes → text, **decode** with an encoding: `chunk.toString("utf-8")` (utf-8 is the default).
- The encoding matters: Arabic/emoji are multi-byte in utf-8, so you must decode the *whole* body
  together — never `toString()` a partial chunk mid-character (you'll corrupt a multibyte char). That's
  why we collect **all** chunks first, then `Buffer.concat(chunks).toString()` once.
- `Buffer.concat(chunks)` merges an array of `Buffer`s into one — safe because concatenation happens at
  the byte level, before decoding.

### Stream — data over time
- **Chunks arrive over time.** A small body may be one `data` event; a large one many. You never know in
  advance — so you must accumulate until `'end'`.
- **`'end'` = stream finished** — only then is the full body available to parse.
- **`'error'` = stream broke** (bad encoding, aborted connection) — handle it or the process can crash.

### Why we collected into an array (Lecture 34 recap)
```ts
const chunks: Buffer[] = [];
req.on("data", (c: Buffer) => chunks.push(c));
req.on("end", () => {
  const body = Buffer.concat(chunks).toString(); // decode the FULL byte sequence at once
  const data = JSON.parse(body);
});
```
- We pushed `Buffer`s (not strings) so no byte ever gets half-decoded. `Buffer.concat` joins them, then a
  single `.toString()` decodes cleanly.

### Alternatives & notes
- **`req.setEncoding("utf8")`** makes `data` chunks arrive as `string` instead of `Buffer` (Node decodes
  each chunk for you). Simpler, but risks splitting a multibyte char across two chunks — for non-ASCII,
  collecting `Buffer`s is safer.
- **Memory caveat (advanced):** collecting the *entire* body in an array works for learning, but huge
  uploads hold everything in RAM. Production streams the body straight to disk/parser (backpressure-aware).
- **Backpressure:** `res.write()` returns `false` when the outgoing buffer is full (Lecture 30) — the
  stream telling you "slow down."

### Real Buffer decode example (from a live `console.log(chunk)`)
- A pasted `Buffer` began `6e 61 6d 65 3d` → decoded utf-8 = `name=`, then `55 73 61 6d 61` = `Usama`.
  So it was an `application/x-www-form-urlencoded` body. Another began `name=What+is+a+paragraph%3F…`
  where `+` = space and `%3F` = `?` — URL-encoding that only `new URLSearchParams` decodes correctly
  (`JSON.parse` would throw).
- Node truncates the *printed* Buffer (`… 127 more bytes`), but the full bytes are in the chunk — never
  trust the visible slice; accumulate every chunk, then decode once.

## TypeScript mapping
- A chunk is typed `Buffer` (global): `req.on("data", (c: Buffer) => ...)`.
- `Buffer.concat(chunks: readonly Uint8Array[]): Buffer`.
- `buffer.toString(encoding?: BufferEncoding): string` — `BufferEncoding` validates the literal
  (`"utf-8"`).
- `req: stream.Readable`, `res: stream.Writable` (via `IncomingMessage`/`ServerResponse`).

## Notes & gotchas
- **Rule of thumb:** Collect, don't decode (push `Buffer`s) → `Buffer.concat` (byte level) → decode once
  with `.toString("utf-8")` → then parse. Never decode a partial chunk if non-ASCII is involved.
- Bytes have **latent** meaning realized only when (a) you have the complete sequence and (b) apply the
  correct interpretation (`Content-Type` → decoder → parser). Same bytes = different meaning per lens.
- `req` Readable / `res` Writable; `'data'` = chunk, `'end'` = done, `'error'` = failed.
- A single chunk *can* be the whole body for small payloads, but you can't rely on it — always gather.

