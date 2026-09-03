import { type Request, type Response } from "express";
import { Product } from "../models/product.ts";

export const getProducts = (req: Request, res: Response) => {
  Product.fetchAll((products) => {
    res.render("shop/product-list", {
      prods: products,
      pageTitle: "All Products",
      path: "/products",
    });
  });
};

export const getProduct = (req: Request, res: Response) => {
  const productId = Number(req.params.productId);
  if (Number.isNaN(productId)) {
    res.redirect("/products");
    return;
  }

  Product.findById(productId, (product) => {
    if (!product) {
      res.redirect("/products");
      return;
    }
    res.render("shop/product-detail", {
      product,
      pageTitle: product.title,
      path: "/products",
    });
  });
};

export const getIndex = (req: Request, res: Response) => {
  Product.fetchAll((products) => {
    res.render("shop/index", {
      prods: products,
      pageTitle: "Shop",
      path: "/",
    });
  });
};

export const getCart = (req: Request, res: Response) => {
  res.render("shop/cart", {
    path: "/cart",
    pageTitle: "Your Cart",
  });
};

export const getOrders = (req: Request, res: Response) => {
  res.render("shop/orders", {
    path: "/orders",
    pageTitle: "Your Orders",
  });
};

export const getCheckout = (req: Request, res: Response) => {
  res.render("shop/checkout", {
    path: "/checkout",
    pageTitle: "Checkout",
  });
};
