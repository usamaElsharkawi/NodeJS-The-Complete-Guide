import express from "express";
import {
  getProducts,
  getProduct,
  getIndex,
  getCart,
  getOrders,
  getCheckout,
} from "../controller/shop.ts";

const router = express.Router();

router.get("/", getIndex);
router.get("/products", getProducts);
router.get("/products/:productId", getProduct);
router.get("/cart", getCart);
router.get("/orders", getOrders);
router.get("/checkout", getCheckout);

export default router;
