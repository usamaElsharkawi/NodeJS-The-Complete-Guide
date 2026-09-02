import { Router } from "express";

const router = Router();

// All shop routes prefixed with /shop
router.get("/", (req, res) => {
  res.send("Shop home");
});

router.get("/products", (req, res) => {
  res.send("Product list");
});

router.get("/products/:id", (req, res) => {
  res.send(`Product ${req.params.id}`);
});

export default router;
