# Section 5: Working with Express.js

> TypeScript (native `.ts`) running on Node.js v24+ with Express.js.
> Toolchain: `node app.ts` (type-stripping) + `tsc --noEmit` (type-checking)

## 🔧 Project Setup

```bash
# 1) scaffold
npm init -y
npm install express
npm install -D @types/express typescript @types/node

# 2) every lecture
npm run lint      # tsc --noEmit
npm start         # node app.ts
```

### tsconfig.json (same strict settings as Section 3)

```jsonc
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2023"],
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"]
  },
  "include": ["*.ts"],
  "exclude": ["node_modules"]
}
```

---

# Lecture 57: Module Introduction

## What I learned
- Section 5 introduces **Express.js** — the most popular Node.js web framework.
- Express simplifies building web servers by providing:
  - **Routing** (`app.get()`, `app.post()`) instead of manual if/else on `req.url`
  - **Middleware** — functions that run before your route handlers
  - **Helpers** like `res.send()`, `req.body` parsing, etc.
- We'll build a complete multi-page website with navigation, static files, and HTML serving.

```text
┌─────────────────────────────────────────────┐
│  Raw Node.js (Section 3)                   │
│  ├─ Manual route matching                   │
│  ├─ Manual body parsing                     │
│  └─ Manual header management                │
├─────────────────────────────────────────────┤
│  Express.js (Section 5)                     │
│  ├─ app.get('/path', handler)               │
│  ├─ Middleware pipeline                     │
│  ├─ Built-in body parsing                   │
│  └─ res.send() with auto Content-Type       │
└─────────────────────────────────────────────┘
```

## TypeScript mapping
- `import express from "express"` (ESM, verbatimModuleSyntax)
- `express.Request` and `express.Response` types replace raw Node types
- Middleware signature: `(req: Request, res: Response, next: NextFunction) => void`
- No `require()` — use `import` only
- All TypeScript constraints from Section 3 still apply (strict, noEmit, erasableSyntaxOnly)

## Notes & gotchas
- Express is an **npm package** — first non-built-in dependency in this course
- `@types/express` provides full type safety for Request/Response/middleware
- Node 24 runs `.ts` files natively — no compile step needed for execution
- Keep the same strict tsconfig rules; Express types work with them

---

# Lecture 58: What is Express.js?

## What I learned
- Express.js is a **minimalist web framework** for Node.js that sits on top of the built-in `http` module.
- It removes the boilerplate you had to write in Section 3:
  - No manual `if/else` on `req.url` for routing
  - No manual `res.setHeader()` and `res.end()` for every response
  - No manual body stream parsing
  - No manual 404 handling
- Express provides a clean, chainable API with middleware support.

### The problem with raw Node.js (Section 3)
```text
Raw Node.js (Section 3):
┌──────────────────────────────────────┐
│  http.createServer((req, res) => {   │
│    const url = new URL(req.url ?? "") │
│    if (url.pathname === "/") {        │
│      res.setHeader("Content-Type",    │
│        "text/html; charset=utf-8")    │
│      res.end("<h1>Home</h1>")        │
│    } else if (...) { ... }            │
│    else {                             │
│      res.statusCode = 404            │
│      res.end("Not Found")            │
│    }                                  │
│  })                                   │
└──────────────────────────────────────┘
```

### What Express gives you
```text
Express.js:
┌──────────────────────────────────────┐
│  import express from "express"       │
│  const app = express()               │
│                                      │
│  app.get("/", (req, res) => {        │
│    res.send("<h1>Home</h1>")         │
│  })                                  │
│                                      │
│  app.use((req, res) => {             │
│    res.status(404).send("Not Found") │
│  })                                  │
│                                      │
│  app.listen(3000)                    │
└──────────────────────────────────────┘
```

### Key features
1. **Routing** — `app.get()`, `app.post()`, `app.put()`, `app.delete()` instead of manual path matching
2. **Middleware** — functions that run before route handlers (logging, auth, body parsing, etc.)
3. **Helpers** — `res.send()`, `res.json()`, `res.status()` — auto-set Content-Type and end response
4. **Ecosystem** — `express.Router()` for modular routes, `express.static()` for static files

### Why Express?
| Reason | Explanation |
|--------|-------------|
| **Industry standard** | Most Node.js jobs and production code uses Express |
| **Less boilerplate** | No manual header setting, URL parsing, or 404 handling |
| **Middleware pattern** | Clean, composable request pipeline |
| **Large ecosystem** | Router, static serving, body parsing, sessions, etc. |
| **Still low-level** | Unlike Rails/Django, you still control the HTTP layer |

### The Express request lifecycle
```text
Incoming Request
    │
    ▼
┌─────────────────┐
│ Middleware 1     │ (e.g., logging)
│ app.use(logger)  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Middleware 2     │ (e.g., body parsing)
│ express.json()   │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Route Handler   │ (e.g., app.get("/", handler))
│ res.send(...)    │
└────────┬────────┘
         ▼
    Response sent
```

## TypeScript mapping
- `import express from "express"` (ESM default import)
- Types: `express.Request`, `express.Response`, `express.NextFunction`
- No `require()` — use `import` only
- `res.send()` accepts `string | Buffer | object` — auto-sets Content-Type and calls `res.end()`
- `req.body` is typed as `any` by default — you'll validate it yourself
- All TypeScript constraints from Section 3 still apply (strict, noEmit, erasableSyntaxOnly)

## Notes & gotchas
- Express is **not built into Node** — it's an npm package you install
- `res.send()` automatically calls `res.end()` — no hanging responses if you use it correctly
- Middleware runs in **order of registration** — order matters!
- `app.use()` matches ALL HTTP methods; `app.get()` only matches GET
- You still need to understand raw Node.js — Express is abstraction on top of it

---

# Lecture 59: Installing Express.js

## What I learned
- Installing Express and getting a basic server running.
- Express is installed via npm and requires `@types/express` for TypeScript support.

### Installation
```bash
npm install express
npm install -D @types/express
```

### Minimal Express app
```ts
import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("<h1>Hello from Express!</h1>");
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

### What changed from Section 3
| Section 3 (raw Node) | Section 5 (Express) |
|---|---|
| `import http from "node:http"` | `import express from "express"` |
| `http.createServer(...)` | `express()` creates an app |
| Manual `req.url` parsing | `app.get("/path", handler)` |
| `res.setHeader(...)` + `res.end(...)` | `res.send(...)` — auto Content-Type + end |
| Manual 404 branch | Middleware fallback handles it |
| `server.listen(3000)` | `app.listen(3000)` |

### Under the hood
Express **still uses Node's `http` module**. `app.listen()` calls `http.createServer()` internally. Express is just a cleaner API layer on top of the same `http` module you used in Section 3.

```text
Your Express code
        │
        ▼
┌─────────────────────────┐
│  Express.js framework   │
│  ├─ Routing             │
│  ├─ Middleware pipeline │
│  └─ Helper methods      │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Node's http module     │
│  (same as Section 3)    │
└─────────────────────────┘
```

## TypeScript mapping
- `import express from "express"` — ESM default import (verbatimModuleSyntax)
- `@types/express` provides full types for `Request`, `Response`, `NextFunction`, `Express` app
- No manual type imports needed for basic usage — Express types are inferred
- `res.send()` is **typed** to accept `string | Buffer | object | ArrayBufferView` — auto Content-Type

## Notes & gotchas
- `npm install express` adds Express to `dependencies` (runtime dependency, not dev)
- `@types/express` goes in `devDependencies`
- `app.get()` only matches GET requests — use `app.post()` for POST, etc.
- `res.send()` calls `res.end()` internally — no hanging responses
- Order of middleware/routes matters — first match wins

---

# Concept: Express.js Philosophy and Nature

> Supplementary note on the core philosophy that makes Express what it is.

## What I learned
- Express.js follows a **minimalist, pluggable design** — the core is tiny, and everything else comes from middleware.
- The entire framework is built around the idea that **everything is middleware**.
- The `app` object returned by `express()` is simultaneously a router config and a valid request handler function.

### Core philosophy: "thin glue + big ecosystem"
```text
┌─────────────────────────────────────────┐
│  Express Core (tiny)                   │
│  ├─ Routing (match URL + method)        │
│  ├─ Middleware pipeline (run in order)  │
│  └─ Response helpers (res.send, etc)    │
├─────────────────────────────────────────┤
│  Middleware Plugins (thousands)        │
│  ├─ Body parsing                        │
│  ├─ Authentication                      │
│  ├─ Logging                             │
│  ├─ Sessions                            │
│  ├─ CORS                                │
│  ├─ Static files                        │
│  └─ ... your custom logic               │
└─────────────────────────────────────────┘
```

### The "minimalist" design pattern
Express provides almost nothing out of the box — just the **pipeline**. You build your app by plugging in middleware:

```ts
const app = express();  // Just: { get(), use(), listen() }

// You compose your server from independent pieces
app.use(express.json());         // → body parsing
app.use(express.static("public")); // → file serving
app.use(session({ secret: "..." })); // → sessions
app.get("/", handler);           // → route handling
```

This is the **Unix philosophy**: "do one thing well, compose with others."

### The middleware architecture: a functional pipeline
Everything in Express is a function with the signature:
```
(req, res, next) => void
```

```text
Incoming Request
    │
    ▼
┌─────────────────────────────────────────────┐
│  Express App (is itself a middleware fn)    │
│                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Logger   │  │ BodyParse│  │  Auth   │  │
│  │  fn #1   │  │  fn #2   │  │  fn #3   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│          │           │           │         │
│          ▼           ▼           ▼         │
│  [Route: GET /]  [Route: POST /] [404]     │
│                                            │
└─────────────────────────────────────────────┘
    │
    ▼
Outgoing Response
```

### Why this philosophy works
1. **Composability** — each middleware is independent; swap, reorder, reuse freely
2. **Separation of concerns** — one middleware logs, another parses bodies, another authenticates
3. **Ecosystem leverage** — thousands of middleware packages solve specific problems well
4. **Progressive enhancement** — start with `app.get("/", handler)` and add complexity only as needed

### The "app is a handler" concept
This isn't just a technical detail — it reveals Express's **functional core**:

```ts
// The Express app satisfies Express' own middleware type:
type RequestHandler = (req: Request, res: Response, next: NextFunction) => void;

// Which means it works with Node's raw HTTP server:
import http from "node:http";
const app = express();
app.get("/", (req, res) => res.send("hello"));

// This works because `app` satisfies the RequestHandler signature:
const server = http.createServer(app);  // ✓ app is a valid handler
server.listen(3000);
```

Express **drops into** any Node.js context. You don't have to restructure your entire app around it — Express plugs into the existing HTTP server abstraction.

### Trade-offs
| Pros | Cons |
|------|------|
| **Extremely flexible** — almost no constraints | **Easy to over-engineer** — too many middleware choices |
| **Massive ecosystem** — thousands of middleware | **Inconsistent APIs** — each middleware author has their own style |
| **Minimal core** — easy to understand foundation | **Callback chains can get complex** |
| **Drop-in compatible** — works with raw Node | **No clear project structure** — you must define your own conventions |
| **Easy to learn basics** — `app.get()` is straightforward | **"Middleware is magic"** — unclear what's happening internally |

### TypeScript and the Express philosophy
The Express philosophy works beautifully with TypeScript:

```ts
import express, { Request, Response, NextFunction, RequestHandler } from "express";

// Every piece is typed
const logger: RequestHandler = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

const validateBody = (requiredFields: string[]): RequestHandler => {
  return (req, res, next) => {
    for (const field of requiredFields) {
      if (req.body?.[field] === undefined) {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }
    next();
  };
};

const app = express();
app.use(express.json());      // typed to add req.body
app.use(logger);              // typed as RequestHandler
app.post("/users", validateBody(["name", "email"]), createUser);  // typed chain
```

Each middleware is a **typed building block**. TypeScript verifies that each piece fits together correctly.

---

# Lectures

- 57. Module Introduction
- 58. What is Express.js?
- 59. Installing Express.js
- 60. Adding Middleware
- 61. How Middleware Works
- 62. Express.js - Looking Behind the Scenes
- 63. Handling Different Routes
- Assignment 2: Time to Practice - Express.js
- 64. Parsing Incoming Requests
- 65. Limiting Middleware Execution to POST Requests
- 66. Using Express Router
- 67. Adding a 404 Error Page
- 68. Filtering Paths
- 69. Creating HTML Pages
- 70. Serving HTML Pages
- 71. Returning a 404 Page
- 72. A Hint!
- 73. Using a Helper Function for Navigation
- 74. Styling our Pages
- 75. Serving Files Statically
- Assignment 3: Time to Practice - Navigation
- 76. Wrap Up
- 77. Useful Resources & Links
