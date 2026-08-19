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
