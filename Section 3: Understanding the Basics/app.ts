import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { routeRequest } from "./routes.ts";

const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  void routeRequest(req, res);
});

server.listen(3000, () => console.log("Server on http://localhost:3000"));
