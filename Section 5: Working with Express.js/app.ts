import http from "node:http";

import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";

const app: Express = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log("in the first middleware");
  next()
});

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log("in the second middleware");
  
});

const server = http.createServer(app);

server.listen(3000);
