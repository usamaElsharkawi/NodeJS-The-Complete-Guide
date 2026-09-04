import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, "..", "data", "products.json");

export interface Product {
  id: string;
  title: string;
}

export class Product {
  id: string;
  title: string;

  constructor(id: string, title: string) {
    this.id = id;
    this.title = title;
  }

  save(callback: () => void): void {
    fs.readFile(dataFilePath, (err, fileContent) => {
      let products: Product[] = [];
      if (!err) {
        const parsed = JSON.parse(fileContent.toString()) as Product[];
        products = parsed;
      }
      products.push(this);

      fs.writeFile(dataFilePath, JSON.stringify(products), (err) => {
        if (err) console.error(err);
        callback();
      });
    });
  }

  static getAll(callback: (products: Product[]) => void): void {
    fs.readFile(dataFilePath, (err, fileContent) => {
      if (err) {
        callback([]);
        return;
      }

      const products = JSON.parse(fileContent.toString()) as Product[];
      callback(products);
    });
  }

  static getById(
    id: string,
    callback: (product: Product | undefined) => void,
  ): void {
    Product.getAll((products) => {
      callback(products.find((p) => p.id === id));
    });
  }
}
