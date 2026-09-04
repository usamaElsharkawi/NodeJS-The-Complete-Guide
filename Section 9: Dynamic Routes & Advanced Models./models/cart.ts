import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, "..", "data", "cart.json");

interface CartItem {
  id: string;
  qty: number;
}

interface CartData {
  products: CartItem[];
  totalPrice: number;
}

export class Cart {
  private static mutationQueue = Promise.resolve();

  private static enqueueMutation(
    mutation: () => Promise<void>,
    cb?: () => void,
  ): void {
    Cart.mutationQueue = Cart.mutationQueue.then(mutation).then(() => cb?.());
  }

  static addProduct(id: string, productPrice: string, cb?: () => void): void {
    Cart.enqueueMutation(async () => {
      const cart = await Cart.readCart();

      const existingProductIndex = cart.products.findIndex(
        (prod) => prod.id === id,
      );
      const existingProduct = cart.products[existingProductIndex];
      let updatedProduct: CartItem | undefined;

      if (existingProduct) {
        updatedProduct = { ...existingProduct };
        updatedProduct.qty = updatedProduct.qty + 1;
        cart.products = [...cart.products];
        cart.products[existingProductIndex] = updatedProduct;
      } else {
        updatedProduct = { id: id, qty: 1 };
        cart.products = [...cart.products, updatedProduct];
      }
      cart.totalPrice = cart.totalPrice + Number(productPrice);
      await fs.promises.writeFile(dataFilePath, JSON.stringify(cart));
    }, cb);
  }

  static deleteProduct(
    id: string,
    productPrice: string,
    cb?: () => void,
  ): void {
    Cart.enqueueMutation(async () => {
      const updatedCart = await Cart.readCart();
      const product = updatedCart.products.find((prod) => prod.id === id);
      if (!product) {
        return;
      }
      const productQty = product.qty;
      updatedCart.products = updatedCart.products.filter(
        (prod) => prod.id !== id,
      );
      updatedCart.totalPrice =
        updatedCart.totalPrice - Number(productPrice) * productQty;

      await fs.promises.writeFile(dataFilePath, JSON.stringify(updatedCart));
    }, cb);
  }

  private static async readCart(): Promise<CartData> {
    try {
      const fileContent = await fs.promises.readFile(dataFilePath, "utf8");
      return JSON.parse(fileContent) as CartData;
    } catch {
      return { products: [], totalPrice: 0 };
    }
  }

  static getCart(cb: (cart: CartData | null) => void): void {
    fs.readFile(dataFilePath, (err, fileContent) => {
      if (err) {
        cb(null);
      } else {
        cb(JSON.parse(fileContent.toString()));
      }
    });
  }
}
