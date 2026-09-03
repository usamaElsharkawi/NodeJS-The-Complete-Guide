# Section 9: Dynamic Routes & Advanced Models

> TypeScript (native `.ts`) running on Node.js v24+ with Express.js.
> Toolchain: `node app.ts` (type-stripping) + `tsc --noEmit` (type-checking)

## Setup

```bash
npm install
npm run lint      # tsc --noEmit
npm start         # node app.ts
```

---

# Lectures 115–121: Dynamic Routes & Product Details

## What we learned

### Dynamic Routes

Express supports dynamic route segments using `:paramName` syntax:

```ts
// routes/shop.ts
router.get("/products/:productId", getProduct);
```

The `:productId` segment becomes accessible via `req.params.productId`.

### Type Safety with Dynamic Params

With `noUncheckedIndexedAccess: true`, `req.params.productId` is typed as `string | undefined`:

```ts
// controller/shop.ts
export const getProduct = (req: Request, res: Response) => {
  const productId = Number(req.params.productId);
  if (Number.isNaN(productId)) {
    res.redirect("/products");
    return;
  }
  // ...
};
```

- `Number(undefined)` → `NaN` — caught by `Number.isNaN()`
- `Number("abc")` → `NaN` — also caught
- `Number("123")` → `123` — valid product ID

### Adding ID to Product

The Product model got an `id` field:

```ts
// models/product.ts
export class Product {
  id: number = Math.random();
  title: string;
  imageUrl: string;
  description: string;
  price: string;

  constructor(title: string, imageUrl: string, description: string, price: string) {
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
  }
  // ...
}
```

- `id` is a **property initializer** — auto-assigned when an instance is created
- No constructor parameter needed — `this.id` gets a random float value

### Finding a Product by ID

Static `findById` method:

```ts
// models/product.ts
static findById(id: number, cb: (product: Product | undefined) => void): void {
  getProductsFromFile((products) => {
    const product = products.find((p) => p.id === id);
    cb(product);
  });
}
```

- `products.find()` returns `Product | undefined` with `noUncheckedIndexedAccess: true`
- Callback type must reflect `Product | undefined`

### Guarding Against Undefined

Always handle the "not found" case:

```ts
// controller/shop.ts
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
```

After the `if (!product)` guard, TypeScript knows `product` is defined — no `?.` needed.

### Route Order Matters

```ts
router.get("/products", getProducts);
router.get("/products/:productId", getProduct);
```

Express matches routes in order. `/products` (literal) must come before `/products/:productId` so that `/products/123` doesn't get matched as a product list request.

---

## TypeScript Patterns Used

### `import type` for type-only imports

```ts
import { type Request, type Response } from "express";
```

Required by `verbatimModuleSyntax: true`.

### Class as both type and constructor

```ts
export class Product {
  id: number = Math.random();
  // ...
}
```

No separate `interface Product` needed — the class declaration exports both a type and a constructor function.

### Property initializers

```ts
id: number = Math.random();
```

Shorthand for assigning a default value directly on the property without listing it in the constructor params.

---

## File Structure

```
Section 9/
├── app.ts                    # entry point
├── controller/
│   ├── admin.ts              # admin product management
│   ├── error.ts             # 404 handler
│   └── shop.ts              # shop routes + product detail
├── models/
│   └── product.ts            # Product class + file persistence
├── routes/
│   ├── admin.ts             # /admin/* routes
│   └── shop.ts              # /, /products, /cart, /orders, /checkout
├── util/
│   └── path.ts              # __dirname ESM workaround
├── views/
│   ├── 404.ejs
│   ├── admin/
│   │   ├── add-product.ejs
│   │   └── products.ejs
│   ├── includes/
│   │   ├── head.ejs
│   │   ├── navigation.ejs
│   │   └── end.ejs
│   └── shop/
│       ├── cart.ejs
│       ├── checkout.ejs
│       ├── index.ejs
│       ├── orders.ejs
│       ├── product-detail.ejs
│       └── product-list.ejs
├── public/
│   ├── css/
│   └── js/
├── data/
│   └── products.json
├── tsconfig.json
└── package.json
```
