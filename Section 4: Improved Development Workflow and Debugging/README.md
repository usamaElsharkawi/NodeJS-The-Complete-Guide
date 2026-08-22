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

> Lecture content will be appended here after the learner provides their explanation.

---

# Lecture 45: Using Nodemon for Autorestarts

> Lecture content will be appended here after the learner provides their explanation.

---

# Lecture 46: Global & Local npm Packages

> Lecture content will be appended here after the learner provides their explanation.

---

# Lecture 47: Understanding different Error Types

> Lecture content will be appended here after the learner provides their explanation.

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
