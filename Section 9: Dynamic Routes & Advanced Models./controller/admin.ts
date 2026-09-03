import { type Request, type Response } from "express";
import { Product } from "../models/product.ts";

export const getAddProduct = (req: Request, res: Response) => {
  res.render("admin/add-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    formsCSS: true,
    productCSS: true,
    activeAddProduct: true,
  });
};

export const postAddProduct = (req: Request, res: Response) => {
  const title = req.body.title as string;
  const imageUrl = req.body.imageUrl as string;
  const price = req.body.price as string;
  const description = req.body.description as string;
  const product = new Product(title, imageUrl, description, price);
  product.save();
  res.redirect("/");
};

export const getProducts = (req: Request, res: Response) => {
  Product.fetchAll((products) => {
    res.render("admin/products", {
      prods: products,
      pageTitle: "Admin Products",
      path: "/admin/products",
    });
  });
};
