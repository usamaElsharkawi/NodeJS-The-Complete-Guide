interface ProductI {
  title: string;
}

let products: ProductI[] = [];

export class Product implements ProductI  {
  title: string;
  constructor(title: string) {
    this.title = title;
  }

  save() {
    products.push(this);
  }

  static getAll() {
    return products;
  }
}


