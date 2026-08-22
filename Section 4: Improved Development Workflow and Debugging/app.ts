import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";

const PORT = Number(process.env.PORT ?? "3000");

const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(`Section 4 — Improved Development Workflow and Debugging (port ${PORT})`);
});

server.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
