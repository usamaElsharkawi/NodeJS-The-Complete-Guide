# NodeJS-The-Complete-Guide

> Learning notes for **"Node.js — The Complete Guide"**.
> Course is JavaScript-first → **everything re-implemented in TypeScript** (strict mode).
> Study workflow reference: [`StudyApproach.md`](./StudyApproach.md)

## 📋 Course Structure

### Section 1 — Introduction
- [x] Lecture 1 — Introduction
- [ ] Lecture 2 — What is Node.js?
- [ ] Lecture 3 — Join our Online Learning Community
- [ ] Lecture 4 — Installing Node.js and Creating our First App
- [ ] Lecture 5 — Understanding the Role & Usage of Node.js
- [ ] Lecture 6 — Course Outline
- [ ] Lecture 7 — How To Get The Most Out Of The Course
- [ ] Lecture 8 — Working with the REPL vs Using Files
- [ ] Lecture 9 — Using the Attached Source Code

### Environment
- Node.js **v24.19.0 LTS** (Krypton) via `nvm` — default → `lts/*`
- TypeScript (strict) + `ts-node` + `@types/node` per section folder
- Run dev: `npx ts-node app.ts` · Build: `npx tsc` → `node dist/app.js`

---

## 📝 Lecture Notes

### Lecture 01 — Introduction
**What the lecture covers:**
- This is the introductory lecture — overview of the course ("Node.js — The Complete Guide"): what it teaches, what you'll build, and prerequisites.
- The course is JS-first; the goal is to build real server-side apps with Node.js.

**Our angle (Boss's requirement):** Map every JS concept to **TypeScript**.
- We re-implement examples as typed `.ts` files using `strict: true`, `noImplicitAny`, `strictNullChecks`.
- The JS `require('module')` pattern → TS `import ... from 'module'` (ES-module style with `esModuleInterop`).
- Plain JS values → explicitly typed where helpful (`const port: number = 3000`).

**Environment we set up for the section:**
- Installed **Node.js v24.19.0 LTS** via `nvm` (`nvm install --lts`, `nvm alias default lts/*`).
- Scaffolded `Section1: Introduction/` with:
  - `package.json` — scripts `start`, `build`, `watch`, `lint`
  - `tsconfig.json` — `strict`, `module: node16`, `moduleResolution: node16`
  - `.gitignore` — ignores `node_modules/`, `dist/`, logs
- First snippet `app.ts`:
```ts
import { version as nodeVersion } from 'node:process';
const banner: string = `🚀 Running on Node.js ${nodeVersion}`;
console.log(banner);
```
  - Verified: `tsc --noEmit` ✅ · `ts-node app.ts` → `🚀 Running on Node.js v24.19.0` ✅
  - This already proves the core idea: **run JS/TS outside the browser using Node's typed APIs.**

**Workflow used (per lecture — enforced by the `study-skill` methodology):**
1. Watch (JS lecture) → 2. Discuss (explain + TS mapping) → 3. Code (TypeScript) →
4. Review (6-point checklist: compiles / runs / types / bugs / best-practices / clean) →
5. On "document it" → APPEND README + commit `Document Lecture XX: [Topic]` → push.

