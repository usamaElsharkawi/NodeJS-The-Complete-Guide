# NodeJS-The-Complete-Guide

> Learning notes for **"Node.js — The Complete Guide"** (JavaScript course).
> Every concept is re-implemented in **TypeScript** (strict mode) — see the `BOSS = JS → TS` mapping.
> Study methodology: [`StudyApproach.md`](./StudyApproach.md) · active skill agent: `study-skill`.

## 📚 Course Structure

> Detailed per-lecture notes live in each section's own `README.md`. This root file is the overview.

### Section 1 — Introduction (9 lectures)
- [x] Lecture 1 — Introduction
- [x] Lecture 2 — What is Node.js?
- [ ] Lecture 3 — Join our Online Learning Community
- [ ] Lecture 4 — Installing Node.js and Creating our First App
- [ ] Lecture 5 — Understanding the Role & Usage of Node.js
- [ ] Lecture 6 — Course Outline
- [ ] Lecture 7 — How To Get The Most Out Of The Course
- [ ] Lecture 8 — Working with the REPL vs Using Files
- [ ] Lecture 9 — Using the Attached Source Code

*(More sections will be added as the course is covered.)*

## 🌍 Environment
- **Node.js v24.19.0 LTS** (Krypton) — via `nvm`, default → `lts/*` (auto-loads in new terminals)
- TypeScript (strict) + `ts-node` + `@types/node`
- Run dev: `npx ts-node <file>.ts` · Build: `npx tsc` → `node dist/<file>.js`

## 🔁 Per-lecture workflow
1. **Watch** (JS lecture)
2. **Discuss** — you explain; I deepen/clarify with **JS → TypeScript** mapping
3. **Code** — you write TypeScript
4. **Review** — I run the 6-point checklist (compiles / runs / types / bugs / best-practices / clean)
5. **"document it"** → I APPEND notes to the section `README.md`, commit `Document Lecture XX: [Topic]`, push

## 📂 Sections
- [Section 1: Introduction](Section1%3A%20Introduction/README.md) — environment setup, "What is Node.js?", V8 + libuv + JIT, first TS app
