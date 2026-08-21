import type { IncomingMessage, ServerResponse } from "node:http";

interface UserInput {
  name: string;
  email: string;
}

function parseUser(raw: unknown): UserInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.name !== "string" || typeof r.email !== "string") return null;
  return { name: r.name, email: r.email };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", (err: Error) => reject(err));
  });
}

export async function routeRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "", "http://localhost");
  const pathname = url.pathname;

  if (req.method === "GET" && pathname === "/") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<form method="POST" action="/users" enctype="application/x-www-form-urlencoded">
      <input name="name" placeholder="name" />
      <input name="email" placeholder="email" />
      <button>Send</button>
    </form>`);
    return;
  }

  if (req.method === "POST" && pathname === "/users") {
    try {
      const raw = await readBody(req);
      const ct = req.headers["content-type"];

      let user: UserInput | null = null;
      if (ct === "application/json") {
        user = parseUser(JSON.parse(raw));
      } else if (ct === "application/x-www-form-urlencoded") {
        const p = new URLSearchParams(raw);
        user = parseUser({ name: p.get("name"), email: p.get("email") });
      }

      if (!user) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Invalid input");
        return;
      }

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true, user }));
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Invalid body");
    }
    return;
  }

  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("Not found");
}
