import { type Request, type Response, type NextFunction } from "express";
import { Product } from "../models/product.ts";

export const getAddProduct = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.render("add-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    formsCSS: true,
    productCSS: true,
    activeAddProduct: true,
  });
};

export const postAddProduct = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const title = typeof req.body.title === "string" ? req.body.title : "";
  const newProduct = new Product(title);
  newProduct.save();
  res.redirect("/");
};

export const getProducts = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const products = Product.getAll();
  res.render("shop", {
    prods: products,
    pageTitle: "Shop",
    path: "/",
    hasProducts: products.length > 0,
    activeShop: true,
    productCSS: true,
  });
};
