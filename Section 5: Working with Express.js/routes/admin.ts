import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { Router } from "express"



 const router = Router();

router.get(
  "/add-product",
  (req: Request, res: Response, next: NextFunction) => {
    console.log("add product route");
    res.send(`
        <form action="/product" method="post">
        <input type=text name= "title">
        <button type="submit">Add Product</button>
        </form>
        `);
  },
);

router.post("/product", (req: Request, res: Response, next: NextFunction) => {
  console.log(req.body);
  res.redirect("/");
});


export default router;