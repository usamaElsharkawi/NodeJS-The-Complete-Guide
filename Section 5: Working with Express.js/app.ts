import http from "node:http";
import adminRoutes from "./routes/admin.ts";
import shopRoutes from "./routes/shop.ts";
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";

const app: Express = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/admin", adminRoutes);
app.use("/shop",shopRoutes);

app.use("/",(req:Request,res:Response)=>{
  res.status(404).send("<h1>Page Not Found 404</h1>")
})

app.listen(3000);


   