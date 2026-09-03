import express from "express";
import { getAddProduct, postAddProduct, getProducts } from "../controller/admin.ts";

const router = express.Router();

router.get("/add-product", getAddProduct);
router.get("/products", getProducts);
router.post("/add-product", postAddProduct);

export const routes = router;
