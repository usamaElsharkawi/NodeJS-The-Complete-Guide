# Section 1 — Introduction

> Detailed learning notes for **"Node.js — The Complete Guide"** (JavaScript course), **mapped to TypeScript**.
> The **root [`README.md`](../README.md)** holds the high-level course overview; each section keeps its own detailed notes here.

## 🎯 Section goal
Get Node.js running, demystify *what Node.js actually is* under the hood, and write the **first app in TypeScript** (strict mode).

## 🛠️ Project scaffold (this folder)
| File | Purpose |
|------|---------|
| `package.json` | dependency manifest + scripts |
| `tsconfig.json` | TypeScript config — **strict**, `module: node16`, `moduleResolution: node16` |
| `.gitignore` | `node_modules/`, `dist/`, logs, IDE files |
| `app.ts` | the first TypeScript snippet (see below) |

### Scripts
```bash
npm start    # ts-node app.ts          (dev / run TS directly)
npm run lint # tsc --noEmit            (strict type check)
npm run build# tsc                      (-> dist/)
node dist/app.js                      (run compiled output)
```

> ⚠️ The folder name contains `:` (`Section1: Introduction`). `npx`/`npm run` warn about the colon delimiter. The npm scripts above invoke the **local bin** (`./node_modules/.bin/...`) so they still work. You can also call the bin directly.

### Environment
- Node.js **v24.19.0 LTS** (Krypton) — managed via `nvm`; default -> `lts/*` (auto-loads in new terminals).

---

### Lecture 01 — Introduction
**What the lecture covers:**
- This is the introductory lecture — overview of the course ("Node.js — The Complete Guide"): what it teaches, what you'll build, and prerequisites.
- The course is JS-first; the goal is to build real server-side apps with Node.js.

**Our angle (Boss's requirement):** Map every JS concept to **TypeScript**.
- We re-implement examples as typed `.ts` files using `strict: true`, `noImplicitAny`, `strictNullChecks`.
- The JS `require('module')` pattern -> TS `import ... from 'module'` (ES-module style with `esModuleInterop`).
- Plain JS values -> explicitly typed where helpful (`const port: number = 3000`).

**Environment we set up for the section:**
- Installed **Node.js v24.19.0 LTS** via `nvm` (`nvm install --lts`, `nvm alias default lts/*`).
- Scaffolded this folder with `package.json` (scripts `start`/`build`/`watch`/`lint`), `tsconfig.json` (strict, node16), `.gitignore`.
- First snippet `app.ts`:
```ts
import { version as nodeVersion } from 'node:process';
const banner: string = `🚀 Running on Node.js ${nodeVersion}`;
console.log(banner);
```
  - Verified: `tsc --noEmit` OK · `ts-node app.ts` -> `🚀 Running on Node.js v24.19.0` OK
  - This already proves the core idea: **run JS/TS outside the browser using Node's typed APIs.**

**Workflow used (per lecture):**
1. Watch (JS lecture) -> 2. Discuss (explain + TS mapping) -> 3. Code (TypeScript) ->
4. Review (6-point checklist: compiles / runs / types / bugs / best-practices / clean) ->
5. On "document it" -> APPEND section README + commit `Document Lecture XX: [Topic]` -> push.

---

### Lecture 02 — What is Node.js?
**What the lecture covers:**
- Definition: **Node.js is a JavaScript runtime** that lets you execute JavaScript **outside the browser**.
- It is **not** a "new version of JavaScript" — the JS language itself is ECMAScript (ES); Node is the *platform* that runs it and ships a server-side standard library (file system, networking, HTTP...).

**The three layers of Node.js:**
1. **V8** (Google, C++) — the JS engine. Parses & executes JS via its JIT pipeline: Ignition (bytecode interpreter) -> Liftoff (baseline compiler) -> TurboFan (optimizing compiler). V8 alone has **no I/O**.
2. **libuv** (C library) — provides the **event loop** (single JS thread) and **async I/O** via OS backends (epoll / kqueue / IOCP). Also owns a **thread pool** (default 4 threads) used for blocking work like `fs` and DNS — so the main thread never blocks on disk.
3. **Node C++ core + built-in JS modules** — the glue (`fs`, `http`, `path`, `events`, `stream`...) that exposes OS/library functionality to JS. Most built-ins are thin JS wrapping C++.

**Why it's fast - JIT compilation:**
- JIT is NOT "interpret everything, then compile it all." JIT = **run immediately (bytecode) while profiling**, then **lazily compile only hot code** to optimized machine code — interleaved.
  - Interpreted: 1 phase (line-by-line). AOT: 2 phases (compile all -> run). JIT: run + selectively optimize on the fly.
- Optimization is **profile-driven**: hidden classes + inline caching yield **monomorphic** (fast) -> **polymorphic** -> **megamorphic** (slow). Wrong type assumptions trigger **deoptimization** back to bytecode.

**TypeScript lens:**
- Toolchain: `app.ts` -> `tsc` -> `app.js` -> **V8 JIT** compiles hot code at runtime.
- `tsc` = compile-time only (TS -> JS; **erases types**). `V8 JIT` = runtime speedup.
- **TypeScript types are erased at runtime** — V8 does not read them. TS gives *correctness* + *type-stable code* (keeps JIT monomorphic). V8 JIT gives raw *speed*.
- Node built-in APIs are typed via `@types/node`, e.g. `import { version } from 'node:process'` -> fully typed (autocomplete + compile-time checks).

**Trade-offs:**
- I/O-bound / real-time (APIs, servers, CLIs) -> excellent.
- CPU-heavy (video, math) blocks the single event-loop thread -> offload via `worker_threads` / `child_process`.
- Single-threaded concurrency via event loop; multi-core via `cluster` / worker pools.
- Huge `npm` ecosystem.

**Key takeaway:** `Node.js = V8 (runs JS) + libuv (event loop + async I/O) + Node core (API glue)`. Together they make "run JS on the server" real — and in TypeScript we get **typed** access to all of it.

**No new code file** — Lecture 02 is conceptual. The existing `app.ts` (`node:process` version check) stands as the live demo that this entire stack is real.
