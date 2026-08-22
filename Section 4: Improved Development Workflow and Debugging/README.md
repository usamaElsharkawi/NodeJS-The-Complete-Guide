# Section 4: Improved Development Workflow and Debugging

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
  "name": "nodejs-complete-guide-section4",
  "type": "module",
  "scripts": {
    "start": "node app.ts",
    "dev": "node --watch app.ts",
    "lint": "tsc --noEmit"
  }
}
```

---

# Lecture 41: Module Introduction

> Lecture content will be appended here after the learner provides their explanation.

---

# Lecture 42: Understanding NPM Scripts

## What I learned
- **NPM scripts** are command shortcuts stored in `package.json` under the `"scripts"` key.
  They let you avoid memorizing long terminal commands and keep project workflows consistent.
- **Running scripts:**
  - `npm run <script-name>` executes any named script.
  - `npm start` is a shortcut for `npm run start` (no `run` needed).
  - `npm test` is a shortcut for `npm run test`.
  - `npm run` (no script name) prints all available scripts.
- **Shell execution:** npm runs scripts inside a **shell** (`/bin/sh` on Unix, `cmd.exe` on Windows).
  This means shell features like pipes (`|`), redirection (`>`), and variable expansion work inside scripts.
- **PATH injection:** npm automatically prepends `node_modules/.bin` to the `PATH` for scripts.
  This is why you can run locally installed tools (e.g. `tsc`, `nodemon`) directly by name
  instead of `npx tsc` or `./node_modules/.bin/tsc`.
- **Lifecycle hooks:** npm supports **pre** and **post** hooks for every script:
  - `prestart` → `start` → `poststart`
  - `predev` → `dev` → `postdev`
  - `prelint` → `lint` → `postlint`
  These run automatically in order. A failing `pre` script prevents the main script from running.
- **Passing arguments:** use `--` to forward args to the underlying command:
  - `npm run start -- --port 4000` → Node receives `--port 4000`
  - `npm run lint -- --strict` → tsc receives `--strict`
- **Exit codes:** the script's exit code becomes npm's exit code. If the command exits with `0`,
  npm prints success; any non-zero code marks the script as **failed** (critical for CI).
- **Concurrency:** by default npm runs scripts **serially**. The `&` suffix runs a script in the
  background (e.g. `"watch": "tsc --watch &"`). npm v7+ also supports `npm-run-all` for parallel
  execution, but the course uses simple built-in syntax.

### The lifecycle flow

```text
  npm run dev
       │
       ▼
  ┌─────────────┐
  │  predev     │  (if defined)
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │   dev       │  ← your main command
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  postdev    │  (if defined)
  └─────────────┘
```

- If `predev` fails, `dev` never runs and npm exits with the `predev` error code.
- Hooks are optional — omit them when you don't need pre/post steps.

## TypeScript mapping
- **Scripts are shell commands, not TypeScript.** The TS type system does not validate script values
  (they are plain strings in `package.json`).
- **The type-checking boundary:** `tsc --noEmit` runs *inside* an npm script but is a **separate
  process**. It reads `tsconfig.json`, type-checks your `.ts` files, and exits — it does not execute
  them. Node then runs the compiled (or in our case, type-stripped) code.
- **ESM + scripts:** `"type": "module"` in `package.json` affects Node's module resolution, not npm
  scripts themselves. The script `"node app.ts"` works identically whether `"type": "module"` is set
  or not — `node` decides ESM/CJS based on `package.json`, extension, and `--input-type`.
- **`import type` safety applies to source files, not scripts.** The TypeScript compiler enforces
  `verbatimModuleSyntax` and `erasableSyntaxOnly` in `.ts` files; `package.json` scripts remain
  free-form strings.
- **Native TS workflow:** because Node 24 strips types natively, our `start` script is simply
  `"node app.ts"`. No build step, no `tsc --outDir`, no `ts-node`. `tsc --noEmit` is a *separate*
  quality gate run via `"lint"`.

## Notes & gotchas
- **`npm start` ≠ `npm run start`** syntactically, but they are functionally identical for the
  `start` script only. For every other script name, you **must** use `npm run <name>`.
- **Scripts run from the project root.** `node app.ts` in a script resolves relative to `package.json`,
  not the terminal's current working directory.
- **`node_modules/.bin` is magic.** Tools installed locally (e.g. `typescript`, `nodemon`) are
  symlinked there. npm adds this folder to `PATH` automatically — so `tsc` works in scripts even
  though it's not a global install.
- **Don't commit `node_modules/`.** It is regenerated by `npm install` from `package.json` +
  `package-lock.json`. Our `.gitignore` excludes it.
- **`npm run` without arguments lists scripts** sorted alphabetically, with the `start` / `test`
  shortcuts flagged. Useful for onboarding.
- **`--` forwarding is easy to forget.** `npm run start --port 4000` does **not** work — npm eats
  `--port` as its own flag. You must write `npm run start -- --port 4000`.
- **Pre hooks are the right place for setup** (e.g. `prelint`: `tsc --noEmit` then `eslint .`),
  and post hooks for teardown/notification. Overusing them obscures the actual script purpose.
- **`npm run` inherits the current shell environment.** `PORT=3000 npm run start` sets `process.env.PORT`
  in Node — but this syntax is Unix-only. For cross-platform env vars, use `cross-env`:
  `"start": "cross-env PORT=3000 node app.ts"`.
- **`npm run` prints `> project@version <script-name>`** before the command output — purely cosmetic
  but helps identify which script produced which output in logs.
- **Scripts are NOT tasks.** npm has no built-in task runner features (parallel, conditional, etc.).
  For complex orchestration, use `npm-run-all`, `concurrently`, or a dedicated task runner.
  The course keeps it simple with sequential shell commands.

---

# Lecture 43: Installing 3rd Party Packages

## What I learned
- **npm install** fetches external packages from the npm registry and adds them to `node_modules/`.
- **`dependencies`** — packages your app needs at runtime (e.g. a web framework, utility library).
- **`devDependencies`** — packages needed only for development (e.g. `typescript`, `@types/node`, `nodemon`).
- **`npm install <package>`** → adds to `dependencies`.
- **`npm install -D <package>`** or **`npm install --save-dev <package>`** → adds to `devDependencies`.
- **`package.json`** is the manifest: it lists every package your project needs.
- **`package-lock.json`** locks exact versions of every dependency and their sub-dependencies.
  Commit it so installs are reproducible across machines.
- **Local binaries** are symlinked into `node_modules/.bin` — npm injects this folder into `PATH`
  automatically when running scripts, so locally installed tools work by name (e.g. `tsc`, `nodemon`).

### The install flow

```text
  npm install lodash
       │
       ▼
  ┌─────────────────┐
  │  Read package.json  │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Download lodash  │
  │  + its sub-deps  │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Write node_modules/ │
  │  Update package-lock.json │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Symlink binaries │
  │  into node_modules/.bin │
  └─────────────────┘
```

## TypeScript mapping
- **`@types/node`** is a **devDependency** — it provides type definitions for Node's built-in modules.
  Our `tsconfig.json` includes `"types": ["node"]` so these types are available globally.
- **Third-party types:** many packages ship their own types. If they don't, install `@types/<package>`
  as a dev dependency (e.g. `npm install -D @types/lodash`).
- **`import` syntax for third-party code:** with ESM + `verbatimModuleSyntax`, import runtime values
  normally (`import _ from "lodash"`). Use `import type` only for type-only imports.
- **`tsc --noEmit` validates types against installed packages** — if a package's types don't match
  how you use it, `lint` catches it before runtime.
- **`node app.ts` runs natively** — npm installed the package into `node_modules/`, and Node resolves
  it at runtime. TypeScript types are stripped; only the JS code executes.

## Notes & gotchas
- **Don't commit `node_modules/`** — it is regenerated by `npm install` from `package.json` +
  `package-lock.json`. Our `.gitignore` excludes it.
- **Always commit `package-lock.json`** — without it, installs may resolve to different versions,
  causing "works on my machine" bugs.
- **`npm install` on a server** — use `npm install --production` to skip `devDependencies` in
  production environments.
- **Global vs local:** `npm install -g <pkg>` installs globally (not listed in `package.json`).
  For project code, always use local installs.
- **Manually editing `node_modules/`** — never do this. It is regenerated on every `npm install`.
- **Peer dependencies** — some packages expect you to provide a dependency yourself (e.g. a plugin
  expecting a specific React version). npm warns about unmet peers; resolve them by installing the
  required version.
- **`node_modules/.bin` is only auto-injected in npm scripts.** In your regular terminal, you must
  use `npx <tool>` or the full path `./node_modules/.bin/<tool>`.
- **`npm ci`** — for CI/production, use `npm ci` instead of `npm install`. It installs exactly what
  `package-lock.json` specifies, failing fast if the lockfile is out of sync. Faster and more
  deterministic.

---

# Lecture 44: Global Features vs Core Modules vs Third-Party Modules

## What I learned
- Node.js features fall into **three categories** based on availability and how you access them:
  1. **Global features** — always available, no import needed.
  2. **Core Node.js modules** — built into Node, no install needed, but must be imported.
  3. **Third-party modules** — not built in, must be installed via npm AND imported.

### Global features
- **Keywords:** `const`, `let`, `function`, `if`, `for` — these are JavaScript language features, not Node-specific.
- **Global objects:** `process`, `console`, `setTimeout`, `setInterval`, `Buffer` — available everywhere without an import statement.
- In TypeScript, these are typed via `@types/node` (included by `"types": ["node"]` in `tsconfig.json`).
- Example: `process.cwd()` works without any import — `process` is globally typed as `NodeJS.Process`.

### Core Node.js modules
- Built into Node.js runtime: `fs` (file system), `path` (path utilities), `http` (HTTP server/client), `crypto`, `events`, etc.
- **No `npm install` required** — they ship with Node.
- **Must be imported** to use them.
- In our TypeScript + ESM setup, use the **`node:` protocol** for clarity:
  ```ts
  import fs from "node:fs";
  import path from "node:path";
  import http from "node:http";
  ```
- Types come from `@types/node` (already installed).

### Third-party modules
- Code written by the community, published to the npm registry.
- **Must be installed:** `npm install <package>` (runtime) or `npm install -D <package>` (dev-only).
- **Must be imported** after installation.
- Example workflow:
  ```bash
  npm install express
  ```
  ```ts
  import express from "express";
  ```
- Types may come from:
  - The package itself (modern packages ship types).
  - A separate `@types/<package>` package (install with `npm install -D @types/<package>`).
  - Or you may need to write ambient declarations for untyped packages.

### Comparison table

```text
  ┌─────────────────────┬──────────────┬──────────────┬──────────────────┐
  │ Category            │ Install?     │ Import?      │ Type source      │
  ├─────────────────────┼──────────────┼──────────────┼──────────────────┤
  │ Global (JS/Node)    │ No           │ No           │ @types/node      │
  │ Core Node.js module │ No           │ Yes          │ @types/node      │
  │ Third-party module  │ Yes (npm)    │ Yes          │ pkg / @types/pkg │
  └─────────────────────┴──────────────┴──────────────┴──────────────────┘
```

## TypeScript mapping
- **Global objects:** `process`, `console`, `Buffer` are globally typed. You reference them directly.
  TypeScript knows their types because `"types": ["node"]` in `tsconfig.json` pulls in `@types/node`.
- **Core modules:** use `import` with the `node:` prefix (recommended in modern Node):
  ```ts
  import fs from "node:fs";
  import type { IncomingMessage, ServerResponse } from "node:http";
  ```
  The `node:` prefix disambiguates core modules from third-party packages of the same name.
- **`verbatimModuleSyntax` enforcement:** with this flag on, you cannot use `require()` — ESM `import` is mandatory.
  The learner's example used `const fs = require('fs')` — that is **CJS syntax** and will not compile under our config.
- **`import type` for type-only imports:** when you need only types from a module (e.g. `IncomingMessage`),
  use `import type { ... }` to ensure no runtime import side-effects:
  ```ts
  import type { IncomingMessage, ServerResponse } from "node:http";
  ```
- **Third-party types:** if a package ships its own types (has a `.d.ts` file or `"types"` field in its `package.json`),
  TypeScript picks them up automatically. If not, install `@types/<package>` as a dev dependency.
- **No `enum` / `const enum`:** with `erasableSyntaxOnly`, use `const` objects or `union` types instead.
- **No implicit `any`:** `strict: true` ensures every imported value has a known type — if a third-party
  package lacks types and you didn't install `@types/...`, TypeScript errors rather than silently falling back to `any`.

## Notes & gotchas
- **`require()` is forbidden** in our ESM + `verbatimModuleSyntax` setup. Always use `import`.
- **Core modules do NOT need `npm install`.** If you see `npm install fs`, that is wrong — `fs` is built in.
- **The `node:` prefix is best practice** for core modules (e.g. `"node:fs"` vs `"fs"`). It makes intent
  explicit and prevents shadowing by a third-party package named `fs`.
- **Global objects are not imported but are typed.** `process` works without an import statement, but
  TypeScript still knows its type via `@types/node`. Removing `"types": ["node"]` from `tsconfig.json`
  would make `process` implicitly `any`.
- **Third-party packages without types:** if you `npm install` a package and TypeScript complains
  `Cannot find module 'pkg'` or `Could not find a declaration file`, install `@types/pkg` or add
  a `declare module` ambient declaration.
- **`node_modules/` is local.** Third-party packages are installed per-project. Another project on
  your machine needs its own `npm install` — global installs (`-g`) are for CLI tools, not app code.

---

# Lecture 45: Using Nodemon for Autorestarts

## What I learned
- **Nodemon** is a CLI tool that watches your project files and automatically restarts the Node
  process when a change is detected. It removes the manual `CTRL+C` → `npm start` loop from
  development.
- **Install as devDependency:**
  ```bash
  npm install -D nodemon
  ```
- **Use via npm script** (preferred) or `npx nodemon`:
  ```json
  "scripts": {
    "start": "node app.ts",
    "dev": "nodemon app.ts"
  }
  ```
- **How it works:** Nodemon spawns your Node process as a child. When a watched file changes,
  it kills the child and spawns a fresh one, piping stdout/stderr so you still see output.
- **Default watched extensions:** `.js`, `.mjs`, `.json`, `.node`. For TypeScript projects, tell
  Nodemon to watch `.ts` files via `nodemon.json` or rely on Node 24 native `.ts` support.

### Nodemon lifecycle

```text
  Developer edits app.ts
           │
           ▼
  ┌─────────────────┐
  │  Nodemon detects  │
  │  file change      │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Kill old Node   │
  │  process         │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Spawn new Node  │
  │  (node app.ts)   │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Pipe output to  │
  │  terminal        │
  └─────────────────┘
```

### nodemon.json (TypeScript project)

```json
{
  "watch": ["*.ts"],
  "ext": "ts",
  "ignore": ["node_modules/"],
  "exec": "node app.ts"
}
```

- `watch` — glob patterns to monitor.
- `ext` — file extensions that trigger a restart.
- `ignore` — paths to exclude (defaults already include `node_modules/`).
- `exec` — the command to run on restart. On Node 24, `node app.ts` works natively.

## TypeScript mapping
- **Nodemon does not type-check.** It only restarts the process. `tsc --noEmit` (`npm run lint`)
  is still the separate quality gate that catches type errors before runtime.
- **Native TS execution on Node 24:** `nodemon app.ts` passes `.ts` directly to Node, which strips
  types at runtime. No `ts-node`, no `tsx`, no build step required.
- **The dev workflow split:**
  - `npm run lint` → `tsc --noEmit` → type-check only, no execution.
  - `npm run dev` → `nodemon app.ts` → executes, auto-restarts on change, but does not type-check.
- **`import type` still enforced.** Even though Nodemon is restarting the process, the TypeScript
  compiler (`tsc`) still enforces `verbatimModuleSyntax` and `erasableSyntaxOnly` during `lint`.
- **No type definitions needed for Nodemon itself** when used purely as a CLI tool via npm scripts.
  You never `import nodemon` in code, so `@types/nodemon` is unnecessary for our usage pattern.

## Notes & gotchas
- **Install as devDependency only.** `npm install -D nodemon` — never add it to `dependencies`.
- **`npm start` vs `npm run dev`:** `start` runs `node app.ts` (no watcher). `dev` runs
  `nodemon app.ts` (watches + restarts). Don't accidentally use `dev` in production.
- **Nodemon forwards `SIGINT`.** `CTRL+C` kills the child Node process and then Nodemon itself exits
  — graceful shutdown handlers from Lecture 28 still fire.
- **Infinite restart loops:** if the restart itself changes a watched file (e.g. a logger writing to
  a watched log file), Nodemon can loop. Use `ignore` in `nodemon.json` to exclude generated files.
- **`node --watch` vs Nodemon:** Node 24 has a built-in `--watch` flag (`node --watch app.ts`).
  It restarts on file changes without any external dependency. Nodemon offers more configuration
  and broader compatibility across Node versions. Both are valid; the course teaches Nodemon.
- **Don't run `tsc --watch` + Nodemon together** unless you understand the interaction. `tsc --watch`
  only type-checks; it doesn't execute. Nodemon executes but doesn't type-check. Running both in
  parallel can be confusing — prefer `npm run lint` manually, then `npm run dev` for the edit loop.
- **Nodemon is not a debugger.** It restarts the process, but it doesn't attach a debugger or let
  you inspect state. Lectures 51–54 cover actual debugging.
- **`nodemon.json` is optional.** Without it, Nodemon uses sensible defaults. Add it only when you
  need to customize watch patterns, the exec command, or delay.

---

# Lecture 46: Global & Local npm Packages

## What I learned
- **Local packages** are installed into your project's `node_modules/` folder and listed in
  `package.json` (`dependencies` or `devDependencies`). They are **only available inside that project**.
- **Global packages** are installed with `npm install -g <package>` into a central machine-wide folder.
  Their binaries are symlinked into a global `PATH` location, making them available **everywhere** in
  any terminal, in any project.
- **The sharing advantage of local packages:** you can share your project source code without
  `node_modules/`. Anyone cloning the repo runs `npm install`, npm rebuilds the exact
  `node_modules/` tree from `package.json` + `package-lock.json`. This keeps shared repos small —
  just source code, not megabytes of installed packages.
- **Course code snippets are shared this way** — you extract the code, run `npm install`, and all
  dependencies are restored.
- **Why `nodemon app.ts` failed in a random terminal:** because that terminal was in a folder without
  a local Nodemon install. Locally installed tools are only available via `node_modules/.bin/` within
  the project — npm injects that path automatically for scripts, but not for manual terminal commands.
- **Global install is possible but not required for project tools:**
  ```bash
  npm install -g nodemon
  ```
  The `-g` flag installs the package globally, making `nodemon` available anywhere. But this is
  **not recommended for project-specific tools** because it breaks reproducibility.

### Local vs Global — side by side

```text
  Local (recommended for project tools):
  ┌─────────────────────────────────────────┐
  │  my-project/                            │
  │  ├── package.json  ← lists nodemon      │
  │  ├── node_modules/                      │
  │  │   └── nodemon/                       │
  │  └── app.ts                             │
  │                                          │
  │  Run: npm run dev                       │
  │  → npm finds node_modules/.bin/nodemon  │
  │  → nodemon runs, watches .ts files       │
  └─────────────────────────────────────────┘

  Global (for personal CLI tools):
  ┌─────────────────────────────────────────┐
  │  /usr/local/lib/node_modules/           │
  │  └── nodemon/                           │
  │                                          │
  │  /usr/local/bin/                        │
  │  └── nodemon → symlink                  │
  │                                          │
  │  Run anywhere: nodemon app.ts           │
  │  → OS finds /usr/local/bin/nodemon      │
  └─────────────────────────────────────────┘
```

## TypeScript mapping
- **Local packages are typed per-project.** Types are resolved from that project's `node_modules/`.
  If a package ships its own types, TypeScript picks them up automatically. If not, install
  `@types/<package>` as a local dev dependency.
- **Global packages are invisible to TypeScript.** If you install `nodemon` globally, your project's
  `tsc` knows nothing about it — but this is fine because you never `import nodemon` in source code.
  It is purely a CLI invocation.
- **`node_modules/.bin` is project-local.** When npm runs a script, it prepends **that project's**
  `node_modules/.bin` to `PATH`. A global Nodemon could shadow the local one, causing version
  mismatches between collaborators.
- **Reproducibility is a type-safety concern.** If a global package version differs between machines,
  runtime behavior can diverge. Local installs + `package-lock.json` pin exact versions for everyone.
- **`tsc --noEmit` only sees local types.** It type-checks against the `node_modules/` in the current
  project. Global packages do not affect type-checking.

## Notes & gotchas
- **Always install project tools locally.** `npm install -D nodemon` ensures collaborators get the
  same version via `npm install`. Never rely on a global install for project-specific tools.
- **Global installs don't touch `package.json`.** If you `npm install -g nodemon`, your project's
  `package.json` still lacks it. A teammate cloning your repo won't get Nodemon.
- **Version drift is real.** Global packages update independently per machine. `nodemon` v3 on your
  machine, v2 on a teammate's — bugs become hard to reproduce. Local + lockfile prevents this.
- **`npx` bridges local/global.** `npx nodemon app.ts` runs the **local** Nodemon without needing
  a global install or an npm script. It checks `node_modules/.bin/` first, then falls back to global.
- **Global bin and PATH issues.** On some systems, the global npm bin folder isn't in `PATH` by default.
  If `npm install -g nodemon` succeeds but `nodemon` says "command not found", add the global bin
  directory to your shell's `PATH`.
- **Don't mix scopes carelessly.** Using a global package when a local one is expected can mask
  version mismatches. Stick to local installs for anything your code or scripts depend on.

---

# Lecture 47: Understanding different Error Types

## What I learned
- Node.js errors fall into **three categories** based on *when* they surface and *how* you detect them.
  The category determines your debugging strategy: compiler, runtime guard, or debugger.
- **Syntax errors** — caught before execution. The parser/compiler rejects invalid grammar.
- **Runtime errors** — caught during execution. Valid syntax, but an invalid operation occurs while running.
- **Logical errors** — never caught by the runtime. The code runs, but produces the wrong result.

### The three categories

| Error Type | When caught | How to detect | Fix strategy |
|---|---|---|---|
| **Syntax** | Before execution (parser / `tsc`) | Compiler error message | Read message, fix grammar |
| **Runtime** | During execution (process crashes) | Stack trace, error event | `try/catch`, guards, error handlers |
| **Logical** | After execution (wrong result) | No error — silent wrong output | Debugger, logging, tests, code review |

### 1. Syntax errors
- **Definition:** code violates the language grammar — missing bracket, misspelled keyword, invalid statement structure.
- **Outcome:** the file **never runs**. Node refuses to execute it. `tsc` refuses to compile it.
- **Example (TypeScript context):**
  ```ts
  // Missing closing brace — syntax error
  function broken() {
    console.log("hi");
  // parser/compiler throws before any code runs
  ```
  ```ts
  // `require()` with `verbatimModuleSyntax` — syntax/type error
  import fs from "node:fs";
  const data = require("fs"); // TS / ESM parse error
  ```
- **Fix speed:** usually fast. The error message points to the line and often describes the expected token.

### 2. Runtime errors
- **Definition:** the syntax is valid, but an operation fails during execution. `JSON.parse` on malformed input, reading a file that doesn't exist, dividing by zero, accessing a property on `null`.
- **Outcome:** the process **crashes** unless caught. Node throws an exception and, if uncaught, exits with code `1`.
- **Example:**
  ```ts
  // Syntax is fine — but at runtime, `req.url` might be `undefined`
  const url = new URL(req.url, "http://localhost"); // throws if `req.url` is undefined
  ```
  ```ts
  // `JSON.parse` throws on bad input
  const data = JSON.parse("not-json"); // runtime SyntaxError
  ```
- **Fix strategy:** defensive coding (`try/catch`, null checks, type guards) + global error handlers
  (`process.on('uncaughtException', ...)`).

### 3. Logical errors
- **Definition:** the code runs without crashing, but produces **wrong results**. Wrong comparison, off-by-one, wrong status code, querying the wrong field.
- **Outcome:** no error message. The process stays alive. The client gets a response — but it's incorrect.
- **Example:**
  ```ts
  // Runs fine, but sends the wrong status code
  res.statusCode = 200; // should be 201 for "created"
  res.end("User created");
  ```
  ```ts
  // Logic bug: checks pathname but ignores method
  if (pathname === "/users") {
    // Handles GET, POST, DELETE all the same
    // But GET /users should list, POST /users should create
  }
  ```
- **Fix strategy:** the hardest category. Requires debugging (Lectures 51–54), logging, tests, or code review.

### Decision tree

```text
  Does the code run?
       │
       ├─ NO → Syntax error
       │        → Fix: read compiler/parser message, correct grammar
       │
       └─ YES → Does it crash?
                │
                ├─ YES → Runtime error
                │        → Fix: try/catch, guards, error handlers
                │
                └─ NO → Is the result wrong?
                         │
                         ├─ YES → Logical error
                         │        → Fix: debugger, logging, tests
                         │
                         └─ NO → Correct! (or a test is missing)
```

## TypeScript mapping
- **Syntax errors → `tsc --noEmit` catches them first.** With `strict: true`, `erasableSyntaxOnly`,
  `verbatimModuleSyntax`, the compiler rejects invalid syntax *before* Node ever runs the code.
  This is our first line of defense (the `lint` script).
- **Runtime errors → TypeScript reduces but cannot eliminate them.** `strictNullChecks` +
  `exactOptionalPropertyTypes` force you to handle `undefined`/`null`, preventing a whole class of
  runtime crashes. But `JSON.parse` can still throw, files can still be missing, network calls can
  still fail — these require runtime guards (`try/catch`, `if` checks).
- **Logical errors → TypeScript is blind to these.** The type system ensures you're using values
  *correctly* according to their types, but it cannot verify you're using the *right* values for your
  business logic. `res.statusCode = 200` is perfectly typed — it's just semantically wrong if the
  spec says `201`. Debugging (Lectures 51–54) is the tool for this.
- **Native TS execution on Node 24:** Node's parser catches *syntax* errors at startup. But Node does
  **not** type-check — that's still `tsc`'s job. And it certainly doesn't catch logical errors.
- **`any` is a syntax-level escape hatch.** When you cast to `any` to silence TypeScript, you're opting
  out of the syntax-error safety net — and you may introduce runtime errors that TS would have caught.

## Notes & gotchas
- **Syntax errors are the easiest** — the compiler tells you exactly what and where. Don't ignore the
  red squiggles in your editor or the `tsc` output.
- **Runtime errors in production need handlers.** `process.on('uncaughtException', ...)` and
  `process.on('unhandledRejection', ...)` prevent silent crashes and let you log state before exiting.
  (Ties back to Lecture 28 graceful shutdown.)
- **Logical errors are silent killers.** The server runs, tests pass, but users get wrong data. They
  often stem from misunderstood requirements or copied code that almost fits.
- **TypeScript shifts the curve:** with strict mode, many former runtime errors become syntax/type errors
  caught at compile time. But the remaining runtime + all logical errors still need traditional
  debugging skills.
- **The debugger (Lectures 51–54) is primarily a logical-error tool.** Syntax errors don't need a
  debugger — the compiler already found them. Runtime errors often need guards more than stepping
  through code. Logical errors are where breakpoints and watch expressions shine.
- **`tsc --noEmit` is your syntax-error gate.** Run it before every `npm start`. If it passes, you know
  your code is syntactically valid and type-safe — the remaining failure modes are runtime and logical.

---

# Lecture 48: Finding & Fixing Syntax Errors

> Lecture content will be appended here after the learner provides their explanation.

---

# Lecture 49: Dealing with Runtime Errors

> Lecture content will be appended here after the learner provides their explanation.

---

# Lecture 50: Logical Errors

> Lecture content will be appended here after the learner provides their explanation.

---

# Lecture 51: Using the Debugger

> Lecture content will be appended here after the learner provides their explanation.

---

# Lecture 52: Restarting the Debugger Automatically After Editing our App

> Lecture content will be appended here after the learner provides their explanation.

---

# Lecture 53: Debugging Node.js in Visual Studio Code

> Lecture content will be appended here after the learner provides their explanation.

---

# Lecture 54: Changing Variables in the Debug Console

> Lecture content will be appended here after the learner provides their explanation.

---

# Lecture 55: Wrap Up

> Lecture content will be appended here after the learner provides their explanation.

---

# Lecture 56: Useful Resources & Links

> Lecture content will be appended here after the learner provides their explanation.
