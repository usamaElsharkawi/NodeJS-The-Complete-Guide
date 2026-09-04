# Section 9: Dynamic Routes & Advanced Models

> TypeScript (native `.ts`) running on Node.js v24+ with Express.js.
> Toolchain: `node app.ts` (type-stripping) + `tsc --noEmit` (type-checking)

## Setup

```bash
npm install
npm run lint      # tsc --noEmit
npm start         # node app.ts
```

Express matches routes in order. `/products` (literal) must come before `/products/:productId` so that `/products/123` doesn't get matched as a product list request.

### Query Parameters (Lectures 124–125)

Query parameters are the part of the URL **after the `?` symbol**. They pass optional data to the server as key-value pairs.

```
/admin/edit-product/abc123?edit=true
                           ↑
                    query params
```

Multiple params are separated by `&`:
```
/products?category=books&page=2&sort=asc
```

#### Three Types of URL Data in Express

| Source | URL Part | Example | Access |
|--------|----------|---------|--------|
| **Route params** | `:productId` in path | `/products/:productId` | `req.params.productId` |
| **Query params** | After `?` | `/products?edit=true` | `req.query.edit` |
| **Body** | Form fields, JSON | POST form data | `req.body.title` |

#### Query Params Are Always Strings

Even if the URL looks like `?page=2`, `req.query.page` is the **string** `"2"`, not the number `2`. You must convert manually:

```ts
const page = Number(req.query.page);        // string "2" → number 2
const editMode = req.query.edit === 'true'; // string "true" → boolean true
```

#### Why `=== 'true'` and Not Just `if (req.query.edit)`?

In JavaScript, a non-empty string is **truthy**:

```ts
Boolean("false")  // true  ← string "false" is still truthy!
Boolean("")       // false ← only empty string is falsy
```

So `if (req.query.edit)` would treat `?edit=false` as truthy and show the edit form when it shouldn't. Using `=== 'true'` is explicit and correct.

#### Used in our project

In `controller/admin.ts`:
```ts
export const getEditProduct = (req: Request, res: Response) => {
  const editMode = req.query.edit === 'true';
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
```

The link in `views/admin/products.ejs`:
```html
<a href="/admin/edit-product/<%= product.id %>?edit=true" class="btn">Edit</a>
```

When you click Edit, the URL becomes `/admin/edit-product/abc123?edit=true`, and `req.query.edit` is `"true"`.

#### Common Use Cases

- **Pagination**: `?page=2&limit=10`
- **Filtering**: `?category=books&minPrice=10`
- **Search**: `?q=nodejs`
- **Sorting**: `?sort=price&order=asc`
- **Mode toggles**: `?edit=true`, `?preview=true`

#### Type Safety with Express 5

In Express 5, `req.params` and `req.query` are both typed with `noUncheckedIndexedAccess: true`, meaning accessing a property could be `undefined`. Always guard:

```ts
const prodId = req.params.productId;
const id = Array.isArray(prodId) ? prodId[0] : prodId;
if (!id) {
  res.redirect("/");
  return;
}
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

### Query Parameters (Lectures 124–125)

Query parameters are the part of the URL **after the `?` symbol**. They pass optional data to the server as key-value pairs.

```
/admin/edit-product/abc123?edit=true
                           ↑
                    query params
```

Multiple params are separated by `&`:
```
/products?category=books&page=2&sort=asc
```

#### Three Types of URL Data in Express

| Source | URL Part | Example | Access |
|--------|----------|---------|--------|
| **Route params** | `:productId` in path | `/products/:productId` | `req.params.productId` |
| **Query params** | After `?` | `/products?edit=true` | `req.query.edit` |
| **Body** | Form fields, JSON | POST form data | `req.body.title` |

#### Query Params Are Always Strings

Even if the URL looks like `?page=2`, `req.query.page` is the **string** `"2"`, not the number `2`. You must convert manually:

```ts
const page = Number(req.query.page);        // string "2" → number 2
const editMode = req.query.edit === 'true'; // string "true" → boolean true
```

#### Why `=== 'true'` and Not Just `if (req.query.edit)`?

In JavaScript, a non-empty string is **truthy**:

```ts
Boolean("false")  // true  ← string "false" is still truthy!
Boolean("")       // false ← only empty string is falsy
```

So `if (req.query.edit)` would treat `?edit=false` as truthy and show the edit form when it shouldn't. Using `=== 'true'` is explicit and correct.

#### Used in our project

In `controller/admin.ts`:
```ts
export const getEditProduct = (req: Request, res: Response) => {
  const editMode = req.query.edit === 'true';
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
```

The link in `views/admin/products.ejs`:
```html
<a href="/admin/edit-product/<%= product.id %>?edit=true" class="btn">Edit</a>
```

When you click Edit, the URL becomes `/admin/edit-product/abc123?edit=true`, and `req.query.edit` is `"true"`.

#### Common Use Cases

- **Pagination**: `?page=2&limit=10`
- **Filtering**: `?category=books&minPrice=10`
- **Search**: `?q=nodejs`
- **Sorting**: `?sort=price&order=asc`
- **Mode toggles**: `?edit=true`, `?preview=true`

#### Type Safety with Express 5

In Express 5, `req.params` and `req.query` are both typed with `noUncheckedIndexedAccess: true`, meaning accessing a property could be `undefined`. Always guard:

```ts
const prodId = req.params.productId;
const id = Array.isArray(prodId) ? prodId[0] : prodId;
if (!id) {
  res.redirect("/");
  return;
}
```

### Delete Pattern (Lecture 127)

The `Product.deleteById` static method removes a product and cascades the delete to any cart containing it:

```ts
// models/product.ts
static deleteById(id: string, cb?: () => void): void {
  getProductsFromFile((products) => {
    const product = products.find((prod) => prod.id === id);  // 1. Find product first
    const updatedProducts = products.filter((prod) => prod.id !== id);  // 2. Filter OUT the deleted one
    fs.writeFile(dataFilePath, JSON.stringify(updatedProducts), (err) => {
      if (!err && product) {
        Cart.deleteProduct(id, product.price, cb);  // 3. Cascade to cart
      } else {
        cb?.();
      }
    });
  });
}
```

**Three-step delete:**

| Step | Action | Why |
|------|--------|-----|
| 1 | Find product first | Need its `price` for cart cleanup |
| 2 | `filter()` excludes by id | Creates new array without the item — cleaner than splice/index tracking |
| 3 | Cascade to `Cart.deleteProduct` | Remove from any cart containing it |

**The `filter()` approach:**

```ts
// ❌ Bad: splice with index tracking (error-prone)
const index = products.findIndex((p) => p.id === id);
if (index !== -1) products.splice(index, 1);

// ✅ Good: filter creates new array (immutable, no index math)
const updatedProducts = products.filter((prod) => prod.id !== id);
```

**Controller usage:**

```ts
// controller/admin.ts
export const postDeleteProduct = (req: Request, res: Response) => {
  const prodId = req.params.productId;
  const id = Array.isArray(prodId) ? prodId[0] : prodId;
  if (!id) {
    res.redirect("/admin/products");
    return;
  }
  Product.deleteById(id, () => {
    res.redirect("/admin/products");
  });
};
```

**Route:**

```ts
// routes/admin.ts
router.post("/delete-product/:productId", postDeleteProduct);
```

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
│   ├── admin.ts              # admin product management + delete
│   ├── error.ts              # 404 handler
│   └── shop.ts               # shop routes + product detail + cart
├── models/
│   ├── product.ts            # Product class + file persistence
│   └── cart.ts               # Cart class + cart.json persistence
├── routes/
│   ├── admin.ts              # /admin/* routes
│   └── shop.ts              # /, /products, /cart, /orders, /checkout
├── util/
│   └── path.ts               # __dirname ESM workaround
├── views/
│   ├── 404.ejs
│   ├── admin/
│   │   ├── add-product.ejs
│   │   ├── edit-product.ejs  # edit form with ?edit=true
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
