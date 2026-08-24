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

# Lecture 60: Adding Middleware

## What I learned
- Middleware functions sit between the incoming request and your final route handler.
- They receive `(req, res, next)`, can modify `req`/`res`, and either:
  - Call `next()` to pass control to the next middleware/route
  - Send a response themselves (short-circuiting the chain)

```text
Request → [Middleware 1] → [Middleware 2] → [Route Handler] → Response
```

### "Express.js is all about middleware"
This is the core design philosophy. In Express, **everything is middleware**:
- Route handlers (`app.get("/", handler)`) are middleware that match a specific method+path
- `app.use()` registers general middleware for all methods/paths
- `express.json()` is built-in middleware for body parsing
- Even your final response is just the last middleware in the chain sending something

The entire framework is a **middleware pipeline** — you stack functions, and Express runs them in order.

### "Pluggable nature"
Express is **pluggable** because you add/remove/reorder middleware without changing the framework itself. It's like LEGO blocks:

```ts
// Pick what you need, in any order
app.use(logger);           // plug in logging
app.use(express.json());   // plug in body parsing
app.use(auth);             // plug in authentication
app.get("/", handler);     // plug in routes
```

You're not locked into a rigid structure. You compose your server from independent, reusable pieces.

### "Order matters"
Express runs middleware **in the exact order you register it**:

```ts
// ❌ WRONG — auth runs AFTER the route
app.get("/dashboard", dashboardHandler);
app.use(auth);

// ✅ CORRECT — auth runs BEFORE the route
app.use(auth);
app.get("/dashboard", dashboardHandler);
```

**Why order matters:**
1. **Security** — auth must run before protected routes
2. **Body parsing** — `express.json()` must run before routes that read `req.body`
3. **404 handling** — must be **last** (catches everything unmatched)
4. **Error handling** — must be **after** all routes/middleware

```text
Registration order:
1. app.use(logger)          ← runs first
2. app.use(express.json())  ← runs second
3. app.use(auth)            ← runs third
4. app.get("/", handler)    ← runs fourth (if path matches)
5. app.use(404handler)      ← runs last (catches unmatched)
```

### Minimal example
```ts
import express, { Request, Response, NextFunction } from "express";

const app = express();

// Logger middleware
const logger = (req: Request, res: Response, next: NextFunction): void => {
  console.log(`${req.method} ${req.url}`);
  next();
};

app.use(logger);

// Route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello!");
});

app.listen(3000);
```

## TypeScript mapping
- `import express from "express"` (ESM default import, verbatimModuleSyntax)
- Middleware signature: `(req: Request, res: Response, next: NextFunction) => void`
- `NextFunction` is a type — represents "call the next middleware"
- `app.use()` registers middleware for all paths/methods; `app.get()` for GET only
- `res.send()` auto-sets Content-Type and calls `res.end()` — no hanging responses

## Notes & gotchas
- **Always call `next()`** if you want the request to continue — otherwise it hangs
- **OR send a response** (`res.send()`, `res.end()`) — but not both
- `app.use()` without a path matches **all paths**; `app.use("/api", ...)` matches only `/api/*`
- Middleware is **function-based** — no classes needed
- Error-handling middleware has 4 parameters: `(err, req, res, next) => void`

---

# Lecture 61: How Middleware Works

## What I learned
- Express internally maintains a **stack** of middleware/route handlers.
- When a request arrives, Express iterates through this stack **in order of registration**.
- For each middleware, Express calls it with `(req, res, next)` and decides what to do next.

### The middleware execution flow
1. Request arrives → Express creates `req`, `res`, `next` objects
2. Express iterates through registered middleware in order
3. For each middleware:
   - Calls it with `(req, res, next)`
   - If middleware calls `next()`, continue to next
   - If middleware sends a response, stop (short-circuit)
   - If middleware doesn't call `next()` or send response, request **hangs**

### Two ways middleware ends
A middleware function **must** do ONE of these:
1. **Call `next()`** — pass control to the next middleware in the chain
2. **Send a response** (`res.send()`, `res.end()`, `res.json()`, etc.) — end the request

```ts
// Option 1: Continue the chain
const logger = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next(); // ← pass to next middleware
};

// Option 2: End the request (short-circuit)
const auth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send("Unauthorized"); // ← ends here
  }
  next(); // ← continue if authorized
};
```

### What happens if you forget `next()`?
If a middleware doesn't call `next()` and doesn't send a response, the request **hangs indefinitely** — the client waits forever.

```ts
// ❌ BAD — request hangs
const brokenMiddleware = (req, res, next) => {
  console.log("I run but never end or pass control");
  // Missing: next() or res.send()
};
```

### The internal stack
Express stores middleware in an internal array (the "stack"):

```ts
// Internally, Express maintains something like:
const stack = [
  { handle: logger, path: "/" },
  { handle: bodyParser, path: "/" },
  { handle: auth, path: "/" },
  { handle: dashboardHandler, method: "GET", path: "/dashboard" },
  { handle: notFound, path: "/" }
];
```

When a request comes in, Express iterates through this stack in order.

### Middleware types in Express

| Type | Registration | When it runs |
|------|-------------|--------------|
| **Application-level** | `app.use()` | Every request to the app |
| **Route-level** | `app.get(path, fn)` | Only for GET requests to that path |
| **Router-level** | `router.use()` | Only for requests matching the router |
| **Error-handling** | `app.use((err, req, res, next) => ...)` | When `next(err)` is called |

### The `next()` function can take an error
```ts
const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong!");
};

// Pass an error to skip to error handler
app.use((req, res, next) => {
  try {
    // risky operation
  } catch (err) {
    next(err); // ← passes error to error handler
  }
});
```

### TypeScript mapping
```ts
import express, { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from "express";

// Standard middleware type
const logger: RequestHandler = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

// Error-handling middleware (4 parameters!)
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).send("Server error");
};

const app = express();
app.use(logger);           // RequestHandler
app.use(errorHandler);     // ErrorRequestHandler
```

- `RequestHandler` = `(req, res, next) => void`
- `ErrorRequestHandler` = `(err, req, res, next) => void` — **4 parameters** (Express detects this automatically)
- `NextFunction` is a type — represents "call the next middleware"

## Notes & gotchas
- **Always call `next()`** if you want the request to continue — otherwise it hangs
- **OR send a response** — but not both (double-send causes errors)
- `app.use()` without a path matches **all paths**; `app.use("/api", ...)` matches only `/api/*`
- Route handlers (`app.get()`, etc.) are middleware that also check the HTTP method
- Error-handling middleware has **4 parameters** — Express automatically detects this signature
- `next(err)` skips all remaining middleware and goes straight to error handlers
- Middleware order is **critical** — think of it as a pipeline where order = execution order

---

# Lecture 62: Express.js — Looking Behind the Scenes

## What I learned
- I examined the actual Express.js source code on GitHub (`expressjs/express`) to understand the internals.
- The entire framework lives in **~630 lines** across 5 files in `lib/`:
  - `express.js` (81 lines) — entry point, creates the app
  - `application.js` (631 lines) — core app logic, routing, middleware
  - `request.js` — extends Node's IncomingMessage
  - `response.js` — extends Node's ServerResponse
  - `view.js` — template engine support
  - `utils.js` — helpers

### The big reveal: `app` is a function
In `lib/express.js`, the `createApplication()` function creates something clever:

```js
function createApplication() {
  var app = function(req, res, next) {
    app.handle(req, res, next);  // ← app IS a function (valid request handler)
  };

  mixin(app, EventEmitter.prototype, false);  // add .on(), .emit()
  mixin(app, proto, false);                    // add .get(), .use(), .listen()

  return app;
}
```

**The `app` is simultaneously:**
1. A **function** `(req, res, next) => void` — valid Node.js request handler
2. An **object** with methods — `.get()`, `.use()`, `.listen()`, `.set()`, etc.

This is why both work:
```ts
app.listen(3000);                          // Express's built-in server
http.createServer(app).listen(3000);       // Node's raw server — app IS a handler
```

### The request lifecycle in the source
From `application.js`, the `app.handle()` method does:

```js
app.handle = function handle(req, res, callback) {
  // 1. Create finalhandler (default error handler)
  var done = callback || finalhandler(req, res, { env: this.get('env'), ... });

  // 2. Set X-Powered-By header
  if (this.enabled('x-powered-by')) res.setHeader('X-Powered-By', 'Express');

  // 3. Create circular references
  req.res = res; res.req = req;

  // 4. ALTER THE PROTOTYPES — this is the "magic"
  Object.setPrototypeOf(req, this.request);   // add Express methods to req
  Object.setPrototypeOf(res, this.response);  // add Express methods to res

  // 5. Setup locals
  if (!res.locals) res.locals = Object.create(null);

  // 6. Delegate to the Router
  this.router.handle(req, res, done);
};
```

### Key insights from the source

#### 1. Prototype mutation
Express doesn't create new `req`/`res` objects. It **mutates the prototypes** of Node's native objects to add Express-specific methods (like `req.body`, `res.send()`, `res.json()`):

```ts
// What Express does under the hood:
Object.setPrototypeOf(req, app.request);   // adds methods
Object.setPrototypeOf(res, app.response);  // adds methods
```

This is why `req.body` works even though Node's `IncomingMessage` doesn't have it — Express adds it via prototype chain + middleware (like `express.json()`).

#### 2. The Router is separate
The `app` delegates routing to a separate `Router` instance (from the `router` npm package):

```js
Object.defineProperty(this, 'router', {
  get: function() {
    if (router === null) {
      router = new Router({ /* options */ });
    }
    return router;
  }
});
```

When you call `app.get("/", handler)`, Express:
1. Gets the internal `Router`
2. Creates a `Route` for `"/"`
3. Adds `handler` to that route's middleware stack
4. Returns `app` for chaining

#### 3. `app.listen()` wraps `http.createServer()`
```js
app.listen = function listen() {
  var server = http.createServer(this)  // ← `this` is the app function!
  return server.listen.apply(server, arguments);
};
```

This confirms: `app.listen()` just creates a Node HTTP server with `app` as the callback.

#### 4. Middleware is just a stack
`app.use()` flattens arguments and pushes functions into the router's stack:

```js
app.use = function use(fn) {
  var fns = flatten.call(slice.call(arguments, offset), Infinity);
  fns.forEach(function (fn) {
    router.use(path, fn);  // ← just adds to the router's stack
  });
};
```

### Architecture diagram
```text
┌─────────────────────────────────────────────────────────────┐
│  express() creates app                                      │
│                                                             │
│  app = function(req, res, next) {                           │
│    app.handle(req, res, next);  ← app IS a function         │
│  }                                                          │
│                                                             │
│  // Mixin methods from application.js prototype:            │
│  app.get()       ← routing                                  │
│  app.post()      ← routing                                  │
│  app.use()       ← middleware                               │
│  app.listen()    ← starts HTTP server                       │
│  app.set()       ← settings                                 │
│  app.param()     ← route params                             │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  app.handle(req, res, done)                                 │
│                                                             │
│  1. Set X-Powered-By: Express                              │
│  2. req.res = res, res.req = req (circular refs)           │
│  3. Object.setPrototypeOf(req, app.request)  ← adds methods │
│  4. Object.setPrototypeOf(res, app.response) ← adds methods │
│  5. res.locals = {}                                         │
│  6. this.router.handle(req, res, done) ← delegate to router │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  Router.handle(req, res, done)                              │
│                                                             │
│  Iterates through the middleware stack:                     │
│  for each layer in stack:                                   │
│    - Match path/method                                      │
│    - Call layer.handle(req, res, next)                      │
│    - If next() called → continue to next layer             │
│    - If response sent → stop                                │
│    - If no match → continue                                 │
│  If nothing matches → call done() (finalhandler)            │
└─────────────────────────────────────────────────────────────┘
```

### TypeScript mapping
```ts
import express, { Request, Response, NextFunction } from "express";

// The app is a function that Node's http.createServer can use
const app = express();

// But it also has ALL these methods mixed in:
app.get(path, handler);       // from application.js prototype
app.post(path, handler);
app.use(middleware);
app.listen(port, callback);
app.set(setting, value);
app.param(name, fn);

// Under the hood:
// app(req, res) → app.handle(req, res, next) → router.handle(req, res, done)
```

### Notes & gotchas
- Express is **~2,000 lines total** — incredibly small for what it does
- The "magic" is prototype mutation and delegation to the `router` package
- `req` and `res` are the **same objects** Node created — Express just extends their prototypes
- `finalhandler` is the ultimate fallback — if no middleware/route handles the request, it sends a 404/500
- The `router` package does the actual stack iteration; Express just configures it
- This is why `import express from "express"` works — the package's `index.js` just re-exports `lib/express.js`

---

# Lecture 63: Handling Different Routes

## What I learned
- Route-specific methods (`app.get()`, `app.post()`, `app.put()`, `app.delete()`) match **both** the path AND the HTTP method.
- `app.use()` matches all HTTP methods on a path — useful for middleware, not for differentiating routes.
- Route parameters (`:param`) capture values from the URL segment automatically.
- Route order matters — specific routes must come before parameterized routes.

### Basic route handling
```ts
import express, {
  type Express,
  type Request,
  type Response,
} from "express";

const app: Express = express();

// GET / → show home page
app.get("/", (_req: Request, res: Response) => {
  res.send("Welcome to the home page!");
});

// POST /contact → handle form submission
app.post("/contact", (_req: Request, res: Response) => {
  res.send("Message sent!");
});
```

### The key difference: `app.get()` vs `app.use()`

```ts
// ❌ app.use — matches ALL HTTP methods
app.use("/our-product", (req, res, next) => {
  res.send("Matches GET, POST, PUT, DELETE...");
});

// ✅ app.get — matches ONLY GET
app.get("/our-product", (req: Request, res: Response) => {
  res.send("Only matches GET requests to /our-product");
});

// ✅ app.post — matches ONLY POST
app.post("/our-product", (req: Request, res: Response) => {
  res.send("Only matches POST requests to /our-product");
});
```

### Route parameters
Dynamic routes use `:param`:

```ts
// GET /user/:id
app.get("/user/:id", (req: Request, res: Response) => {
  const userId = req.params.id ?? "unknown";
  res.send(`User ID: ${userId}`);
});
```

Examples:
- `GET /user/123` → "User ID: 123"
- `GET /user/abc` → "User ID: abc"

### Multiple route parameters
```ts
// GET /user/:userId/post/:postId
app.get("/user/:userId/post/:postId", (req: Request, res: Response) => {
  const userId = req.params.userId ?? "unknown";
  const postId = req.params.postId ?? "unknown";
  res.send(`User ${userId}, Post ${postId}`);
});
```

### Route matching order — CRITICAL
**Order matters!** Express runs routes in the order you define them:

```ts
// ❌ Wrong order — catches /user/profile before the specific route
app.get("/user/:id", (req, res) => {
  res.send("Generic user page");
});

app.get("/user/profile", (req, res) => {
  res.send("User profile");  // NEVER reached!
});

// ✅ Correct order — specific routes first
app.get("/user/profile", (req, res) => {
  res.send("User profile");
});

app.get("/user/:id", (req, res) => {
  res.send("Generic user page");
});
```

### What changed from Section 3 (raw Node.js)?

```ts
// Section 3 (raw Node) — manual routing with if/else
const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "", "http://localhost");
  const pathname = url.pathname;

  if (path === "/" && method === "GET") { ... }
  else if (path === "/about" && method === "GET") { ... }
  else if (path === "/" && method === "POST") { ... }
  else { res.statusCode = 404; res.end("Not Found"); }
});
```

```ts
// Section 5 (Express) — declarative routing
app.get("/", (req, res) => { res.send("Home"); });
app.get("/about", (req, res) => { res.send("About"); });
app.post("/", (req, res) => { res.send("Posted"); });
```

### Middleware vs Routes
```ts
// Middleware — runs for ALL methods
app.use("/api", (req, res, next) => {
  console.log("Runs for GET/POST/PUT/DELETE on /api/*");
  next();  // MUST call next() to continue
});

// Route — runs ONLY for GET
app.get("/api/users", (req, res) => {
  res.send("Get all users");  // Ends response — no next() needed
});

// Route — runs ONLY for POST
app.post("/api/users", (req, res) => {
  res.send("Create a user");
});
```

### TypeScript mapping
```ts
import express, {
  type Express,
  type Request,
  type Response,
} from "express";

const app: Express = express();

// Route handlers are typed
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello");
});

// Route params are typed via ParamsDictionary
app.get("/user/:id", (req: Request, res: Response) => {
  // req.params is Record<string, string> — may be undefined with strict indexing
  const id = req.params.id ?? "unknown";
  res.send(`User: ${id}`);
});

// POST handler
app.post("/api/users", (req: Request, res: Response) => {
  // req.body needs express.json() or express.urlencoded() middleware
  // req.body is typed as 'any' by default — validate manually
  res.json({ received: true });
});
```

### Updated code (your app.ts)
```ts
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";

const app: Express = express();

// Logger middleware — runs for everything
app.use("/", (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Specific route handlers (method-specific)
app.get("/", (_req: Request, res: Response) => {
  res.send("<h1>Home</h1><p>I am a software engineer</p>");
});

app.get("/our-product", (_req: Request, res: Response) => {
  res.send("<h1>Our Product</h1><p>I am a Product manager</p>");
});

app.listen(3000);
```

## Notes & gotchas
- **Use `app.get()`, `app.post()` for routes** — not `app.use()` (which matches all methods)
- **Order matters** — specific routes before parameterized routes (`/user/profile` before `/user/:id`)
- **`res.send()` ends the response** — no need for `res.end()` or `next()` in routes
- **Route params are strings** — parse to number if needed: `parseInt(req.params.id, 10)`
- **Middleware must call `next()`** to continue — forgetting it hangs the request
- **Under strict TypeScript**, `req.params.id` may be `string | undefined` — always null-check with `??` default

---

# Lecture 64: Parsing Incoming Requests

## What I learned
- POST/PUT requests send data in the body — but Node's raw `IncomingMessage` delivers it as a stream of Buffer chunks, never as a ready object.
- Express provides **built-in body-parsing middleware** (`express.json()` and `express.urlencoded()`) that reads the stream, parses it, and populates `req.body`.
- Without body-parsing middleware, `req.body` is `undefined` — you'd have to manually collect chunks like in Section 3.

### The body-parsing middleware
```ts
import express, {
  type Express,
  type Request,
  type Response,
} from "express";

const app: Express = express();

// ✅ Register BEFORE your routes — these populate req.body
app.use(express.json());              // parses application/json
app.use(express.urlencoded({ extended: true }));  // parses application/x-www-form-urlencoded
```

### What Content-Types do
| Content-Type | Middleware | Result |
|---|---|---|
| `application/json` | `express.json()` | `req.body` = parsed JS object |
| `application/x-www-form-urlencoded` | `express.urlencoded()` | `req.body` = parsed key/value object |
| (none/other) | No middleware runs | `req.body` = `undefined` |

### POST route with parsed body
```ts
// Handle form submission (HTML forms send URL-encoded by default)
app.post("/our-product", (req: Request, res: Response) => {
  // req.body is populated by express.urlencoded()
  const name = typeof req.body.name === "string" ? req.body.name : "unknown";
  const price = typeof req.body.price === "string" ? parseFloat(req.body.price) : 0;

  res.send(`
    <h1>Product Received</h1>
    <p>Name: ${name}</p>
    <p>Price: $${price}</p>
  `);
});

// Handle JSON API
app.post("/api/users", (req: Request, res: Response) => {
  // req.body is populated by express.json()
  const name = typeof req.body?.name === "string" ? req.body.name : "unknown";
  const email = typeof req.body?.email === "string" ? req.body.email : "unknown";

  res.json({ message: "User created", user: { name, email } });
});
```

### The `extended` option in `express.urlencoded()`
```ts
// extended: true  → uses `qs` library (handles nested objects)
app.use(express.urlencoded({ extended: true }));
// Can parse: "user[name]=John&user[email]=john@example.com"
// → { user: { name: "John", email: "john@example.com" } }

// extended: false → uses Node's `querystring` module (flat only)
app.use(express.urlencoded({ extended: false }));
// Parses: "name=John&email=john@example.com" → { name: "John", email: "john@example.com" }
```
Use `extended: true` — it's more robust and handles nested data.

### What changed from Section 3 (raw Node.js)?
In Section 3, you manually collected body chunks:
```ts
// Section 3 — manual body parsing
const chunks: Buffer[] = [];
req.on("data", (chunk: Buffer) => chunks.push(chunk));
req.on("end", () => {
  const body = Buffer.concat(chunks).toString("utf-8");
  // Then manually parse based on Content-Type...
});
```

In Express, this is handled by middleware:
```ts
// Section 5 — automatic body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/users", (req, res) => {
  console.log(req.body);  // Already parsed!
});
```

### How to test with curl
```bash
# Test POST with form data
curl -X POST http://localhost:3000/our-product \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=Laptop&price=999"

# Test POST with JSON
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Usama","email":"usama@example.com"}'
```

### Updated code (your app.ts)
```ts
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";

const app: Express = express();

// Body parsing middleware — MUST be before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use("/", (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// GET routes
app.get("/", (_req: Request, res: Response) => {
  res.send(`
    <h1>Home</h1>
    <p>I am a software engineer</p>
    <form method="POST" action="/our-product">
      <input name="name" placeholder="Product name" />
      <input name="price" type="number" placeholder="Price" />
      <button type="submit">Submit</button>
    </form>
  `);
});

app.get("/our-product", (_req: Request, res: Response) => {
  res.send("<h1>Our Product</h1><p>I am a Product manager</p>");
});

// POST route — handles form submissions
app.post("/our-product", (req: Request, res: Response) => {
  const name = typeof req.body.name === "string" ? req.body.name : "unknown";
  const price = typeof req.body.price === "string"
    ? parseFloat(req.body.price)
    : 0;

  res.send(`
    <h1>Product Received</h1>
    <p>Name: ${name}</p>
    <p>Price: $${price}</p>
    <a href="/">Back</a>
  `);
});

app.listen(3000);
```

## TypeScript mapping
```ts
import express, {
  type Express,
  type Request,
  type Response,
} from "express";

const app: Express = express();

// Body-parsing middleware — adds req.body to all requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// req.body type
app.post("/api/data", (req: Request, res: Response) => {
  // TypeScript types req.body as 'any' — you MUST validate at runtime!
  // This is the #1 TS error vs the JS course
  const name = typeof req.body?.name === "string"
    ? req.body.name
    : "unknown";

  // Or cast (less safe but common in tutorials):
  // const { name, email } = req.body as { name: string; email: string };

  res.json({ name });
});
```

- `express.json()` returns `RequestHandler` — typed middleware for parsing JSON
- `express.urlencoded()` returns `RequestHandler` — typed middleware for form data
- **`req.body` is typed as `any`** — TypeScript doesn't know what shape the body will have
- With `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`, `req.body.field` may be `undefined` — always check `typeof` or use `??`

## Notes & gotchas
- **Register body parsers BEFORE routes** — middleware order matters (Lecture 60)
- **`req.body` is `any` by default** — validate types at runtime with `typeof` checks
- **Empty/missing body** — `req.body` will be `{}` (empty object), not `undefined`
- **`Content-Type` must match** — `express.json()` only parses `application/json`; `express.urlencoded()` only parses `application/x-www-form-urlencoded`
- **No body on GET requests** — `req.body` is irrelevant for GET; use `req.query` instead
- **Security** — body parsing exposes `req.body` which is **user-controlled input** — always validate (never trust `any`)
- **Body size limit** — body-parser has a default 100kb limit (configurable via `limit` option)
- **Always call `res.send()` or `res.json()`** — not `res.end()` in routes (res.send handles it)

## What `Router()` returns
`Router()` returns a **Router instance** — a mini Express app with its own:
- Route methods (`.get()`, `.post()`, `.put()`, `.delete()`)
- Middleware methods (`.use()`)
- Its own internal middleware stack

The Router is simultaneously:
1. A **function** `(req, res, next) => void` — valid for `app.use()`
2. An **object** with routing methods — for defining routes

```text
┌─────────────────────────────────────┐
│  const router = Router()            │
│                                     │
│  router = function(req,res,next){   │  ← a function (valid middleware)
│    router.handle(req,res,next)      │
│  }                                  │
│                                     │
│  router.get()  ← mixin             │  ← object with methods
│  router.post() ← mixin             │
│  router.use()  ← mixin             │
│  router.stack  = []                │  ← owns its middleware stack
└─────────────────────────────────────┘
```

---

# Lecture 66: Using Express Router

## What I learned
- As the app grows, `app.ts` becomes unwieldy with many routes.
- `express.Router()` lets you **split routes into separate modules** for separation of concerns.

### The problem
```ts
// app.ts — getting unwieldy
app.get("/", homeHandler);
app.get("/about", aboutHandler);
app.get("/products", productsHandler);
app.post("/products", createProductHandler);
// ... 50 more routes...
```

### The solution: Express Router
```text
app.ts (main entry point)
├── routes/shop.ts     (shop routes)
├── routes/admin.ts    (admin routes)
└── routes/api.ts      (API routes)
```

### Creating a router (`routes/shop.ts`)
```ts
import { Router, type Request, type Response } from "express";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.send("Shop home");
});

router.get("/products", (_req: Request, res: Response) => {
  res.send("Product list");
});

router.get("/products/:id", (req: Request, res: Response) => {
  const productId = req.params.id ?? "unknown";
  res.send(`Product ${productId}`);
});

export default router;
```

### Mounting routers in `app.ts`
```ts
import express, { type Express } from "express";
import shopRouter from "./routes/shop.ts";
import adminRouter from "./routes/admin.ts";

const app: Express = express();

// Mount at base paths
app.use("/shop", shopRouter);    // /shop/* routes
app.use("/admin", adminRouter);  // /admin/* routes

app.listen(3000);
```

Now:
- `GET /shop/products` → matches `router.get("/products")`
- `GET /admin/users` → matches `router.get("/users")`

### TypeScript mapping
```ts
import { Router, type Request, type Response } from "express";

const router = Router();

// Router has same method signatures as Express app
router.get("/", (_req: Request, res: Response) => { ... });
router.post("/", (_req: Request, res: Response) => { ... });
router.use(middleware);

export default router;
```

### Why use Router?
- **Separation of concerns** — shop routes in one file, admin in another
- **Reusability** — same router can be mounted at different paths
- **Maintainability** — easier to find/modify specific routes
- **Team collaboration** — different devs work on different routers

### Notes & gotchas
- Router files typically `export default router`
- Mount with `app.use("/prefix", router)` — prefix prepends to all router routes
- **Middleware before `app.use(router)` still runs first** for all routes in that router
- Router can have its own `.use()` middleware that only applies to its routes

---

# Lecture 67: Adding a 404 Error Page

## What I learned
- When a request doesn't match any route handler, Express falls through to `finalhandler` (internal module) which sends a **default bare 404 response**.
- You can override this with a **custom 404 middleware** placed **after all routes**.

### The 404 fallback middleware
```ts
import express, {
  type Express,
  type Request,
  type Response,
} from "express";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// All your routes FIRST
app.get("/", (_req: Request, res: Response) => {
  res.send("<h1>Home</h1>");
});

app.get("/about", (_req: Request, res: Response) => {
  res.send("<h1>About</h1>");
});

// ✅ 404 fallback — MUST be LAST
app.use((_req: Request, res: Response) => {
  res.status(404).send("<h1>404 - Page Not Found!</h1>");
});

app.listen(3000);
```

### Key points
1. **Must be placed AFTER all routes** — middleware order is critical
2. **Use `app.use()`** (not `app.get()`) — catches all HTTP methods
3. **Don't call `next()`** — this is the final catch-all
4. **Set status code** — `res.status(404)` before sending

### Code review of current `app.ts`

Issues found:

1. **Parameter order swapped in 404 handler:**
```ts
// ❌ Wrong — req and res are swapped
app.use("/",(res:Response,req:Request)=>{ ... })

// ✅ Correct — (req, res) order
app.use((req: Request, res: Response) => {
  res.status(404).send("<h1>Page Not Found 404</h1>");
});
```

2. **Redundant path "/" on 404 handler** — `app.use("/")` is the same as `app.use()` for a catch-all.

3. **Unused `http` import:**
```ts
import http from "node:http";  // ❌ not used anywhere
```

### Issues in `routes/admin.ts`:

1. **Duplicate imports:**
```ts
// ❌ Two imports from express
import express, { type Request, type Response, type NextFunction } from "express";
import { Router } from "express";
```

2. **Unused `NextFunction` in route handlers** — `next` is not called in the handlers.

### Corrected `app.ts`:
```ts
import express, {
  type Express,
  type Request,
  type Response,
} from "express";
import adminRoutes from "./routes/admin.ts";
import shopRoutes from "./routes/shop.ts";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/admin", adminRoutes);
app.use("/shop", shopRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).send("<h1>Page Not Found 404</h1>");
});

app.listen(3000);
```

### TypeScript mapping
```ts
// 404 handler — note: NO next parameter (it's the final handler)
app.use((req: Request, res: Response) => {
  res.status(404).send("...");
});
```

- 404 handler is a `RequestHandler` without `nextFunction` — it's the last resort
- `res.status(404)` sets the status code (typed as `number`)
- `res.send()` accepts `string | Buffer | object`

### Notes & gotchas
- The 404 handler catches **everything unmatched** — place it after all routes
- For **specific** 404s (e.g., only certain paths), use `app.use("/specific-path", ...)`
- You can render an HTML page instead of plain text: `res.status(404).render("404")`
- **Always check route order** — a parameterized route like `/user/:id` will catch `/user/profile` if defined first

---

# Lecture 68: Filtering Paths

## What I learned
- Middleware doesn't have to run for every request — `app.use("/path", middleware)` filters by path prefix.
- This lets you apply middleware **only to specific sections** of your app (e.g., only `/api/*`, only `/admin/*`).
- Path filtering works with both inline middleware and **routers**.

### Path filtering with `app.use()`
```ts
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";

const app: Express = express();

// ✅ Logger ONLY for /api/* paths
app.use("/api", (req: Request, _res: Response, next: NextFunction) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// ✅ Auth ONLY for /admin/* paths
app.use("/admin", (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    res.status(401).send("Unauthorized");
    return;
  }
  next();
});
```

### What gets matched?
```text
app.use("/api", middleware)

Matches:
  ✓ GET /api/users
  ✓ POST /api/users
  ✓ GET /api/users/123
  ✓ DELETE /api/users/123

Does NOT match:
  ✗ GET /
  ✗ GET /about
  ✗ GET /products
```

### Method-specific filtering
```ts
// Only POST /login runs this
app.post("/login", loginValidation);

// Only GET /products runs this
app.get("/products", productsLogger);
```

### Filtering with routers

#### 1. Filter when mounting the router
```ts
// app.ts
app.use("/admin", adminRoutes);  // only /admin/* reaches adminRoutes
app.use("/shop", shopRoutes);    // only /shop/* reaches shopRoutes
app.use("/api", apiRouter);      // only /api/* reaches apiRouter
```

#### 2. Filter inside the router with `router.use()`
```ts
// routes/admin.ts
import { Router, type Request, type Response, type NextFunction } from "express";

const router = Router();

// This middleware only runs for requests that reached this router
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log("Admin request:", req.url);
  next();
});

router.get("/", (_req: Request, res: Response) => {
  res.send("Admin dashboard");
});

export default router;
```

#### 3. Combined — nested path filtering
```ts
// app.ts
app.use("/admin", adminRoutes);       // outer filter

// routes/admin.ts
router.use("/users", usersSubRouter); // inner filter
// Result: /admin/users/* only
```

### Real example with your code structure
```ts
// app.ts
app.use("/admin", adminRoutes);
app.use("/shop", shopRoutes);

// Log only /admin/* requests
app.use("/admin", (req: Request, res: Response, next: NextFunction) => {
  console.log(`[ADMIN] ${req.method} ${req.url}`);
  next();
});

// Log only /shop/* requests
app.use("/shop", (req: Request, res: Response, next: NextFunction) => {
  console.log(`[SHOP] ${req.method} ${req.url}`);
  next();
});
```

### Architecture diagram
```text
/app.ts
├── app.use("/admin", adminRoutes)  ← outer path filter
│   └── routes/admin.ts
│       ├── router.use(logger)      ← inner middleware
│       ├── router.get("/", ...)    ← matches GET /admin
│       └── router.get("/users",...) ← matches GET /admin/users
│
├── app.use("/shop", shopRoutes)    ← outer path filter
│   └── routes/shop.ts
│       ├── router.get("/", ...)    ← matches GET /shop
│       └── router.get("/products",...) ← matches GET /shop/products
│
└── app.use((req, res) => { ... })  ← 404 catch-all
```

### TypeScript mapping
```ts
import { type RequestHandler } from "express";

// Path filtering with app.use(path, middleware)
const apiLogger: RequestHandler = (req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
};

app.use("/api", apiLogger);  // only runs for /api/* paths

// Router-level filtering
const router = Router();

router.use("/users", usersSubRouter);  // only /users/* inside this router
```

### Notes & gotchas
- `app.use("/api", fn)` matches `/api`, `/api/`, `/api/users`, `/api/users/123` — **all sub-paths**
- `app.use("/api/", fn)` also works — trailing slash doesn't affect matching
- For **exact** path matching without sub-paths, use `app.get("/api", fn)` instead
- Path filtering with `app.use()` is about **mounting middleware at a path prefix**, not about route matching
- Middleware order is **global** — `app.use("/api", a)` before `app.use("/api", b)` means `a` runs first
- The 404 handler should be a **bare `app.use((req, res) => { ... })`** without a path to catch everything unmatched

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
