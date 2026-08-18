// Section 1: Introduction — Starter app
// Boss: This file will grow as we complete each lecture.

// --- Lecture 1: Introduction ---
// Core concept: In TypeScript, every value has a type we can reason about.
// This replaces JS's `require('http')` with typed ES-module-style imports.

import { version as nodeVersion } from 'process';

const nodeRuntime: string = `Node.js ${nodeVersion}`;
console.log(`🚀 Running on ${nodeRuntime}`);
