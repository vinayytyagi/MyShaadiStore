# myShaadiStore: Backend & Admin Panel – Build Plan

This document is the step-by-step plan to build the **backend API** and **Admin Panel** first, aligned with the DB design and API spec in `DB_DESIGN_AND_API_MODELING.md`. Theme matches the user panel designs: white/light grey background, **pink/fuchsia** primary actions, clean and modern.

---

## Phase 1: Backend Foundation

### Step 1.1 – Project setup
- [ ] Create `backend` folder (Node.js + Express).
- [ ] Initialize `package.json`: express, cors, dotenv, helmet, morgan.
- [ ] Folder structure: `src/` → `config/`, `models/`, `routes/`, `controllers/`, `services/`, `middleware/`, `utils/`.
- [ ] `.env.example`: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `RAZORPAY_*`, `SHIPROCKET_*`, `WEB3FORMS_*`.
- [ ] Entry: `src/index.js` – app listen, health route `GET /health`.

### Step 1.2 – Database (PostgreSQL)
- [ ] Choose driver: `pg` or ORM (e.g. `drizzle-orm` / `prisma`).
- [ ] Create schema from `DB_DESIGN_AND_API_MODELING.md` Section 1 (users, vendors, categories, marketplace_items, product_variants, weddings, budget_*, orders, order_items, payments, shipments, etc.).
- [ ] Add indexes from Section 1.19 (budget, location, guests).
- [ ] Seed: 1 admin user, 2–3 budget categories, 1–2 sample vendors/categories.

### Step 1.3 – Auth & RBAC
- [ ] `POST /auth/register` (customer only), `POST /auth/login` (email/password), `POST /auth/refresh`, `POST /auth/logout`.
- [ ] JWT middleware: verify token, attach `req.user` (userId, role).
- [ ] RBAC: `requireRole('admin')`, `requireRole('vendor')`, `requireRole('customer')`.
- [ ] `GET /auth/me` (protected).
- [ ] Guest session: `POST /auth/guest-session` (optional for Phase 1).

### Step 1.4 – Admin auth & base routes
- [ ] Admin login reuses `POST /auth/login` with role check (redirect/error if not admin).
- [ ] Mount admin routes under `/api/v1/admin`, all protected with `requireRole('admin')`.
- [ ] CORS: allow admin origin (e.g. `http://localhost:3001` for mss-admin).

---

## Phase 2: Admin Backend APIs (CRUD)

### Step 2.1 – Vendors (admin only)
- [ ] `GET /admin/vendors` – list (filters: status, page, limit).
- [ ] `GET /admin/vendors/:vendorId` – one vendor.
- [ ] `POST /admin/vendors` – add (name, contact, city, type, **commission_percentage**, etc.).
- [ ] `PUT /admin/vendors/:vendorId` – update.
- [ ] `PUT /admin/vendors/:vendorId/suspend` – set status suspended.
- [ ] `GET/PUT /admin/vendors/:vendorId/availability` – availability calendar.

### Step 2.2 – Categories (admin)
- [ ] `GET /admin/categories` – tree (parent_id for subcategories).
- [ ] `POST /admin/categories` – create (name, slug, parentId, sortOrder).
- [ ] `PUT /admin/categories/:categoryId` – update.
- [ ] `DELETE /admin/categories/:categoryId` – soft delete / deactivate.

### Step 2.3 – Products / Items / Venues (admin)
- [ ] `GET /admin/items` – list (vendorId, categoryId, item_type, status, page, limit).
- [ ] `GET /admin/items/:itemId` – one item + variants.
- [ ] `POST /admin/items` – add (vendorId, categoryId, name, price, item_type, **location**, **location_city**, capacity, etc.).
- [ ] `PUT /admin/items/:itemId` – update.
- [ ] `DELETE /admin/items/:itemId` – soft delete.
- [ ] `POST /admin/items/:itemId/variants` – add variant (sku, size, color, price, stock).
- [ ] `PUT /admin/items/:itemId/variants/:variantId` – update variant.
- [ ] Optional: `POST /admin/items/bulk-upload` – CSV (can be Phase 3).

### Step 2.4 – Budget rules (admin)
- [ ] `GET /admin/budget-rules` – list allocation rules.
- [ ] `POST /admin/budget-rules` – create (categoryId, percentage).
- [ ] `PUT /admin/budget-rules/:ruleId` – update.
- [ ] `DELETE /admin/budget-rules/:ruleId` – delete.

### Step 2.5 – Orders & shipments (admin)
- [ ] `GET /admin/orders` – list (status, vendorId, from, to, page, limit).
- [ ] `GET /admin/orders/:orderId` – detail (items, payments, shipments).
- [ ] `PUT /admin/orders/:orderId/status` – update status.
- [ ] `POST /admin/orders/:orderId/shipments` – create Shiprocket shipment (stub first; integrate later).

### Step 2.6 – Users, content, reports (admin)
- [ ] `GET /admin/users` – list (role, search, page, limit).
- [ ] `GET /admin/users/:userId`, `PUT /admin/users/:userId` – detail & update.
- [ ] `GET/PUT /admin/banners` – campaign banners.
- [ ] `GET/POST/PUT /admin/coupons` – coupons.
- [ ] `GET/PUT /admin/content-blocks/:key` – content blocks.
- [ ] `GET /admin/reports/sales`, `GET /admin/reports/vendors` – report data.
- [ ] `GET /admin/reports/export` – CSV export (query params: type, from, to).
- [ ] `GET /admin/activity-logs` – list logs (filters).
- [ ] `GET /admin/expenses`, `POST /admin/expenses` – cost/expense for reports.

### Step 2.7 – Dashboard aggregates (admin)
- [ ] `GET /admin/dashboard` – totalSales, totalVendors, totalOrders, revenueByPeriod (e.g. last 7/30 days).

---

## Phase 3: Admin Panel UI (mss-admin – Next.js)

### Step 3.1 – Theme & layout
- [ ] **Theme**: White/light grey background, **pink/fuchsia** (#ec4899 or Tailwind `pink-500`/`rose-500`) for primary buttons and accents (match user panel designs).
- [ ] Update `globals.css`: CSS variables for `--primary`, `--primary-hover`, `--background`, `--foreground`.
- [ ] Root layout: metadata (title “MyShaadiStore Admin”), font.
- [ ] **Admin layout**: sidebar + top bar + main content area.
  - Sidebar: logo “MyShaadiStore”, nav links (Dashboard, Vendors, Products, Categories, Orders, Users, Banners, Coupons, Budget Rules, Reports, Activity Logs, Settings/Logout).
  - Top bar: “Admin”, user name, logout.
- [ ] Responsive: collapse sidebar on small screens.

### Step 3.2 – Auth (login)
- [ ] Login page: `/login` – email, password, “Sign in” (pink primary button).
- [ ] On success: store token (e.g. localStorage or cookie), redirect to `/dashboard`.
- [ ] Protected layout: if no token or 401, redirect to `/login`.
- [ ] Logout: clear token, redirect to `/login`.

### Step 3.3 – Dashboard
- [ ] Page `/dashboard` (or `/` after login).
- [ ] Cards: Total Sales, Total Vendors, Total Orders, Revenue (period).
- [ ] Simple chart (e.g. revenue last 7 days) – optional with a small chart lib or placeholder.
- [ ] Quick links: Vendors, Products, Orders.

### Step 3.4 – Vendors
- [ ] List page: table (name, type, city, status, commission %, actions).
- [ ] Filters: status dropdown, search by name.
- [ ] “Add Vendor” button → form (modal or separate page): business name, description, type, city, contact, **commission_percentage**, status.
- [ ] Edit vendor: same form pre-filled.
- [ ] Suspend / Activate action.
- [ ] Optional: availability calendar view (read/edit) for a vendor.

### Step 3.5 – Categories
- [ ] List: tree or flat list with parent name (subcategories indented).
- [ ] Add category: name, slug, parent (dropdown), sort order.
- [ ] Edit / Delete (soft).

### Step 3.6 – Products / Items / Venues
- [ ] List: table (name, vendor, category, type, price, location, status, actions).
- [ ] Filters: vendor, category, item_type, status.
- [ ] “Add Product/Service/Venue”: form with vendor, category, name, description, price, item_type, **location**, **location_city**, capacity (for venue), status; image URL(s) or upload placeholder.
- [ ] Edit / Soft delete.
- [ ] Variants: on item detail, list variants; add variant (sku, size, color, price, stock); edit variant.

### Step 3.7 – Budget rules
- [ ] List: category name, percentage, active.
- [ ] Add rule: select category, percentage.
- [ ] Edit / Delete.

### Step 3.8 – Orders
- [ ] List: order number, customer, total, status, date.
- [ ] Filters: status, date range, vendor.
- [ ] Detail: order info, items, shipping, payment, shipments.
- [ ] Update status dropdown.
- [ ] “Create Shipment” button (calls `POST /admin/orders/:id/shipments` – stub or Shiprocket later).

### Step 3.9 – Users, Banners, Coupons, Reports
- [ ] Users: table, search, view/edit, suspend.
- [ ] Banners: list, add (image URL, link, position, dates), edit.
- [ ] Coupons: list, add (code, type, value, validity, limits), edit.
- [ ] Reports: sales summary, vendor summary; “Export CSV” button.
- [ ] Activity logs: table (actor, action, entity, date).
- [ ] Expenses: list, add (type, amount, period) for CPA/cost breakdown.

### Step 3.10 – Notification templates (optional)
- [ ] List email templates; enable/disable; edit subject/body (Web3Forms).

---

## Phase 4: Integrations (after core works)

### Step 4.1 – Razorpay
- [ ] Create order on checkout (customer API); confirm payment endpoint; webhook for payment.captured/failed.

### Step 4.2 – Shiprocket
- [ ] Implement `POST /admin/orders/:orderId/shipments` with Shiprocket API (label, AWB); store in `shipments`.
- [ ] Tracking: poll or webhook, store in `shipment_tracking_events`.

### Step 4.3 – Web3Forms
- [ ] Send email helper (order placed, status update); log in `notification_logs`.

### Step 4.4 – Fuzzy search
- [ ] Search API using DB fuzzy (e.g. pg_trgm) or in-app; used by customer app later.

---

## Build Order Summary

| Order | What |
|-------|------|
| 1 | Backend: project setup, DB schema, auth, RBAC |
| 2 | Backend: Admin APIs (vendors, categories, items, budget rules, orders, users, dashboard, reports, activity, expenses) |
| 3 | Admin UI: theme, layout, login, dashboard |
| 4 | Admin UI: Vendors, Categories, Products/Items, Budget Rules, Orders, Users, Banners, Coupons, Reports, Activity Logs |
| 5 | Integrations: Razorpay, Shiprocket, Web3Forms (and fuzzy search as needed) |

---

## Tech Stack (aligned with existing)

- **Backend**: Node.js, Express, PostgreSQL (pg or Drizzle/Prisma), JWT.
- **Admin**: Next.js 16 (mss-admin), React 19, Tailwind CSS 4, same theme as user panel (pink/fuchsia primary).

Files to create/update next:
- `backend/` – full API project.
- `mss-admin/src/app/*` – layout, login, dashboard, admin sections with same theme.
