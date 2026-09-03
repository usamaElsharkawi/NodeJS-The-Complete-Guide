import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.join(__dirname, "data", "products.json");

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

  save(): void {
    fs.readFile(dataFilePath, (err, fileContent) => {
      let products: Product[] = [];
      if (!err) {
        const parsed = JSON.parse(fileContent.toString()) as Product[];
        products = parsed;
      }
      products.push(this);

      fs.writeFile(dataFilePath, JSON.stringify(products), (err) => {
        if (err) console.error(err);
      });
    });
  }

  static getAll(): Product[] {
    const fileContent = fs.readFileSync(dataFilePath);
    const products = JSON.parse(fileContent.toString()) as Product[];
    return products;
  }

  static getById(id: string): Product | undefined {
    const products = Product.getAll();
    return products.find((p) => p.id === id);
  }
}
