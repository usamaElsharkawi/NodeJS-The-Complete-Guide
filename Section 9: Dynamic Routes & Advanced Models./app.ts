import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { routes as adminRoutes } from "./routes/admin.ts";
import shopRoutes from "./routes/shop.ts";
import { pageNotFound } from "./controller/error.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(pageNotFound);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
