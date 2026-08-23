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
