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

