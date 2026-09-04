import { type Request, type Response } from "express";
import { Product } from "../models/product.ts";
import { Cart } from "../models/cart.ts";

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
  const prodId = req.params.productId;
  const id = Array.isArray(prodId) ? prodId[0] : prodId;
  if (!id) {
    res.redirect("/products");
    return;
  }
  Product.findById(id, (product) => {
    if (!product) {
      res.redirect("/products");
      return;
    }
    res.render("shop/product-detail", {
      product: product,
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
  Cart.getCart((cart) => {
    if (!cart) {
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: [],
      });
      return;
    }
    Product.fetchAll((products) => {
      const cartProducts: { productData: Product; qty: number }[] = [];
      for (const product of products) {
        const cartProductData = cart.products.find(
          (prod) => prod.id === product.id,
        );
        if (cartProductData) {
          cartProducts.push({
            productData: product,
            qty: cartProductData.qty,
          });
        }
      }
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: cartProducts,
      });
    });
  });
};

export const postCart = (req: Request, res: Response) => {
  const prodId = req.body.productId as string;
  if (!prodId) {
    res.redirect("/products");
    return;
  }
  Product.findById(prodId, (product) => {
    if (product) {
      Cart.addProduct(prodId, product.price, () => res.redirect("/cart"));
      return;
    }
    res.redirect("/products");
  });
};

export const postCartDeleteProduct = (req: Request, res: Response) => {
  const prodId = req.body.productId as string;
  if (!prodId) {
    res.redirect("/cart");
    return;
  }
  Product.findById(prodId, (product) => {
    if (product) {
      Cart.deleteProduct(prodId, product.price, () => res.redirect("/cart"));
      return;
    }
    res.redirect("/cart");
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
