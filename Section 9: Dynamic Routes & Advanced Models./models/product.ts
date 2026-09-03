import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, "..", "data", "products.json");

const getProductsFromFile = (cb: (products: Product[]) => void): void => {
  fs.readFile(dataFilePath, (err, fileContent) => {
    if (err) {
      cb([]);
    } else {
      cb(JSON.parse(fileContent.toString()));
    }
  });
};

export class Product {
  id: number = Math.random();
  title: string;
  imageUrl: string;
  description: string;
  price: string;

  constructor(
    title: string,
    imageUrl: string,
    description: string,
    price: string,
  ) {
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
  }

  save(): void {
    getProductsFromFile((products) => {
      products.push(this);
      fs.writeFile(dataFilePath, JSON.stringify(products), (err) => {
        if (err) console.error(err);
      });
    });
  }

  static fetchAll(cb: (products: Product[]) => void): void {
    getProductsFromFile(cb);
  }

  static findById(
    id: number,
    cb: (product: Product | undefined) => void,
  ): void {
    getProductsFromFile((products) => {
      const product = products.find((product) => product.id === id);
      cb(product);
    });
  }
}
