import express from "express";
import { getAddProduct, postAddProduct } from "../controller/products.ts";

const router = express.Router();

router.get("/add-product", getAddProduct);

router.post("/add-product", postAddProduct);

export const routes = router;
