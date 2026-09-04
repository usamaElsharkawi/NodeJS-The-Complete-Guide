import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Cart } from "./cart.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, "..", "data", "products.json");

const getProductsFromFile = (cb: (products: Product[]) => void): void => {
  fs.readFile(dataFilePath, (err, fileContent) => {
    if (err) {
      cb([]);
    } else {
      const products = JSON.parse(fileContent.toString()) as Product[];
      cb(
        products.map((product) =>
          Object.assign(
            new Product(
              product.id === null ? null : String(product.id),
              product.title,
              product.imageUrl,
              product.description,
              product.price,
            ),
            product,
            { id: product.id === null ? null : String(product.id) },
          ),
        ),
      );
    }
  });
};

export class Product {
  id: string | null;
  title: string;
  imageUrl: string;
  description: string;
  price: string;

  constructor(
    id: string | null,
    title: string,
    imageUrl: string,
    description: string,
    price: string,
  ) {
    this.id = id;
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
  }

  save(cb?: () => void): void {
    getProductsFromFile((products) => {
      if (this.id) {
        const existingProductIndex = products.findIndex(
          (prod) => prod.id === this.id,
        );
        if (existingProductIndex !== -1) {
          const updatedProducts = [...products];
          updatedProducts[existingProductIndex] = this;
          fs.writeFile(dataFilePath, JSON.stringify(updatedProducts), (err) => {
            if (err) console.error(err);
            cb?.();
          });
        }
      } else {
        this.id = Math.random().toString(36).slice(2, 9);
        products.push(this);
        fs.writeFile(dataFilePath, JSON.stringify(products), (err) => {
          if (err) console.error(err);
          cb?.();
        });
      }
    });
  }

  static deleteById(id: string, cb?: () => void): void {
    getProductsFromFile((products) => {
      const product = products.find((prod) => prod.id === id);
      const updatedProducts = products.filter((prod) => prod.id !== id);
      fs.writeFile(dataFilePath, JSON.stringify(updatedProducts), (err) => {
        if (!err && product) {
          Cart.deleteProduct(id, product.price, cb);
        } else {
          cb?.();
        }
      });
    });
  }

  static fetchAll(cb: (products: Product[]) => void): void {
    getProductsFromFile(cb);
  }

  static findById(
    id: string,
    cb: (product: Product | undefined) => void,
  ): void {
    getProductsFromFile((products) => {
      const product = products.find((p) => p.id === id);
      cb(product);
    });
  }
}
