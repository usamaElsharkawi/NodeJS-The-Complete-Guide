import { type Request, type Response } from "express";
import { Product } from "../models/product.ts";

export const getAddProduct = (req: Request, res: Response) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
  });
};

export const postAddProduct = (req: Request, res: Response) => {
  const title = req.body.title as string;
  const imageUrl = req.body.imageUrl as string;
  const price = req.body.price as string;
  const description = req.body.description as string;
  const product = new Product(null, title, imageUrl, description, price);
  product.save(() => res.redirect("/"));
};

export const getEditProduct = (req: Request, res: Response) => {
  const editMode = req.query.edit === "true";
  const prodId = req.params.productId;
  const id = Array.isArray(prodId) ? prodId[0] : prodId;
  if (!editMode) {
    res.redirect("/");
    return;
  }
  if (!id) {
    res.redirect("/");
    return;
  }
  Product.findById(id, (product) => {
    if (!product) {
      res.redirect("/");
      return;
    }
    res.render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: editMode,
      product: product,
    });
  });
};

export const postEditProduct = (req: Request, res: Response) => {
  const prodId = req.body.productId as string;
  if (!prodId) {
    res.redirect("/admin/products");
    return;
  }
  Product.findById(prodId, (product) => {
    if (!product) {
      res.redirect("/admin/products");
      return;
    }
    const updatedTitle = req.body.title as string;
    const updatedImageUrl = req.body.imageUrl as string;
    const updatedDesc = req.body.description as string;
    const updatedPrice = req.body.price as string;
    const updatedProduct = new Product(
      prodId,
      updatedTitle,
      updatedImageUrl,
      updatedDesc,
      updatedPrice,
    );
    updatedProduct.save(() => res.redirect("/admin/products"));
  });
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

export const postDeleteProduct = (req: Request, res: Response) => {
  const prodId = req.body.productId as string;
  if (!prodId) {
    res.redirect("/admin/products");
    return;
  }
  Product.deleteById(prodId, () => res.redirect("/admin/products"));
};
