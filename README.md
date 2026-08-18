# Food Ordering App

An order management feature for a food delivery app, built for the RaftLabs Senior Full Stack Developer assessment.

You browse a menu, add items to a cart, enter your delivery details, and then watch the order move through its stages — the backend advances the status on its own, so it changes while you are looking at it.

**Repository:** https://github.com/akib-dabgar/food-delivery-order-management

**Live app:** _deploying to Render — link will be added here once it is up and checked_

---

## What it does

- **Menu** — food items with a photo, name, description and price, loaded from the API.
- **Cart** — add items, change quantity with + / − buttons, remove a line. Adding the same dish twice merges into one line instead of creating a duplicate, and dropping a quantity to zero removes it.
- **Checkout** — name, address and phone, validated in the browser and again on the server.
- **Order status** — each order gets its own URL. The page polls the API and shows progress through `Order received → Preparing → Out for delivery → Delivered`.
- **Automatic progress** — a timer on the server moves each order forward, so no one has to click anything to simulate delivery.

---

## Tech stack

| Part | Used |
|---|---|
| Frontend | React 19, Vite, TypeScript, React Router, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Validation | Zod on the server, a matching check on the client |
| Storage | In-memory |
| Tests | Vitest, with Supertest for the API and React Testing Library for the UI |

TypeScript runs in strict mode on both sides.

---

## Running it locally

You need **Node.js 20.19 or newer**.

```bash
npm install
```

Then open two terminals.

**Terminal 1 — backend:**

```bash
npm run dev:server
```

**Terminal 2 — frontend:**

```bash
npm run dev:client
```

Open **http://localhost:5173**. The API runs on port 3001.

> If port 5173 is already busy, Vite picks the next free port and prints it — use whatever the terminal shows.

The Vite dev server forwards `/api` to the backend, so the browser only ever talks to one origin. That means there is no CORS setup to worry about, and development behaves the same way production does.

By default an order takes 15 seconds per stage. To watch it move faster while demoing:

```bash
STATUS_STEP_MS=3000 npm run dev:server
```

### Settings

Both are optional. There is no `dotenv` package, so set them in your terminal or in your hosting dashboard.

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `3001` | Port the API listens on |
| `STATUS_STEP_MS` | `15000` | How long an order sits on each status |

---

## Project layout

```
client/                 React frontend
  public/images/        menu photos, bundled with the app
  src/
    types/              all types and interfaces, re-exported from one index
    lib/                API calls, validation, formatting, shared styles
    components/         Header, MenuItemCard, CartPanel, CartItemRow,
                        CheckoutForm, StatusTracker, icons
    pages/              MenuPage, CheckoutPage, OrderStatusPage
    cart/               cart state (useReducer + context)
    styles/             Tailwind entry and colour tokens

server/                 Express API
  src/
    types/              shared types
    routes/             menu and order endpoints
    schemas/            Zod validation
    services/           pricing, status rules, the delivery simulator
    store/              in-memory order storage
    middleware/         error handling
```

Tests sit next to the file they cover, named `*.test.ts` or `*.test.tsx`.

---

## API

Everything lives under `/api` and returns JSON.

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/menu` | List menu items |
| `POST` | `/api/orders` | Place an order |
| `GET` | `/api/orders/:id` | Fetch one order — used by the status page |
| `PATCH` | `/api/orders/:id/status` | Move an order to the next status |

**Placing an order:**

```json
{
  "customer": {
    "name": "Akib Dabgar",
    "address": "A-204, Sola Road, Ahmedabad 380060",
    "phone": "9876543210"
  },
  "items": [{ "menuItemId": "m1", "quantity": 2 }]
}
```

Returns `201` with the created order. Notice the request only contains item ids and quantities — see the note on pricing below.

**Errors** all come back in the same shape:

```json
{
  "error": {
    "message": "Invalid order payload",
    "details": [{ "path": "items.0.quantity", "message": "quantity must be at least 1" }]
  }
}
```

`400` for bad input, an unknown menu item, an illegal status jump or broken JSON. `404` for an order or route that does not exist.

---

## Tests

```bash
npm test
```

That runs both sides — **162 tests** in total, 100 for the backend and 62 for the UI.

Type checking is separate, and it covers the test files too:

```bash
npm run typecheck
```

**What is covered:** menu loading, order creation and retrieval, status updates, price handling, 23 different invalid inputs, every status transition rule, the timer-driven progress, and on the UI side the loading, error and empty states, all the cart operations, checkout validation and the status polling.

No test waits on real time — the timers are faked, so the whole suite finishes in a few seconds.

---

## Build and deploy

```bash
npm run build
npm start
```

`npm run build` compiles the backend and bundles the frontend. `npm start` runs the server, which also serves the built frontend from the same address — one process, one URL, nothing to configure between them.

Since the frontend is a single-page app, the server sends `index.html` for any non-API page request. That is what lets you refresh or share a link like `/orders/abc123` and still land on the right page.

### Deploying to Render

One Web Service handles everything — there is no separate frontend host.

| Setting | Value |
|---|---|
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm start` |
| Environment | `Node` |

`--include=dev` matters. Render sets `NODE_ENV=production`, which makes npm skip devDependencies, and TypeScript, Vite and Tailwind all live there — without the flag the build fails before it starts. Nothing from devDependencies is needed once the app is running; the server only needs Express and Zod at runtime.

`PORT` is provided by Render automatically. `STATUS_STEP_MS` is optional and controls how fast an order moves between stages.

---

## Some decisions worth explaining

**The server decides prices, not the client.** The order request only carries `menuItemId` and `quantity`. The server looks up each price from the menu and calculates the total itself. So even if someone edits the request and sends `price: 1`, the order still comes back at the correct amount. There is a test for exactly that.

**One list defines the whole status flow.** A single `ORDER_STATUSES` array produces the TypeScript type, the Zod validation, the rule for which transitions are allowed, and the simulator's "what comes next" function. They cannot fall out of sync, because they all read from the same place.

**The app is built separately from the server that runs it.** `createApp()` returns the Express app without starting it, so tests can drive it directly instead of spinning up a real port.

**Errors are handled in one place.** Services throw an `HttpError` carrying its status code, and a single error handler turns it into a response. Route handlers stay three or four lines long with no try/catch, and every error looks the same.

**Order status uses polling, not websockets.** The status page asks the API every 3 seconds and stops as soon as the order is delivered, or if the page is closed. Real-time updates were optional in the brief, and polling is a few lines that work anywhere.

---

## Known limitations

**Data lives in memory.** Orders are stored in a `Map`, so restarting the server clears them and an old order link will show a "not found" message. The brief allowed in-memory storage and nothing here needs a database, so I left it out rather than adding one for its own sake.

**The cart is not saved.** Refreshing the menu page empties it. Saving the cart was listed as optional, so I skipped it.

**No login or payment.** Neither was part of the brief.

---

## Design

The colours are set once as tokens in `client/src/styles/index.css`:

| Colour | Hex | Where it is used |
|---|---|---|
| Green | `#15803D` | prices, buttons, completed steps |
| Amber | `#F59E0B` | only for "this order is still in progress" |
| Off-white | `#F4F6F4` | page background |
| Dark grey | `#111827` | headings and text |
| Grey | `#5B6673` | descriptions and small print |

Amber is deliberately used for one thing only, so a glance at the status page tells you whether something is still moving. The background is kept plain so the food photos stand out.

The layout is one column on a phone, two on a tablet and three on a desktop, with the cart moving into a sidebar on wide screens. Hover effects are switched off on touch devices, and animation is disabled if the visitor has reduced motion turned on in their system settings.

Menu photos come from [Unsplash](https://unsplash.com) under the Unsplash licence and are stored in the repo rather than linked from another site, so nothing breaks if that site changes.

---

## How I used AI

I used Claude while building this, and the brief asks for an honest account, so here it is.

I used it for planning the work into phases, writing a lot of the first-draft code on both sides, drafting the test suites, and writing documentation. I worked one phase at a time — backend menu, then orders, then the status simulation, then the UI — and reviewed and ran everything before moving on.

What matters is that generated code was not taken at face value. Some things I caught and corrected:

- A test claimed to check that a cart line disappeared, but it was passing for the wrong reason and would have passed even if the feature broke. I rewrote it.
- For the two most important tests — that status polling stops when an order is delivered, and when the page closes — I deliberately broke the source code to confirm the tests actually failed, then put it back. A test that never fails is not protecting anything.
- Type errors inside test files were slipping through until I added a second TypeScript config that includes them.
- Deploying would have broken on a page refresh, because the server had no fallback for single-page app routes. I found this by running the production build rather than trusting the dev server.
- The cart let you pick a quantity the server would reject, so you only found out at checkout. I capped it on the client to match.

I also ran the finished app in a browser against the real backend, not just in tests, to confirm the whole flow works end to end.
