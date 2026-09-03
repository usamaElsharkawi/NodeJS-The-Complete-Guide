# Section 7: The Model View Controller (MVC)

> TypeScript (native `.ts`) running on Node.js v24+ with Express.js.
> Toolchain: `node app.ts` (type-stripping) + `tsc --noEmit` (type-checking)

## 🔧 Project Setup

```bash
# 1) scaffold
npm init -y
npm install express
npm install -D @types/express typescript @types/node

# 2) every lecture
npm run lint      # tsc --noEmit
npm start         # node app.ts
```

### tsconfig.json (same strict settings as Section 3)

```jsonc
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2023"],
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"]
  },
  "include": ["*.ts"],
  "exclude": ["node_modules"]
}
```

---

# Lecture 96: Module Introduction

## What I learned
- Section 7 introduces the **Model View Controller (MVC)** pattern — a way to structure Node.js applications for better maintainability and separation of concerns.
- We'll build on the Express.js knowledge from Section 5 and apply MVC architecture to organize routes, data logic, and user interfaces.
- The goal is to move from a monolithic `app.ts` to a clean folder structure with controllers, models, and views.

```text
┌─────────────────────────────────────────────┐
│  Section 5: Express.js                      │
│  ├─ Single app.ts with all routes           │
│  ├─ Inline route handlers                  │
│  └─ No separation of concerns               │
├─────────────────────────────────────────────┤
│  Section 7: MVC with Express                 │
│  ├─ Controllers/ (request handlers)         │
│  ├─ Models/ (data logic)                    │
│  ├─ Views/ (UI/templates)                   │
│  └─ app.ts (entry point only)               │
└─────────────────────────────────────────────┘
```

## TypeScript mapping
- Continue using `import express from "express"` (ESM, verbatimModuleSyntax)
- Strict TypeScript rules from Section 3 still apply
- ESM imports only — no `require()`
- `.ts` extensions in all relative imports

## Notes & gotchas
- MVC is an **architectural pattern**, not a framework — Express supports it but doesn't enforce it
- Section 7 builds directly on Section 5's Express knowledge
- Folder structure will grow as we add controllers and models in later lectures

---

# Lecture 97: What is the MVC?

## What I learned
- MVC stands for **Model View Controller** — a pattern for structuring code by dividing responsibilities into three main components.
- It is a **Separation of Concerns** strategy: each component has one job, and they communicate in a defined way.
- The pattern prevents a monolithic `app.ts` where routes, data logic, and HTML are tangled together.
- MVC does not add new tools to Express — it imposes a **folder + responsibility contract** on top of it.

```text
┌─────────────────────────────────────────────┐
│  Section 5: Express.js                      │
│  ├─ Single app.ts with all routes           │
│  ├─ Inline route handlers                  │
│  └─ No separation of concerns               │
├─────────────────────────────────────────────┤
│  Section 7: MVC with Express                 │
│  ├─ Controllers/ (request handlers)         │
│  ├─ Models/ (data logic)                    │
│  ├─ Views/ (UI/templates)                   │
│  └─ app.ts (entry point only)               │
└─────────────────────────────────────────────┘
```

### Model
- Responsible for **representing and working with your data**.
- Knows nothing about HTTP, routes, or HTML.
- Reads/writes data from a backend (in this section: the **filesystem**; later: a database).
- Exposes plain async methods like `getAll()`, `getById()`, `create()`.
- Returns **typed data** — never `any`. The controller asks the model for data; the model does not ask the controller anything.

### View
- Responsible for **what the user sees**.
- Should not care about application logic, routing, or data access.
- In this section, views are **template functions** that return HTML strings.
- The view is **passive** — it receives data and formats it. It does not call the model or the controller.

### Controller
- The **connection point** between Model and View.
- Receives the Express `Request`, calls the appropriate **Model** method(s), passes the result to the appropriate **View**, and sends the final `Response`.
- Intentionally thin: parse input → ask model → render view → send response.

### Routes
- Define which route should be called (points into / connects to the Controller).
- Routes are **wiring**, not logic. `app.get("/products", productsController.getProducts)` simply says "when this path is hit, run this controller method."

## Data flow in MVC

```text
HTTP Request
     │
     ▼
 Route (app.get) ── points to ─▶ Controller
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                          ▼                     ▼
                      Model                  View
                   (fetch data)         (format data)
                          │                     │
                          └──────────┬──────────┘
                                     │
                                     ▼
                              Controller
                              assembles result
                                     │
                                     ▼
                              HTTP Response
```

**The controller is the only layer that touches both the Model and the View.** That is why it is called the "connection point."

## What changed from Section 5

| Section 5 (current) | Section 7 (MVC) |
|---|---|
| `app.get("/products", handler)` — handler does everything inline | `app.get("/products", productsController.getProducts)` — handler delegates |
| Data logic mixed into route handler | Data logic lives in `models/` |
| HTML strings embedded in route handler | Rendering logic separated into views |
| Hard to test: one function does parsing + DB + HTML | Easy to test: mock model, assert controller calls it, assert view output |

## TypeScript mapping
- **Models** export **interfaces/types** for data shapes, e.g. `Product` with `id`, `title`, `price`, `description`. `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` enforce strict null-safety.
- **Controllers** are where Express types live: `Request`, `Response`, `NextFunction`. This is the boundary where external framework types enter your code.
- **Views** are pure functions typed as `(data: T) => string`. They never import Express.
- **Routes** in `app.ts` remain thin wiring: `app.get("/products", shopController.getProducts)`.
- **verbatimModuleSyntax** enforces that view files (which need no Express types) use `import type` only for any shared interfaces.

---

# Lecture 98: Adding Controllers

## What I learned
- **Controllers** are the "connection point" between Model and View — they receive the request, ask the model for data, pass it to the view, and send the response.
- In the starting project, route handlers did everything inline: parsing input, rendering templates, and redirecting. Controllers extract that logic into dedicated functions.
- A controller should be **thin**: parse input → ask model → render view → send response. It should not contain business logic or data-access code (that moves to the Model later).
- The mindset for splitting controllers: **one controller per domain resource** (e.g. `ProductsController`, `AuthController`), not per URL path.

```text
Before (starting project):
┌─────────────────────────────────────────────────────────────┐
│  routes/shop.js                                             │
│  router.get('/', (req, res, next) => {                      │
│    // ALL logic here:                                     │
│    // - imports data from admin.js                        │
│    // - calls res.render() with template + data           │
│  })                                                        │
└─────────────────────────────────────────────────────────────┘

After (with controllers):
┌─────────────────────────────────────────────────────────────┐
│  routes/shop.ts                                            │
│  router.get('/', getProducts);  ← thin wiring only         │
│                                                             │
│  controller/products.ts                                    │
│  export const getProducts = (req, res) => {                │
│    const products = productModel.getAll();                 │
│    res.render('shop', { prods: products, ... });           │
│  };                                                        │
└─────────────────────────────────────────────────────────────┘
```

## What I implemented

### 1. Created `controller/products.ts`
Extracted all route handler logic from `routes/shop.ts` and `routes/admin.ts` into dedicated controller functions:

```ts
// controller/products.ts
import { type Request, type Response, type NextFunction } from "express";

export const getAddProduct = (req: Request, res: Response, next: NextFunction) => {
  res.render("add-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    formsCSS: true,
    productCSS: true,
    activeAddProduct: true,
  });
};

export const postAddProduct = (req: Request, res: Response, next: NextFunction) => {
  products.push({ title: req.body.title ?? "" });
  res.redirect("/");
};

export const getProducts = (req: Request, res: Response, next: NextFunction) => {
  res.render("shop", {
    prods: products,
    pageTitle: "Shop",
    path: "/",
    hasProducts: products.length > 0,
    activeShop: true,
    productCSS: true,
  });
};
```

### 2. Updated `routes/shop.ts` to use the controller
```ts
// routes/shop.ts
import express from "express";
import { getProducts } from "../controller/products.ts";

const router = express.Router();

router.get("/", getProducts);

export default router;
```

### 3. Updated `routes/admin.ts` to use the controller
```ts
// routes/admin.ts
import express from "express";
import { getAddProduct, postAddProduct } from "../controller/products.ts";

const router = express.Router();

router.get("/add-product", getAddProduct);
router.post("/add-product", postAddProduct);

export const routes = router;
```

### 4. Removed shared state from router files
In the starting project, `routes/admin.js` exported both the router and the `products` array, and `routes/shop.js` imported that array directly. The controller now owns that shared state, so route files no longer need to import from each other.

```ts
// routes/shop.ts — no longer imports from admin
import { getProducts } from "../controller/products.ts";
```

## TypeScript mapping
- Controllers are **typed functions**: `(req: Request, res: Response, next: NextFunction) => void`.
- `verbatimModuleSyntax` requires explicit `import type` for `Request`, `Response`, `NextFunction` because they are type-only imports from `"express"`.
- Route files are **value imports only** — they import controller functions as runtime values, not types.
- Controller files are the **boundary** where Express types enter the application logic. Below the controller, you should not see Express types.

## Notes & gotchas
- **Controllers are not classes** in this section — they are plain exported functions. The course may introduce classes later.
- **One controller per domain resource**: `controller/products.ts` owns all product-related actions. If you later add user management, that would be `controller/users.ts`, not more functions in `products.ts`.
- **Route files should contain zero business logic** — they are just a mapping table: `path → controller function`.
- **Controllers should not import from other controllers** — they communicate through models, not through each other.
- The `next: NextFunction` parameter is required for type correctness, even if the controller does not currently call `next()`. This allows future error handling middleware to catch errors from these controllers.
- **Order of middleware matters**: `express.urlencoded()` must be registered before controllers that read `req.body`.

---

# Lecture 99: Finishing the Controllers

## What I learned
- Lecture 98 created the controller structure; Lecture 99 finalizes it by ensuring all route handlers live in controllers and the route files are clean.
- The goal is **separation of concerns**: `app.ts` = configuration, `routes/*.ts` = URL-to-controller mapping, `controller/*.ts` = request handling logic.
- By the end of Lecture 99, the app is ready for the next step: extracting the shared data logic into a proper **Model**.

## What I implemented

### Final folder structure after Lecture 99

```
section7/
├── app.ts                        # entry point + middleware + router mounts
├── routes/
│   ├── admin.ts                  # thin admin router
│   └── shop.ts                   # thin shop router
├── controller/
│   └── products.ts               # all product controller logic
├── views/
│   ├── shop.ejs
│   ├── add-product.ejs
│   ├── 404.ejs
│   └── includes/
│       ├── head.ejs
│       ├── navigation.ejs
│       └── end.ejs
├── public/
│   └── css/
│       ├── main.css
│       ├── product.css
│       └── forms.css
├── util/
│   └── path.ts
├── package.json
├── tsconfig.json
└── README.md
```

### What was removed / cleaned up
- **Removed inline route handlers** from router files. All logic now lives in `controller/products.ts`.
- **Removed cross-router imports**. `routes/shop.ts` no longer imports the `products` array from `routes/admin.ts`.
- **Removed unused `util/path.ts` from router files**. The starting project used `rootDir` in router files; our controllers do not need it yet.

### What remains (to be refactored in Lecture 100+)
- The `products` array is still exported from `controller/products.ts`. This is shared mutable state that should move to a dedicated **Model**.
- Controller functions are tightly coupled to EJS rendering (`res.render`). This will be separated into **Views** in later lectures.
- No file persistence yet — data is lost when the server restarts.

## TypeScript mapping
- All controller functions are **named exports** so they can be imported by route files.
- `Request`, `Response`, `NextFunction` are imported with `import { type ... }` to satisfy `verbatimModuleSyntax`.
- Route files import controller functions as **values**: `import { getProducts } from "../controller/products.ts"`.
- No Express types leak into views or models at this stage.

## Notes & gotchas
- **Do not put business logic in controllers yet**. Controllers should only orchestrate: parse input → ask model → render view → send response. Data access logic will move to the Model in Lecture 100.
- **Do not create controller classes yet**. The course uses plain functions for now. Classes may be introduced later for dependency injection.
- **Keep controllers focused**. If `controller/products.ts` grows beyond ~200 lines, consider splitting into `controller/products-list.ts` and `controller/products-add.ts`. But for now, one file per domain resource is correct.
- **The controller is not the Model**. Having `products` array in `controller/products.ts` is temporary — it will move to `models/product.ts` in Lecture 100. Do not treat the controller as permanent storage.
- **Route files are address books**. If a route file grows beyond 20–30 lines, it usually means you need more controller files, not more logic in the route file.

---

# Concept: MVC Deep Dive — Controller/View Relationship, Flux, and MVC Variants

> Extended discussion supplementing Lecture 97.


## What I learned
- MVC is not a single fixed pattern — there are **two distinct flavors** with opposite rules about who talks to whom.
- The **Passive View** variant (used in server-side frameworks like Express, Rails, Django) enforces strict one-way data flow.
- The **Active View** variant (used in client-side UI frameworks like iOS UIKit, Backbone.js) allows the View to talk to the Model directly, which creates cycles.
- Facebook invented **Flux** specifically to solve the problems caused by Active View MVC at scale.

---

## The Controller ↔ View Relationship

### The basic handshake

```text
Controller                     View
    │                            │
    │  1. Prepare data           │
    │  const products = [...]    │
    │                            │
    │  2. Call view function     │
    │  const html =              │
    │    shopView.renderList(    │
    │      products              │
    │    );                      │
    │          │                  │
    │          └─────────────────▶│
    │                            │
    │          ◀─────────────────│
    │  3. Receive HTML string    │
    │  res.send(html);           │
    │                            │
```

The view is a **function that accepts data and returns a presentation artifact** (usually an HTML string). It has no knowledge of Express, `req`, `res`, routes, or the model.

### Concrete example in our stack

```ts
// views/shop.ts
// The view knows nothing about HTTP. It only formats data.
export function renderProductList(
  products: Array<{ id: string; title: string; price: number }>
): string {
  const listItems = products
    .map(
      (product) =>
        `<li>${product.title} - $${product.price.toFixed(2)}</li>`
    )
    .join("\n");

  return `
    <!DOCTYPE html>
    <html>
      <head><title>Shop</title></head>
      <body>
        <h1>Products</h1>
        <ul>${listItems}</ul>
      </body>
    </html>
  `;
}

export function renderProductDetail(
  product: { id: string; title: string; price: number; description: string }
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>${product.title}</title></head>
      <body>
        <h1>${product.title}</h1>
        <p>$${product.price.toFixed(2)}</p>
        <p>${product.description}</p>
        <a href="/">Back to shop</a>
      </body>
    </html>
  `;
}
```

```ts
// controllers/shop.ts
// The controller orchestrates: parse request → ask model → call view → send response
import type { Request, Response } from "express";
import { Product } from "../models/product.ts";
import { renderProductList, renderProductDetail } from "../views/shop.ts";

export class ShopController {
  constructor(private readonly productModel: Product) {}

  getProducts = (_req: Request, res: Response): void => {
    // 1. Ask model for data
    const products = this.productModel.getAll();

    // 2. Ask view to format it
    const html = renderProductList(products);

    // 3. Send response
    res.send(html);
  };

  getProductDetail = (req: Request, res: Response): void => {
    // 1. Parse input from request
    const productId = req.params.id ?? "";

    // 2. Ask model for data
    const product = this.productModel.getById(productId);

    // 3. Decision: if not found, send 404
    if (!product) {
      res.status(404).send("<h1>Product not found</h1>");
      return;
    }

    // 4. Ask view to format it
    const html = renderProductDetail(product);

    // 5. Send response
    res.send(html);
  };
}
```

Notice:
- The **view functions are pure**: same input → same HTML string, every time. No side effects.
- The **controller decides** which view function to call, and what data to pass.
- The **view never imports Express**. It cannot access `req` or `res`.

### What the view is NOT allowed to do

| ❌ Forbidden | Why |
|---|---|
| Import `express` or use `req`/`res` | View must be framework-agnostic |
| Decide routing or status codes | That is the controller's job |
| Call the model directly | View only renders; controller fetches data |
| Mutate the data it receives | Pure function — input in, string out |
| Have side effects (`console.log`, `fs.write`) | View = formatting only |

```ts
// ❌ WRONG — view reaching into Express
export function badRender(req: Request, res: Response) {
  if (req.url === "/admin") {  // view knows about routes!
    res.status(403);           // view controls HTTP!
  }
}
```

```ts
// ❌ WRONG — view calling the model
import { productModel } from "../models/product.ts";

export function badRender() {
  const products = productModel.getAll();  // view fetching data!
  return products.map(...).join("");
}
```

### Data flow through the three layers

```text
HTTP Request
     │
     ▼
 Route (app.get) ── points to ─▶ Controller
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                          ▼                     ▼
                      Model                  View
                   (fetch data)         (format data)
                          │                     │
                          └──────────┬──────────┘
                                     │
                                     ▼
                              Controller
                              assembles result
                                     │
                                     ▼
                              HTTP Response
```

**The controller is the only layer that touches both the model and the view.** This is why it is called the "connection point."

### Why the view should be dumb

1. **Testability.** If the view is a pure function, you test it with plain objects:

```ts
// views/shop.test.ts
import { renderProductList } from "./shop.ts";

test("renders product list", () => {
  const products = [
    { id: "p1", title: "Laptop", price: 999 },
  ];

  const html = renderProductList(products);

  expect(html).toContain("Laptop");
  expect(html).toContain("$999.00");
});
```

No Express, no server, no mocking `req`/`res`.

2. **Reusability.** The same view function can be used in:
   - An Express web route (`res.send(html)`)
   - An API route that returns the same HTML in an email
   - A CLI tool that prints the same list
   Because it has zero Express dependencies.

3. **Predictability.** A view function with signature `(data: T) => string` is easy to reason about. No hidden state, no network calls, no file I/O.

### Multiple views for the same data

The same controller data can be rendered by different views depending on context:

```ts
// controllers/shop.ts
getProductDetail = (req: Request, res: Response): void => {
  const product = this.productModel.getById(req.params.id ?? "");

  if (!product) {
    res.status(404).send("<h1>Not found</h1>");
    return;
  }

  // Decision point: which view to use?
  if (req.accepts("html")) {
    // Browser → full HTML page
    const html = renderProductDetailHtml(product);
    res.send(html);
  } else if (req.accepts("json")) {
    // API client → JSON
    const json = renderProductDetailJson(product);
    res.json(json);
  } else {
    res.status(406).send("Not acceptable");
  }
};
```

The controller decides **which view** to call. The views stay independent.

### Summary of responsibilities

| Layer | Knows about | Does | Calls |
|---|---|---|---|
| **Route** | URL path + HTTP method | Matches request to controller method | Controller |
| **Controller** | `req`, `res`, Model API, View functions | Orchestrates: parse → fetch → render → respond | Model, View |
| **Model** | Data storage/filesystem/database | CRUD operations on typed data | Nothing (leaf) |
| **View** | Data shape only | Formats data into HTML/JSON string | Nothing (leaf, pure) |

The controller is the **only** layer with outgoing arrows to both Model and View. That is the architectural rule for server-side MVC.

---

## There Are Two Distinct MVC Flavors

### 1. Passive View (Server-side MVC) — what this course teaches

Used in: **Node.js/Express, Ruby on Rails, Django, Spring MVC**

```text
One HTTP Request
     │
     ▼
 Route → Controller → Model (fetch data)
                     → View  (render HTML)
                           │
                           ▼
                     Response sent
                           │
                           ▼
                     Connection closes
```

**Rules in this variant:**
- The **View is a passive template** (HTML string or template function). It has zero logic.
- The **View never calls the Controller**. It cannot — it does not even receive the Controller as an argument.
- The **View never calls the Model**. It only receives data that the Controller already fetched.
- The **Controller is the only orchestrator**. It calls both Model and View.

This is what we use in this course.

### 2. Active View (Classic Smalltalk-80 / Client-side UI MVC)

Used in: **iOS (UIKit), Backbone.js, early Angular, ExtJS**

```text
┌──────────────────────────────────────────┐
│         Long-lived application           │
│                                          │
│  ┌──────────┐    observes    ┌────────┐ │
│  │  Model   │◀────────────────│ View 1 │ │
│  │ (state)  │─────────────────▶│       │ │
│  └────┬─────┘                 └────────┘ │
│       │ observes                       │
│       ▼                                 │
│  ┌──────────┐                    ┌────────┐
│  │ View 2   │◀──────────────────│ View 3 │
│  └──────────┘                    └────────┘
│       ▲                                │
│       │ user types / clicks            │
│  ┌──────────┐                          │
│  │ View 1   │ (updates Model directly) │
│  └──────────┘                          │
└──────────────────────────────────────────┘
```

**Rules in this variant:**
- The **View observes the Model** (like a spreadsheet cell watching another cell).
- When the user interacts with the View (clicks, types), the View can **update the Model directly**.
- The Model then **notifies all observing Views** to re-render.
- The Controller (if it exists) is often a thin delegate that the View calls for input validation or navigation decisions — but the View still talks to the Model directly.

### Side-by-side comparison

| | Passive View (Server-side MVC) | Active View (Client-side UI MVC) |
|---|---|---|
| **Lifetime** | One request → one response → done | Long-lived; app stays in memory |
| **View → Model** | ❌ Never | ✅ Often does |
| **View → Controller** | ❌ Never | ✅ Sometimes (delegates user actions) |
| **Model → View** | ❌ Pushes nothing | ✅ Notifies observers on change |
| **Data flow** | Strictly one-way per request | Circular / reactive |
| **State** | Scoped to request (then discarded) | Persistent in memory |
| **Examples** | Express, Rails, Django | iOS UIKit, Backbone.js |

### Why the difference exists

#### Server-side MVC (our course)
The HTTP protocol is **request/response**. The server:
1. Receives a request
2. Runs a controller
3. Sends a response
4. Forgets everything

There is no persistent View object sitting in memory observing a Model. The "view" is just an HTML string generated once and sent. It cannot call anything because it does not exist after the response is sent.

```ts
// This is the ENTIRE lifecycle of one "view":
const html = renderProductList(products); // View = pure function
res.send(html);                            // Sent and gone
// No view object remains to call anything
```

#### Client-side MVC (Facebook's problem)
The browser app stays loaded for hours. A `User` model object lives in memory. Multiple UI components (Views) hold references to it and observe it. When the user changes their name in one component, that component updates the model directly → model notifies 12 other components → they all re-render.

```ts
// This is what creates the circular problem:
class UserView {
  constructor(model) {
    this.model = model;           // View holds reference to Model
    this.model.onChange(() => {   // Model notifies View
      this.render();
    });
  }

  onNameChange(newName) {
    this.model.name = newName;    // View updates Model directly ← cycle
  }
}
```

---

## MVC Problems That Led to Flux

The MVC pattern works well for small-to-medium apps, but at Facebook's scale (thousands of components, complex UI state, many developers), the **Active View** flavor created **unpredictable data flow** and **tight coupling**.

### 1. Two-way data binding / circular dependencies

In Active View MVC, the View can **update the Model directly**, and the Model can **push updates back to the View**. This creates cycles:

```text
User clicks button in View
         │
         ▼
   View updates Model
         │
         ▼
   Model notifies View (observer)
         │
         ▼
   View re-renders
         │
         ▼
   User clicks again...
```

**The problem:** When many views observe the same model, and many views can mutate that model, the flow becomes a **directed graph with cycles**. At Facebook's scale:
- A single user action could trigger cascading updates across dozens of components
- The order of updates was unpredictable
- Debugging was extremely hard: *"Which view changed the model, which caused this other view to update, which triggered this third view?"*

### 2. Implicit, hidden data flow

In Active View MVC, data flow is often **implicit**:
- A controller might mutate a shared model object
- Multiple views observe that same object
- The view that caused the mutation might also receive the update

```ts
// Example of implicit flow in MVC-style code
const user = { name: "Alice", posts: [] };

// View A renders user
renderUserProfile(user);

// View B mutates user directly
user.posts.push({ id: 1, text: "Hello" });

// Because View A is observing `user`, it re-renders automatically
// But who triggered this? View B. When? Unclear.
```

**The problem:** There is no explicit "this action caused this update" trail. In a large codebase, you cannot trace state changes.

### 3. Shared mutable state

Active View MVC does not enforce **immutability** or **single source of truth**. Multiple controllers and views can read/write the same model objects:

```ts
// Controller A
user.lastLogin = new Date();

// Controller B
user.lastLogin = new Date();  // race condition

// View C
console.log(user.lastLogin);  // which one won? unclear
```

**The problem at Facebook scale:**
- Hundreds of components reading/writing the same global stores
- No predictable ordering of writes
- Race conditions in UI rendering
- "Spooky action at a distance" — changing data in one place unexpectedly breaks UI in another

### 4. Unpredictable cascade of re-renders

Because views observe models, and models can be mutated from anywhere, a single change can trigger **unbounded cascading re-renders**:

```text
Action: User changes status message
  │
  ▼
Model updates
  │
  ├─▶ Profile View re-renders
  ├─▶ News Feed View re-renders
  ├─▶ Sidebar View re-renders
  ├─▶ Notifications View re-renders
  │
  ▼
Each re-render might trigger more model reads/updates
  │
  ▼
Cascade continues...
```

**The problem:**
- Performance degradation (jank, frame drops)
- Hard to optimize because you cannot predict which views will re-render
- Difficult to reason about component lifecycle

### 5. No clear ownership of state

In Active View MVC, **any** controller can modify **any** model. There is no enforced boundary:

```ts
// productController.ts
export const createProduct = (req, res) => {
  // Mutates shared user model? Why not!
  UserModel.findById(req.userId).then(user => {
    user.lastActive = new Date();
    user.save();
  });
  
  // Also mutates product model
  ProductModel.create(req.body);
};
```

**The problem:** State changes happen in scattered places. There is no single place to look for "what changed the user's lastActive timestamp."

### 6. Tight coupling between layers

While MVC *theoretically* separates concerns, in practice the layers become coupled:

```ts
// Controller needs to know which view to call
// View needs to know which model fields to display
// Model needs to know which views are observing it

// The "separation" is organizational, not enforced
```

At Facebook, with thousands of engineers, this organizational separation was insufficient. You needed **architectural enforcement**.

---

## How Flux Addresses These Problems

Flux was Facebook's answer. Its core principles directly counter the Active View MVC problems:

| Active View MVC Problem | Flux Solution |
|---|---|
| Two-way binding / cycles | **Unidirectional data flow** — action → dispatcher → store → view. No cycles. |
| Implicit data flow | **Explicit actions** — every state change is triggered by a named action. You can trace it. |
| Shared mutable state | **Single source of truth per store** — stores own their data; only they mutate it. |
| Unpredictable re-renders | **Stores emit change events** — views re-render only when stores change, and only after the store is fully updated. |
| No clear ownership | **Stores own state** — only the store can mutate its own state, via action handlers. |
| Tight coupling | **Dispatcher as central hub** — all actions flow through one dispatcher, making dependencies explicit. |

### Flux architecture (simplified)

```text
┌─────────────┐     ┌──────────────┐     ┌─────────┐     ┌──────────┐
│    View     │────▶│    Action    │────▶│Dispatcher│     │  Store  │
│ (React UI)  │     │ (plain obj)  │     │ (hub)    │     │ (state) │
└─────────────┘     └─────────────┘     └─────────┘     └────┬────┘
     ▲                                                       │
     │                                                       │
     └───────────────────────────────────────────────────────┘
                      (store emits change → view re-renders)
```

**The rules:**
1. **Views dispatch actions** — they never mutate stores directly
2. **Actions are plain objects** — `{ type: "ADD_PRODUCT", payload: { ... } }`
3. **Dispatcher is the only path to stores** — all actions flow through it
4. **Stores register with the dispatcher** — they receive actions and update their own state
5. **Stores emit change events** — views listen and re-render
6. **No cycles** — data flows in one direction

```ts
// Flux-style action
const addProductAction = {
  type: "shop/add_product",
  payload: { id: "p1", title: "Laptop", price: 999 },
};

// View dispatches it
dispatch(addProductAction);

// Store receives it via dispatcher
shopStore.dispatchToken((action) => {
  if (action.type === "shop/add_product") {
    // Only the store mutates its own state
    this.products.push(action.payload);
    this.emitChange();
  }
});

// View re-renders on change
shopStore.onChange(() => {
  renderProductList(shopStore.getProducts());
});
```

### The philosophical difference

| | Active View MVC | Flux |
|---|---|---|
| **Data flow** | Circular, implicit | Linear, explicit |
| **State mutation** | Anyone can do it anywhere | Only stores mutate their own state |
| **Traceability** | Hard — "who changed this?" | Easy — every change has a named action |
| **Coupling** | Organizational (convention) | Architectural (enforced by dispatcher) |
| **Mental model** | "Tell the model what to do" | "Dispatch an action, let the system handle it" |

---

## Where This Matters for Our Course

Section 7 introduces MVC for **server-side** code (Node.js + Express), not client-side UI. The problems above are most acute in **rich client applications** (like Facebook's web app) where many components share state.

On the **server side**, MVC is still widely used and generally works well because:
- Request/response is inherently unidirectional (one request → one response)
- State is usually scoped to a single request
- There are far fewer "components" observing shared state

Flux (and later Redux) became popular primarily for **client-side state management** in React apps. The course will likely keep MVC for the server and may introduce Flux/Redux concepts later if it covers frontend architecture.

**Key takeaway:** MVC's problems are not that the pattern is "wrong" — it is that **implicit, bidirectional data flow does not scale** when many actors share mutable state. Flux enforces **explicit, unidirectional flow** to make state changes traceable and predictable.

---

## How to Distinguish the Two MVC Cases

Ask these questions about any MVC codebase:

| Question | Passive View (our course) | Active View (Flux/MVC problem) |
|---|---|---|
| Does the View exist after the response is sent? | No | Yes |
| Can the View call the Model? | No | Yes |
| Does the View hold a reference to the Model? | No | Yes |
| Does the Model notify the View of changes? | No | Yes |
| Is there persistent in-memory state shared across "pages"? | No | Yes |

### Concrete code comparison

#### Passive View (our course — correct)
```ts
// View: pure function, no references, no side effects
export function renderProductList(products: Product[]): string {
  return products.map(p => `<li>${p.title}</li>`).join("");
}

// Controller: orchestrates everything
export const getProducts = (req: Request, res: Response) => {
  const products = productModel.getAll(); // Controller asks Model
  const html = renderProductList(products); // Controller asks View
  res.send(html); // Controller sends response
  // View object never existed. No cycles possible.
};
```

#### Active View (client-side — the problematic kind)
```ts
// View object holds references to Model
class ProductListView {
  constructor(private model: ProductStore) {
    // View subscribes to Model changes
    this.model.on("change", () => this.render());
  }

  onUserClickAdd() {
    // View updates Model directly ← creates cycle
    this.model.addProduct({ id: "1", title: "New" });
  }

  render() {
    // View reads Model directly
    const products = this.model.getProducts();
    this.el.innerHTML = products.map(...).join("");
  }
}
```

In the second example, the View owns a reference to the Model and can mutate it. When it does, the Model notifies the View (and potentially 20 other views), creating the cascade problem Flux was designed to solve.

---

## TypeScript mapping

- **Passive View functions** should be typed as pure functions: `(data: T) => string`. No Express types imported.
- **Controllers** are where Express types live: `Request`, `Response`, `NextFunction`. This is the boundary where external framework types enter your code.
- **Models** should export **interfaces/types** for their data shapes, e.g. `Product` with `id`, `title`, `price`, `description`. This is where `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` earn their keep.
- **Routes** in `app.ts` remain thin wiring: `app.get("/products", shopController.getProducts)`.
- **verbatimModuleSyntax** enforces that view files (which need no Express types) use `import type` only for any shared interfaces, keeping the view layer framework-agnostic.

## Notes & gotchas
- The statement "View never calls Model or Controller" applies to **Passive View / server-side MVC** (our course).
- The statement "View can update Model directly" applies to **Active View / client-side MVC** (the flavor that caused Facebook's problems).
- These are not contradictory — they describe different architectural contexts.
- On the server, the view is a string, not an object. It cannot hold references or call anything.
- On the client, the view is a long-lived object that holds references and reacts to user input.
- MVC's problems are not that the pattern is "wrong" — it is that **implicit, bidirectional data flow does not scale** when many actors share mutable state.
- Flux enforces **explicit, unidirectional flow** to make state changes traceable and predictable.
