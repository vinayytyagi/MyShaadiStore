# myShaadiStore: Database Design & API Modeling

This document provides a detailed database schema and REST API specification for the myShaadiStore platform, covering the Customer App, Vendor Panel, Admin Panel, Smart Budget Engine, Logistics & Payment, Search & Discovery, and Analytics & Reporting.

---

## Project Summary: What We're Building & How

### What we're building

**Two main applications (plus Vendor Panel):**  
**(1) User Web App** – for customers (wedding planning + marketplace + orders).  
**(2) Admin Panel** – for platform admins: **adds all vendors and all products/venues** (with category, subcategory, vendor, location, etc.), config, orders, content, reports, analytics.  
**(3) Vendor Panel** – **view-only** for vendors: see their products, which product sold how much, purchase/sell details, graphs and analytics. Vendors **cannot add or edit** any product or data.  
All three consume the same backend API and database.

- **1. User Web App (Customer side)**  
  Wedding planning + marketplace: set date & budget → smart budget split → journey (Venue → Programs → Shopping → Gifts → Honeymoon) → discover vendors & products → cart → checkout (guest or logged-in) → orders, tracking (Shiprocket), wishlist, reviews. Plus curated packages, honeymoon, PWA, push and **email notifications (via Web3Forms)** for orders and status updates, abandoned-cart emails.

- **2. Vendor Panel (View only)**  
  Vendors **only view**: dashboard with stats and graphs, list of their products (assigned by admin), which product is selling how much, purchase/sell details, revenue, order counts. **No add/edit products, no bulk upload, no order accept/reject, no shipment creation, no promotions.** Admin does all data entry.

- **3. Admin Panel**  
  **Admin adds all vendors** (with commission % for admin’s reference to pay vendor manually outside the system). **Admin adds all products/venues** with category, subcategory, vendor, location (for venue), etc. Dashboard → budget allocation % rules → categories & subcategories → products/items/venues CRUD → curated/honeymoon packages → coupons & banners → orders (create Shiprocket shipments from here) → users → content → activity logs → reports & CSV → notification triggers. **No in-app commission or payout**; client pays vendors manually; commission % stored only for admin’s record.

- **4. Smart Budget Engine**  
  Unchanged: distribute budget by admin rules; filter vendors/items by category budget; premium options when budget increases; real-time allocated vs remaining.

- **5. Payments & Logistics**  
  **Payment: Razorpay only** (UPI, cards, wallets). **Order tracking: Shiprocket only** (no multi-carrier). Shipping rules (weight/location, free-shipping threshold) and label/shipment creation done from **Admin** (or backend when order is confirmed).

- **6. Search & Discovery**  
  **Fuzzy search** (no Elasticsearch): e.g. PostgreSQL `pg_trgm` or app-level fuzzy matching; autocomplete and filters (price, category, occasion, color, size, location).

- **7. Notifications**  
  **Email via Web3Forms** for order and status emails. No SMS/WhatsApp in scope unless added later.

- **8. Analytics & Reporting**  
  Sessions/users, sales, payment-method split, traffic, CPA, conversion, vendor-wise sales, fulfillment time, SLA alerts, low-stock, coupon usage, device split, AOV, cart abandonment, checkout drop-off, top pages, journey, heatmaps, best/low-selling products, product conversion, inventory turnover, refunds, new vs returning, CLV, repeat rate, churn, gross margin, net profit, cost breakdown.

### How we're going to make it (high-level steps)

1. **Backend API** – REST API with auth (JWT + social + guest). Admin-only: vendor CRUD, product/venue CRUD (category, subcategory, vendor, location). Vendor panel: read-only APIs (dashboard, my products, sales stats, graphs). Customer: wedding, marketplace, cart, checkout, orders, tracking.
2. **Database** – Relational DB (e.g. PostgreSQL) with schema in Section 1. **Fuzzy search** on DB (e.g. `pg_trgm`) or in-app; no Elasticsearch.
3. **User Web App** – SPA/PWA for customers: wedding flow, marketplace, cart, checkout, orders, Shiprocket tracking, wishlist, reviews.
4. **Vendor Panel** – View-only UI: dashboard, product list, sales/purchase stats, graphs (all read-only).
5. **Admin Panel** – Full CRUD: add/edit vendors (with commission %), add/edit all products/venues (category, subcategory, vendor, location), categories, packages, coupons, banners, orders, Shiprocket shipment creation, users, content, reports, CSV, analytics.
6. **Integrations** – **Razorpay** (payment + webhooks), **Shiprocket** (tracking + label/shipment from admin), **Web3Forms** (email notifications).
7. **Analytics** – Sessions, page_views, cart_events, checkout_steps; report APIs; optional expenses for CPA/cost breakdown.

---

## Scope Verification (SOW vs This Document)

| SOW Feature | Covered in DB/API | Notes |
|-------------|-------------------|--------|
| **Module 1 – User Web App** | | |
| Wedding Date Selection | ✓ `weddings.wedding_date`, calendar UI uses GET/PUT `/weddings` | |
| Wedding Budget Entry (range) | ✓ `weddings.total_budget`, optional `budget_min`/`budget_max` | UI can show range selector; schema supports single value or range (see Gaps below) |
| Smart Budget Allocation Engine | ✓ `budget_categories`, `wedding_budget_allocations`, `budget_allocation_rules`, POST `/weddings/:id/budget-allocation/auto` | |
| Real-Time Budget Recalculation | ✓ PUT `/weddings/:id` triggers recalc; GET budget-allocation | |
| Guided Wedding Journey Flow | ✓ `wedding_journey_progress`, `current_journey_step`, journey-progress APIs | |
| Vendor Discovery | ✓ `vendors`, `vendor_availability`, GET `/vendors` with filters | |
| Product & Service Marketplace | ✓ `marketplace_items`, GET `/marketplace/items` | |
| Advanced Smart Filters (date, location, guest count, budget, **function count**, category) | ✓ Query params on `/vendors` and `/marketplace/items`; `function_count` added | |
| Guest Count Calculator | ✓ `weddings.guest_count`, `estimated_*_needs`, GET `guest-needs-estimate` | |
| Venue Selection Module | ✓ Filters: capacity, city, price, date; `marketplace_items.capacity`, `vendor_availability` | |
| Program Planner | ✓ `wedding_program_functions`, programs CRUD APIs | |
| Invitation Marketplace | ✓ `item_type` Invitation, `theme`, price filters | |
| Catering & Décor Filtering | ✓ `per_plate_*`, `cuisine_options`, `dietary_options`, `theme` | |
| Bride & Groom Shopping | ✓ `for_gender`, budget filters | |
| Return Gift Marketplace | ✓ `bulk_pricing_*`, `budget_per_gift_*` filters | |
| Honeymoon Suggestions | ✓ `honeymoon_packages`, GET `/packages/honeymoon` | |
| Curated Wedding Collections | ✓ `wedding_packages`, `wedding_package_items`, GET `/packages/wedding` | |
| Guest Checkout | ✓ `guest_checkout_sessions`, `orders.guest_session_id` | |
| Social Login | ✓ `social_accounts`, POST `/auth/social` | |
| Order Placement (Razorpay) | ✓ `orders`, `payments`, POST `/orders`, confirm-payment | |
| Order Tracking | ✓ `shipments`, `shipment_tracking_events`, GET `/orders/:id/tracking` (Shiprocket only) | |
| Notifications (Email via Web3Forms) | ✓ `notification_templates`, `notification_logs`; email sent via Web3Forms | |
| Wishlist | ✓ `wishlists`, wishlist APIs | |
| Ratings & Reviews | ✓ `reviews`, review APIs for vendor & product | |
| Abandoned Cart Recovery | ✓ `abandoned_cart_reminders`, `carts`, `cart_events` | |
| PWA Support | ✓ Front-end; API is stateless and supports PWA | |
| Push Notifications | ✓ `user_push_tokens`, POST `/notifications/push-subscribe` | |
| **Module 2 – Vendor Panel (view-only)** | | |
| Vendor Dashboard (view) | ✓ GET `/vendor/dashboard` (stats, graphs) | Admin adds vendors; vendor only views |
| Product listing (view) | ✓ GET `/vendor/items` – read-only list of products assigned to vendor | Admin adds all products |
| Sales / purchase stats & graphs | ✓ GET `/vendor/analytics`, `/vendor/orders` (read-only) | No add/edit from vendor |
| **Module 3 – Admin Panel** | | |
| Admin adds vendors | ✓ POST `/admin/vendors` (with `commission_percentage` for admin’s manual payout reference) | |
| Admin adds products/venues (category, subcategory, vendor, location) | ✓ POST `/admin/items`, categories tree, `marketplace_items.location` for venue | |
| All other admin features | ✓ Dashboard, budget rules, categories, packages, offers, banners, content, orders, Shiprocket shipments, users, activity logs, reports, notification templates | No in-app commission/payout |
| **Module 4 – Smart Budget Engine** | | |
| All 5 features | ✓ Budget logic, dynamic vendor filtering, budget upgrade (is_premium), consumption tracker (allocations API), configurable rules | |
| **Module 5 – Logistics & Payment** | | |
| Shiprocket only (tracking + labels) | ✓ Shiprocket integration; `shipments`, `shipment_tracking_events`; admin creates shipments | |
| Razorpay only | ✓ `payments` gateway = Razorpay | |
| **Module 6 – Search & Discovery** | | |
| Fuzzy search (no Elasticsearch), autocomplete, advanced filtering | ✓ Section 1.17: fuzzy search (e.g. pg_trgm); GET `/search`, `/search/autocomplete` | |
| **Analytics & Reporting** | | |
| All listed metrics | ✓ Section 2.13; tables: `sessions`, `page_views`, `cart_events`, `checkout_steps`, `user_clicks`, `expenses`; `product_variants.cost_price` for COGS | |

### Gaps addressed in this document

- **Budget range (SOW):** Schema now includes optional `weddings.budget_min` and `weddings.budget_max`. You can use only `total_budget` (UI sends one value from a range) or store the range.
- **Function count filter (SOW):** Optional query param `function_count` added to GET `/vendors` and GET `/marketplace/items` for advanced smart filters.
- **COGS and expense tracking (Analytics):** For Gross Margin, Net Profit, Cost Breakdown, and CPA: added optional `product_variants.cost_price` (COGS) and table `expenses` (marketing, operations, logistics) so these reports are implementable.

---

## Table of Contents

- [Project Summary: What We're Building & How](#project-summary-what-were-building--how)
- [Scope Verification (SOW vs This Document)](#scope-verification-sow-vs-this-document)
1. [Database Design](#1-database-design)
   - [1.19 Indexing (Budget, Location, Guests)](#119-indexing-for-budget-location--guest-based-filtering)
2. [API Modeling](#2-api-modeling)

---

# 1. Database Design

## 1.1 Conventions

- **Primary keys:** UUID unless noted.
- **Timestamps:** `created_at`, `updated_at` (TIMESTAMP, default CURRENT_TIMESTAMP / ON UPDATE).
- **Soft delete:** Use `deleted_at` (TIMESTAMP, NULL) where applicable.
- **Currency:** Store amounts in smallest unit (paise) or DECIMAL(12,2) with currency code.

---

## 1.2 Core & Identity

### 1.2.1 `users`

| Column           | Type         | Constraints | Description                    |
|------------------|--------------|-------------|--------------------------------|
| user_id          | UUID         | PK          |                                |
| email            | VARCHAR(255) | UNIQUE, NULL| NULL for guest-only users      |
| password_hash    | VARCHAR(255) | NULL        | NULL for social-only           |
| first_name       | VARCHAR(100) |             |                                |
| last_name        | VARCHAR(100) |             |                                |
| phone_number     | VARCHAR(20)  | UNIQUE, NULL|                                |
| role             | ENUM         | NOT NULL    | `customer`, `vendor`, `admin`  |
| email_verified_at| TIMESTAMP    | NULL        |                                |
| phone_verified_at| TIMESTAMP    | NULL        |                                |
| is_active        | BOOLEAN      | DEFAULT true|                                |
| created_at       | TIMESTAMP    |             |                                |
| updated_at       | TIMESTAMP    |             |                                |
| deleted_at       | TIMESTAMP    | NULL        |                                |

### 1.2.2 `social_accounts`

| Column        | Type         | Constraints | Description                          |
|---------------|--------------|-------------|--------------------------------------|
| id            | UUID         | PK          |                                      |
| user_id       | UUID         | FK(users)   |                                      |
| provider      | VARCHAR(50)  | NOT NULL    | `google`, `facebook`, `apple`         |
| provider_id   | VARCHAR(255) | NOT NULL    | External ID from provider            |
| access_token  | TEXT         | NULL        | Optional, for server-side calls      |
| refresh_token | TEXT         | NULL        |                                      |
| created_at    | TIMESTAMP    |             |                                      |
| updated_at    | TIMESTAMP    |             |                                      |
| UNIQUE(provider, provider_id) |   |             |                                      |

### 1.2.3 `guest_checkout_sessions`

| Column       | Type         | Constraints | Description                    |
|--------------|--------------|-------------|--------------------------------|
| id           | UUID         | PK          |                                |
| session_token| VARCHAR(255) | UNIQUE      | Cookie/session identifier      |
| email        | VARCHAR(255) | NULL        |                                |
| phone        | VARCHAR(20)  | NULL        |                                |
| first_name   | VARCHAR(100) | NULL        |                                |
| last_name    | VARCHAR(100) | NULL        |                                |
| created_at   | TIMESTAMP    |             |                                |
| expires_at   | TIMESTAMP    |             |                                |

Used for guest checkout; orders can link to `user_id` (nullable) or `guest_checkout_session_id`.

---

## 1.3 Wedding & Budget (Module 1 + Module 4)

### 1.3.1 `weddings`

| Column                    | Type          | Constraints | Description |
|---------------------------|---------------|-------------|-------------|
| wedding_id                | UUID          | PK          |             |
| user_id                   | UUID          | FK(users)   |             |
| wedding_date              | DATE          | NOT NULL    |             |
| total_budget              | DECIMAL(12,2) |             | Single value; UI can use range selector |
| budget_min                | DECIMAL(12,2) | NULL        | Optional: store range (SOW "budget range") |
| budget_max                | DECIMAL(12,2) | NULL        | Optional: store range (SOW "budget range") |
| currency                  | VARCHAR(3)    | DEFAULT INR |             |
| guest_count               | INT           |             |             |
| current_journey_step      | VARCHAR(50)   |             | Venue, Programs, Shopping, Gifts, Honeymoon, Completed |
| estimated_catering_needs  | JSON/TEXT     | NULL        | Calculated  |
| estimated_seating_needs   | JSON/TEXT     | NULL        |             |
| estimated_gift_needs      | JSON/TEXT     | NULL        |             |
| created_at                | TIMESTAMP     |             |             |
| updated_at                | TIMESTAMP     |             |             |

### 1.3.2 `budget_categories`

| Column       | Type         | Constraints | Description |
|--------------|--------------|-------------|-------------|
| category_id  | UUID         | PK          |             |
| name         | VARCHAR(100) | UNIQUE      | Venue, Catering, Décor, etc. |
| description  | TEXT         | NULL        |             |
| sort_order   | INT          | DEFAULT 0   |             |
| created_at   | TIMESTAMP    |             |             |
| updated_at   | TIMESTAMP    |             |             |

### 1.3.3 `budget_allocation_rules` (Admin-configurable, Module 4)

| Column         | Type          | Constraints | Description |
|----------------|---------------|-------------|-------------|
| rule_id        | UUID          | PK          |             |
| category_id    | UUID          | FK(budget_categories) |     |
| percentage     | DECIMAL(5,2)  | NOT NULL    | 0–100       |
| min_budget     | DECIMAL(12,2) | NULL        | Optional floor |
| max_budget     | DECIMAL(12,2) | NULL        | Optional cap |
| is_active      | BOOLEAN       | DEFAULT true|             |
| created_at     | TIMESTAMP     |             |             |
| updated_at     | TIMESTAMP     |             |             |

### 1.3.4 `wedding_budget_allocations`

| Column          | Type          | Constraints | Description |
|-----------------|---------------|-------------|-------------|
| allocation_id   | UUID          | PK          |             |
| wedding_id      | UUID          | FK(weddings)|             |
| category_id     | UUID          | FK(budget_categories) |  |
| allocated_amount| DECIMAL(12,2) | NOT NULL    |             |
| actual_spent    | DECIMAL(12,2) | DEFAULT 0   |             |
| created_at      | TIMESTAMP     |             |             |
| updated_at      | TIMESTAMP     |             |             |
| UNIQUE(wedding_id, category_id) |   |             |             |

### 1.3.5 `wedding_journey_progress`

| Column       | Type         | Constraints | Description |
|--------------|--------------|-------------|-------------|
| id           | UUID         | PK          |             |
| wedding_id   | UUID         | FK(weddings)|             |
| step_name    | VARCHAR(50)  |             | Venue, Programs, Shopping, Gifts, Honeymoon |
| status       | ENUM         |             | NotStarted, InProgress, Completed |
| completed_at | TIMESTAMP    | NULL        |             |
| created_at   | TIMESTAMP    |             |             |
| updated_at   | TIMESTAMP    |             |             |
| UNIQUE(wedding_id, step_name) |   |             |             |

### 1.3.6 `wedding_program_functions`

| Column        | Type          | Constraints | Description |
|---------------|---------------|-------------|-------------|
| function_id   | UUID          | PK          |             |
| wedding_id    | UUID          | FK(weddings)|             |
| name          | VARCHAR(100)  |             | Haldi, Mehendi, Sangeet, Ceremony, Reception |
| date          | DATE          | NULL        |             |
| time          | TIME          | NULL        |             |
| location_name | VARCHAR(255)  | NULL        |             |
| estimated_cost| DECIMAL(12,2) | NULL        |             |
| actual_cost   | DECIMAL(12,2) | DEFAULT 0   |             |
| status        | ENUM          |             | Planned, InProgress, Completed, Cancelled |
| created_at    | TIMESTAMP     |             |             |
| updated_at    | TIMESTAMP     |             |             |

---

## 1.4 Vendors (Module 1 + Module 2)

### 1.4.1 `vendors`

| Column          | Type          | Constraints | Description |
|-----------------|---------------|-------------|-------------|
| vendor_id            | UUID          | PK          |             |
| user_id              | UUID          | FK(users) NULL | Optional: for vendor login to view panel; admin creates vendor and can link user |
| business_name        | VARCHAR(255)  | NOT NULL    |             |
| slug                 | VARCHAR(255)  | UNIQUE      | URL slug    |
| description          | TEXT          | NULL        |             |
| vendor_type          | VARCHAR(50)   |             | Venue, Catering, Decor, Photographer, Makeup Artist, Invitation, Return Gift, etc. |
| city                 | VARCHAR(100)  | NULL        |             |
| state                | VARCHAR(100)  | NULL        |             |
| pincode              | VARCHAR(20)   | NULL        |             |
| address_line         | TEXT          | NULL        |             |
| contact_email        | VARCHAR(255)  | NULL        |             |
| contact_phone        | VARCHAR(20)   | NULL        |             |
| rating_avg           | DECIMAL(2,1)  | NULL        | Computed/cached |
| rating_count         | INT           | DEFAULT 0   |             |
| min_budget           | DECIMAL(12,2) | NULL        |             |
| max_budget           | DECIMAL(12,2) | NULL        |             |
| commission_percentage| DECIMAL(5,2)  | NULL        | Admin's reference only: % for paying vendor manually outside system |
| status               | ENUM          |             | Active, Inactive, Suspended (admin adds vendor; no approval workflow) |
| created_at           | TIMESTAMP     |             |             |
| updated_at           | TIMESTAMP     |             |             |
| deleted_at           | TIMESTAMP     | NULL        |             |

### 1.4.2 `vendor_availability`

| Column          | Type    | Constraints | Description |
|-----------------|---------|-------------|-------------|
| availability_id | UUID    | PK          |             |
| vendor_id       | UUID    | FK(vendors) |             |
| available_date  | DATE    | NOT NULL    |             |
| is_available   | BOOLEAN | DEFAULT true|             |
| created_at      | TIMESTAMP |           |             |
| updated_at      | TIMESTAMP |           |             |
| UNIQUE(vendor_id, available_date) | |   |             |

---

## 1.5 Categories & Taxonomy (Admin)

### 1.5.1 `categories`

| Column       | Type         | Constraints | Description |
|--------------|--------------|-------------|-------------|
| category_id  | UUID         | PK          |             |
| name         | VARCHAR(100) | NOT NULL    |             |
| slug         | VARCHAR(100) | UNIQUE      |             |
| parent_id    | UUID         | FK(categories) NULL | For subcategories |
| description  | TEXT         | NULL        |             |
| image_url    | VARCHAR(500) | NULL        |             |
| sort_order   | INT          | DEFAULT 0   |             |
| is_active    | BOOLEAN      | DEFAULT true|             |
| created_at   | TIMESTAMP    |             |             |
| updated_at   | TIMESTAMP    |             |             |

Use for marketplace categories (Lehenga, Sherwani, Jewelry, Decor, etc.) and optionally map to `budget_categories`.

---

## 1.6 Marketplace: Products & Services (Module 1 + Module 2)

### 1.6.1 `marketplace_items`

| Column                 | Type          | Constraints | Description |
|------------------------|---------------|-------------|-------------|
| item_id                | UUID          | PK          |             |
| vendor_id              | UUID          | FK(vendors) NULL | Platform-owned items |
| category_id            | UUID          | FK(categories) NULL |         |
| name                   | VARCHAR(255)  | NOT NULL    |             |
| slug                   | VARCHAR(255)  | UNIQUE      |             |
| description            | TEXT          | NULL        |             |
| short_description      | VARCHAR(500)  | NULL        |             |
| price                  | DECIMAL(12,2) |             | Base price  |
| compare_at_price       | DECIMAL(12,2) | NULL        | MRP/strikethrough |
| item_type              | ENUM          |             | Product, Service, Invitation, ReturnGift |
| category_tag           | VARCHAR(100)  | NULL        | Lehenga, Sherwani, Jewelry, Decor, Catering, etc. |
| for_gender             | ENUM          | NULL        | Bride, Groom, Unisex |
| bulk_pricing_available | BOOLEAN       | DEFAULT false |         |
| min_quantity_for_bulk  | INT           | NULL        |             |
| bulk_price_per_unit    | DECIMAL(12,2) | NULL        |             |
| theme                  | VARCHAR(100)  | NULL        | Invitations/decor |
| cuisine_options        | JSON          | NULL        | Catering    |
| dietary_options        | JSON          | NULL        | veg, non-veg |
| per_plate_min_price    | DECIMAL(12,2) | NULL        |             |
| per_plate_max_price    | DECIMAL(12,2) | NULL        |             |
| capacity               | INT           | NULL        | Venues      |
| location               | VARCHAR(255)  | NULL        | **Venue location** (address/area); admin fills when adding venue |
| location_city         | VARCHAR(100)  | NULL       | City for venue/location filtering |
| is_premium             | BOOLEAN       | DEFAULT false | Budget upgrade logic |
| min_budget             | DECIMAL(12,2) | NULL        | For filtering |
| max_budget             | DECIMAL(12,2) | NULL        |             |
| status                 | ENUM          |             | Draft, Active, Inactive, OutOfStock |
| created_at             | TIMESTAMP     |             |             |
| updated_at             | TIMESTAMP     |             |             |
| deleted_at             | TIMESTAMP     | NULL        |             |

### 1.6.2 `product_variants`

| Column       | Type          | Constraints | Description |
|--------------|---------------|-------------|-------------|
| variant_id   | UUID          | PK          |             |
| item_id      | UUID          | FK(marketplace_items) |     |
| sku          | VARCHAR(100)  | UNIQUE      |             |
| name         | VARCHAR(255)  | NULL        | e.g. "Red / L" |
| size         | VARCHAR(50)   | NULL        |             |
| color        | VARCHAR(50)   | NULL        |             |
| customizations| JSON          | NULL        |             |
| price        | DECIMAL(12,2) |             | Override or same as item |
| cost_price   | DECIMAL(12,2) | NULL        | COGS for Gross Margin / Net Profit reports |
| stock_quantity| INT           | DEFAULT 0   |             |
| low_stock_threshold | INT   | NULL        | For alerts   |
| is_active    | BOOLEAN       | DEFAULT true|             |
| created_at   | TIMESTAMP     |             |             |
| updated_at   | TIMESTAMP     |             |             |

### 1.6.3 `item_media`

| Column     | Type         | Constraints | Description |
|------------|--------------|-------------|-------------|
| id         | UUID         | PK          |             |
| item_id    | UUID         | FK(marketplace_items) |     |
| variant_id | UUID         | FK(product_variants) NULL |    |
| media_type | ENUM         |             | image, video |
| url        | VARCHAR(500) | NOT NULL    |             |
| sort_order | INT          | DEFAULT 0   |             |
| created_at | TIMESTAMP    |             |             |

---

## 1.7 Curated Packages & Honeymoon (Module 1)

### 1.7.1 `wedding_packages`

| Column        | Type         | Constraints | Description |
|---------------|--------------|-------------|-------------|
| package_id    | UUID         | PK          |             |
| name          | VARCHAR(255) | NOT NULL    | e.g. Wedding under 5L, Royal Wedding 25L |
| slug          | VARCHAR(255) | UNIQUE      |             |
| description   | TEXT         | NULL        |             |
| total_budget  | DECIMAL(12,2)|             |             |
| package_type  | VARCHAR(50)  | NULL        | budget_based, theme_based |
| image_url     | VARCHAR(500) | NULL        |             |
| is_active     | BOOLEAN      | DEFAULT true|             |
| created_at    | TIMESTAMP    |             |             |
| updated_at    | TIMESTAMP    |             |             |

### 1.7.2 `wedding_package_items`

| Column      | Type   | Constraints | Description |
|-------------|--------|-------------|-------------|
| id          | UUID   | PK          |             |
| package_id  | UUID   | FK(wedding_packages) |  |
| item_id     | UUID   | FK(marketplace_items) NULL |   |
| vendor_id   | UUID   | FK(vendors) NULL | Suggested vendor |
| category_id | UUID   | FK(budget_categories) NULL |   |
| suggested_amount | DECIMAL(12,2) | NULL |   |
| sort_order  | INT    | DEFAULT 0   |             |

### 1.7.3 `honeymoon_packages`

| Column       | Type          | Constraints | Description |
|--------------|---------------|-------------|-------------|
| id           | UUID          | PK          |             |
| name         | VARCHAR(255)  | NOT NULL    |             |
| slug         | VARCHAR(255)  | UNIQUE      |             |
| description   | TEXT          | NULL        |             |
| location_type | ENUM         |             | domestic, international |
| location_name | VARCHAR(255)  | NULL        |             |
| min_budget    | DECIMAL(12,2) | NULL        |             |
| max_budget    | DECIMAL(12,2) | NULL        |             |
| duration_days | INT           | NULL        |             |
| image_url     | VARCHAR(500)  | NULL        |             |
| is_active     | BOOLEAN      | DEFAULT true|             |
| created_at    | TIMESTAMP     |             |             |
| updated_at    | TIMESTAMP     |             |             |

---

## 1.8 Cart, Orders, Payments (Module 1 + Module 5)

### 1.8.1 `carts`

| Column    | Type   | Constraints | Description |
|-----------|--------|-------------|-------------|
| cart_id   | UUID   | PK          |             |
| user_id   | UUID   | FK(users) NULL | Guest cart by session |
| guest_session_id | UUID | FK(guest_checkout_sessions) NULL | |
| wedding_id| UUID   | FK(weddings) NULL | Optional context |
| created_at| TIMESTAMP |          |             |
| updated_at| TIMESTAMP |          |             |

### 1.8.2 `cart_items`

| Column      | Type          | Constraints | Description |
|-------------|---------------|-------------|-------------|
| id          | UUID          | PK          |             |
| cart_id     | UUID          | FK(carts)   |             |
| item_id     | UUID          | FK(marketplace_items) |     |
| variant_id  | UUID          | FK(product_variants) NULL |    |
| quantity    | INT           | NOT NULL    |             |
| unit_price  | DECIMAL(12,2) |             | Snapshot    |
| customization_data | JSON    | NULL        |             |
| created_at  | TIMESTAMP     |             |             |
| updated_at  | TIMESTAMP     |             |             |

### 1.8.3 `orders`

| Column            | Type          | Constraints | Description |
|-------------------|---------------|-------------|-------------|
| order_id          | UUID          | PK          |             |
| order_number      | VARCHAR(50)   | UNIQUE      | Human-readable |
| user_id           | UUID          | FK(users) NULL | Guest order |
| guest_session_id  | UUID          | FK(guest_checkout_sessions) NULL | |
| wedding_id        | UUID          | FK(weddings) NULL |         |
| status            | ENUM          |             | Pending, Confirmed, Processing, Shipped, Delivered, Cancelled, Refunded |
| subtotal          | DECIMAL(12,2) |             |             |
| shipping_amount   | DECIMAL(12,2) | DEFAULT 0   |             |
| tax_amount        | DECIMAL(12,2) | DEFAULT 0   |             |
| discount_amount   | DECIMAL(12,2) | DEFAULT 0   |             |
| total_amount      | DECIMAL(12,2) | NOT NULL    |             |
| currency          | VARCHAR(3)    | DEFAULT INR |             |
| shipping_address  | JSON          | NOT NULL    |             |
| billing_address   | JSON          | NULL        |             |
| customer_email    | VARCHAR(255)  |             |             |
| customer_phone    | VARCHAR(20)   |             |             |
| notes             | TEXT          | NULL        |             |
| created_at        | TIMESTAMP     |             |             |
| updated_at        | TIMESTAMP     |             |             |

### 1.8.4 `order_items`

| Column       | Type          | Constraints | Description |
|--------------|---------------|-------------|-------------|
| id           | UUID          | PK          |             |
| order_id     | UUID          | FK(orders)  |             |
| item_id      | UUID          | FK(marketplace_items) |     |
| variant_id   | UUID          | FK(product_variants) NULL |    |
| vendor_id     | UUID          | FK(vendors) |             |
| quantity     | INT           | NOT NULL    |             |
| unit_price   | DECIMAL(12,2) | NOT NULL    |             |
| total_price  | DECIMAL(12,2) | NOT NULL    |             |
| item_snapshot| JSON          | NULL        | Name, SKU at order time |
| created_at   | TIMESTAMP     |             |             |

### 1.8.5 `payments`

| Column            | Type          | Constraints | Description |
|-------------------|---------------|-------------|-------------|
| payment_id        | UUID          | PK          |             |
| order_id          | UUID          | FK(orders)  |             |
| amount            | DECIMAL(12,2) | NOT NULL    |             |
| currency          | VARCHAR(3)    |             |             |
| gateway           | VARCHAR(50)   |             | **razorpay** (primary), cod (if offered) |
| payment_method    | VARCHAR(50)   | NULL        | upi, card, wallet, netbanking, cod |
| gateway_order_id  | VARCHAR(255)  | NULL        |             |
| gateway_payment_id| VARCHAR(255)  | NULL        |             |
| status            | ENUM          |             | Pending, Authorized, Captured, Failed, Refunded |
| failure_reason    | TEXT          | NULL        |             |
| metadata          | JSON          | NULL        |             |
| created_at        | TIMESTAMP     |             |             |
| updated_at        | TIMESTAMP     |             |             |

### 1.8.6 `refunds`

| Column       | Type          | Constraints | Description |
|--------------|---------------|-------------|-------------|
| refund_id    | UUID          | PK          |             |
| order_id     | UUID          | FK(orders)  |             |
| payment_id   | UUID          | FK(payments) NULL |         |
| amount       | DECIMAL(12,2) | NOT NULL    |             |
| reason       | VARCHAR(100)  | NULL        | Tagged reason |
| reason_detail| TEXT          | NULL        |             |
| status       | ENUM          |             | Pending, Processed, Failed |
| gateway_refund_id | VARCHAR(255) | NULL     |             |
| created_at   | TIMESTAMP     |             |             |
| processed_at | TIMESTAMP     | NULL        |             |

---

## 1.9 Logistics (Module 5 – Shiprocket Only)

**Order tracking and shipment labels use Shiprocket only** (no Delhivery, Blue Dart, FedEx). Admin (or backend on order confirm) creates shipments via Shiprocket API.

### 1.9.1 `shipping_carriers`

| Column         | Type         | Constraints | Description |
|----------------|--------------|-------------|-------------|
| carrier_id     | UUID         | PK          |             |
| code           | VARCHAR(50)  | UNIQUE      | **shiprocket** (only carrier in use) |
| name           | VARCHAR(100) |             | Shiprocket |
| is_active      | BOOLEAN      | DEFAULT true|             |
| config         | JSON         | NULL        | Shiprocket API keys, endpoints (encrypted) |
| created_at     | TIMESTAMP    |             |             |
| updated_at     | TIMESTAMP    |             |             |

### 1.9.2 `shipments`

| Column           | Type         | Constraints | Description |
|------------------|--------------|-------------|-------------|
| shipment_id      | UUID         | PK          |             |
| order_id         | UUID         | FK(orders)  |             |
| carrier_id       | UUID         | FK(shipping_carriers) |  |
| awb_number      | VARCHAR(100) | NULL        |             |
| tracking_url     | VARCHAR(500) | NULL        |             |
| status          | VARCHAR(50)  |             | LabelCreated, PickedUp, InTransit, Delivered, Exception |
| label_url       | VARCHAR(500) | NULL        |             |
| weight_kg       | DECIMAL(8,3) | NULL        |             |
| shipping_charge | DECIMAL(12,2)| NULL        |             |
| vendor_id       | UUID         | FK(vendors) | Fulfilling vendor |
| metadata        | JSON         | NULL        | Carrier response |
| created_at      | TIMESTAMP    |             |             |
| updated_at      | TIMESTAMP    |             |             |

### 1.9.3 `shipment_tracking_events`

| Column        | Type         | Constraints | Description |
|---------------|--------------|-------------|-------------|
| id            | UUID         | PK          |             |
| shipment_id   | UUID         | FK(shipments)|             |
| event_code    | VARCHAR(50)  | NULL        |             |
| description   | VARCHAR(255) | NULL        |             |
| location      | VARCHAR(255) | NULL        |             |
| occurred_at   | TIMESTAMP    |             |             |
| raw_payload   | JSON         | NULL        |             |
| created_at    | TIMESTAMP    |             |             |

### 1.9.4 `shipping_rules`

| Column              | Type          | Constraints | Description |
|---------------------|---------------|-------------|-------------|
| rule_id             | UUID          | PK          |             |
| name                | VARCHAR(100)  | NULL        |             |
| free_shipping_threshold | DECIMAL(12,2) | NULL    | Order value above which shipping is free |
| default_rate        | DECIMAL(12,2) | NULL        |             |
| rate_by_weight_kg    | JSON          | NULL        | Tiered by weight |
| rate_by_zone        | JSON          | NULL        | Pincode/region based |
| is_active           | BOOLEAN       | DEFAULT true|             |
| created_at          | TIMESTAMP     |             |             |
| updated_at          | TIMESTAMP     |             |             |

---

## 1.10 Promotions & Offers (Module 1 + Module 2 + Admin)

### 1.10.1 `coupons`

| Column           | Type          | Constraints | Description |
|------------------|---------------|-------------|-------------|
| coupon_id        | UUID          | PK          |             |
| code             | VARCHAR(50)   | UNIQUE      |             |
| description      | VARCHAR(255)  | NULL        |             |
| discount_type    | ENUM          |             | percentage, fixed_amount |
| discount_value   | DECIMAL(12,2) | NOT NULL    |             |
| min_order_value  | DECIMAL(12,2) | NULL        |             |
| max_discount     | DECIMAL(12,2) | NULL        | For percentage |
| usage_limit_total| INT           | NULL        |             |
| usage_limit_per_user | INT        | NULL        |             |
| usage_count      | INT           | DEFAULT 0   |             |
| valid_from       | TIMESTAMP     | NULL        |             |
| valid_until      | TIMESTAMP     | NULL        |             |
| is_active        | BOOLEAN       | DEFAULT true|             |
| created_by       | UUID          | FK(users) NULL | Admin/vendor |
| vendor_id        | UUID          | FK(vendors) NULL | Vendor-specific |
| created_at       | TIMESTAMP     |             |             |
| updated_at       | TIMESTAMP     |             |             |

### 1.10.2 `coupon_redemptions`

| Column     | Type     | Constraints | Description |
|------------|----------|-------------|-------------|
| id         | UUID     | PK          |             |
| coupon_id  | UUID     | FK(coupons) |             |
| order_id   | UUID     | FK(orders)  |             |
| user_id    | UUID     | FK(users) NULL |          |
| discount_applied | DECIMAL(12,2) |       |             |
| created_at | TIMESTAMP|             |             |

### 1.10.3 `campaign_banners`

| Column      | Type         | Constraints | Description |
|-------------|--------------|-------------|-------------|
| id          | UUID         | PK          |             |
| title       | VARCHAR(255) | NULL        |             |
| image_url   | VARCHAR(500) | NOT NULL    |             |
| link_url    | VARCHAR(500) | NULL        |             |
| position    | VARCHAR(50)  | NULL        | homepage, category_page |
| sort_order  | INT          | DEFAULT 0   |             |
| valid_from  | TIMESTAMP    | NULL        |             |
| valid_until  | TIMESTAMP    | NULL        |             |
| is_active   | BOOLEAN      | DEFAULT true|             |
| created_at  | TIMESTAMP    |             |             |
| updated_at  | TIMESTAMP    |             |             |

---

## 1.11 Wishlist, Reviews, Ratings (Module 1)

### 1.11.1 `wishlists`

| Column   | Type   | Constraints | Description |
|----------|--------|-------------|-------------|
| id       | UUID   | PK          |             |
| user_id  | UUID   | FK(users)   |             |
| item_id  | UUID   | FK(marketplace_items) |     |
| variant_id | UUID  | FK(product_variants) NULL |   |
| created_at | TIMESTAMP |           |             |
| UNIQUE(user_id, item_id, variant_id) |   |             |             |

### 1.11.2 `reviews`

| Column    | Type         | Constraints | Description |
|-----------|--------------|-------------|-------------|
| review_id | UUID         | PK          |             |
| user_id   | UUID         | FK(users)   |             |
| order_id  | UUID         | FK(orders)  NULL | For verified purchase |
| target_type | ENUM       |             | vendor, product |
| target_id | UUID         | NOT NULL    | vendor_id or item_id |
| rating    | TINYINT      | NOT NULL    | 1–5         |
| title     | VARCHAR(255) | NULL        |             |
| body      | TEXT         | NULL        |             |
| is_verified_purchase | BOOLEAN | DEFAULT false |     |
| status    | ENUM         |             | Pending, Approved, Rejected |
| created_at| TIMESTAMP    |             |             |
| updated_at| TIMESTAMP    |             |             |

---

## 1.12 Commission (Reference Only – No In-App Commission/Payout)

**There is no commission calculation or payout flow in the project.** The client pays vendors **manually, outside the system**.

- **`vendors.commission_percentage`** – When admin adds a vendor, they store a commission % for their own reference, so they can pay the vendor manually later. Not used for any automatic calculation.
- **No tables:** `commission_rules`, `order_commissions`, or `payouts`. Removed.

---

## 1.13 Notifications (Module 1 + Admin)

### 1.13.1 `notification_templates`

| Column       | Type         | Constraints | Description |
|--------------|--------------|-------------|-------------|
| id           | UUID         | PK          |             |
| code         | VARCHAR(100) | UNIQUE      | order_placed, order_shipped, etc. |
| name         | VARCHAR(255) | NULL        |             |
| channel      | VARCHAR(50)  |             | **email** (primary; sent via **Web3Forms**), push (optional) |
| subject      | VARCHAR(255) | NULL        | Email subject |
| body_text    | TEXT         | NULL        |             |
| body_html    | TEXT         | NULL        |             |
| is_active    | BOOLEAN      | DEFAULT true|             |
| created_at   | TIMESTAMP    |             |             |
| updated_at   | TIMESTAMP    |             |             |

**Email delivery:** Use **Web3Forms** API to send transactional emails (order confirmation, status updates, abandoned cart, etc.). Store logs in `notification_logs` with `channel = 'email'`.

### 1.13.2 `notification_logs`

| Column       | Type         | Constraints | Description |
|--------------|--------------|-------------|-------------|
| id           | UUID         | PK          |             |
| user_id      | UUID         | FK(users) NULL |          |
| guest_session_id | UUID      | NULL        |             |
| channel      | VARCHAR(50)  |             | email (Web3Forms), push (optional) |
| template_code| VARCHAR(100) | NULL        |             |
| recipient    | VARCHAR(255) |             | Email address or push target |
| subject      | VARCHAR(255) | NULL        |             |
| body_preview | TEXT         | NULL        |             |
| status       | ENUM         |             | Sent, Failed, Bounced |
| external_id  | VARCHAR(255) | NULL        | Provider ID |
| metadata     | JSON         | NULL        |             |
| sent_at      | TIMESTAMP    | NULL        |             |
| created_at   | TIMESTAMP    |             |             |

### 1.13.3 `user_push_tokens`

| Column     | Type         | Constraints | Description |
|------------|--------------|-------------|-------------|
| id         | UUID         | PK          |             |
| user_id    | UUID         | FK(users)   |             |
| device_type| VARCHAR(50)  | NULL        | web, android, ios |
| token      | VARCHAR(500) | NOT NULL    |             |
| is_active  | BOOLEAN      | DEFAULT true|             |
| created_at | TIMESTAMP    |             |             |
| updated_at | TIMESTAMP    |             |             |

---

## 1.14 Abandoned Cart & Reminders

### 1.14.1 `abandoned_cart_reminders`

| Column        | Type      | Constraints | Description |
|---------------|-----------|-------------|-------------|
| id            | UUID      | PK          |             |
| cart_id       | UUID      | FK(carts)   |             |
| user_id       | UUID      | FK(users) NULL |          |
| email         | VARCHAR(255) | NULL     |             |
| reminder_sent_at | TIMESTAMP | NULL     |             |
| reminder_count  | INT       | DEFAULT 0   |             |
| converted     | BOOLEAN   | DEFAULT false |           |
| created_at    | TIMESTAMP |             |             |
| updated_at    | TIMESTAMP |             |             |

---

## 1.15 Admin & Activity (Module 3)

### 1.15.1 `activity_logs`

| Column     | Type         | Constraints | Description |
|------------|--------------|-------------|-------------|
| id         | UUID         | PK          |             |
| actor_id   | UUID         | FK(users) NULL | Admin/vendor |
| actor_type | VARCHAR(50)  | NULL        | admin, vendor |
| action     | VARCHAR(100) |            | vendor_approved, category_updated |
| entity_type| VARCHAR(50)  | NULL        | vendor, order, category |
| entity_id  | UUID         | NULL        |             |
| old_values | JSON         | NULL        |             |
| new_values | JSON         | NULL        |             |
| ip_address | VARCHAR(45)  | NULL        |             |
| user_agent | TEXT         | NULL        |             |
| created_at | TIMESTAMP    |             |             |

### 1.15.2 `content_blocks`

| Column     | Type         | Constraints | Description |
|------------|--------------|-------------|-------------|
| id         | UUID         | PK          |             |
| key        | VARCHAR(100) | UNIQUE     | homepage_hero, curated_collections |
| title      | VARCHAR(255) | NULL        |             |
| body       | TEXT         | NULL        |             |
| config     | JSON         | NULL        | Banners, collection IDs |
| is_active  | BOOLEAN      | DEFAULT true|             |
| created_at | TIMESTAMP    |             |             |
| updated_at | TIMESTAMP    |             |             |

---

## 1.16 Analytics & Reporting (Sessions, Events, Metrics)

### 1.16.1 `sessions`

| Column       | Type         | Constraints | Description |
|--------------|--------------|-------------|-------------|
| session_id   | UUID         | PK          |             |
| user_id      | UUID         | FK(users) NULL |          |
| device_type  | VARCHAR(50)  | NULL        | mobile, desktop, tablet |
| traffic_source| VARCHAR(50)  | NULL        | organic, paid, social, direct, referral |
| utm_source   | VARCHAR(100) | NULL        |             |
| utm_medium   | VARCHAR(100) | NULL        |             |
| utm_campaign | VARCHAR(100) | NULL        |             |
| started_at   | TIMESTAMP    |             |             |
| ended_at     | TIMESTAMP    | NULL        |             |

### 1.16.2 `page_views`

| Column     | Type         | Constraints | Description |
|------------|--------------|-------------|-------------|
| id         | UUID         | PK          |             |
| session_id | UUID         | FK(sessions)|             |
| user_id    | UUID         | FK(users) NULL |          |
| page_type  | VARCHAR(50)  | NULL        | home, product, category, cart, checkout |
| page_id    | UUID         | NULL        | item_id, category_id |
| url_path   | VARCHAR(500) | NULL        |             |
| viewed_at  | TIMESTAMP    |             |             |

### 1.16.3 `cart_events`

| Column     | Type      | Constraints | Description |
|------------|-----------|-------------|-------------|
| id         | UUID      | PK          |             |
| session_id | UUID      | FK(sessions)|             |
| cart_id    | UUID      | FK(carts) NULL |          |
| event_type | VARCHAR(50) |           | add, remove, checkout_started, checkout_completed |
| item_id    | UUID      | NULL        |             |
| quantity   | INT       | NULL        |             |
| occurred_at| TIMESTAMP |             |             |

### 1.16.4 `checkout_steps`

| Column       | Type      | Constraints | Description |
|--------------|-----------|-------------|-------------|
| id           | UUID      | PK          |             |
| session_id   | UUID      | FK(sessions)|             |
| cart_id      | UUID      | FK(carts) NULL |          |
| step_name    | VARCHAR(50) |           | shipping, payment, review |
| entered_at   | TIMESTAMP |             |             |
| exited_at    | TIMESTAMP | NULL        | Drop-off if no next step |
| completed    | BOOLEAN   | DEFAULT false |           |

### 1.16.5 `user_clicks` (for heatmaps / UX)

| Column     | Type         | Constraints | Description |
|------------|--------------|-------------|-------------|
| id         | UUID         | PK          |             |
| session_id | UUID         | FK(sessions)|             |
| page_path  | VARCHAR(500) | NULL        |             |
| element_selector | VARCHAR(500) | NULL    |             |
| x_position | INT          | NULL        |             |
| y_position | INT          | NULL        |             |
| scroll_depth_pct | INT       | NULL        |             |
| occurred_at| TIMESTAMP    |             |             |

### 1.16.6 `inventory_alerts`

| Column     | Type      | Constraints | Description |
|------------|-----------|-------------|-------------|
| id         | UUID      | PK          |             |
| variant_id | UUID      | FK(product_variants) |  |
| threshold  | INT       |             |             |
| current_stock | INT     |             |             |
| alert_type | VARCHAR(50) |            | low_stock   |
| acknowledged | BOOLEAN  | DEFAULT false |          |
| created_at | TIMESTAMP |             |             |

### 1.16.7 `sla_commitments`

| Column          | Type      | Constraints | Description |
|-----------------|-----------|-------------|-------------|
| id              | UUID      | PK          |             |
| vendor_id       | UUID      | FK(vendors) |             |
| max_days_to_ship| INT       | NULL        |             |
| max_days_to_deliver | INT    | NULL        |             |
| is_active       | BOOLEAN   | DEFAULT true|             |
| created_at      | TIMESTAMP |             |             |
| updated_at      | TIMESTAMP |             |             |

SLA breach: compare `order.created_at` / `shipment.status` and `shipment_tracking_events.occurred_at` against these commitments.

### 1.16.8 `expenses` (for CPA, Cost Breakdown, Net Profit)

| Column       | Type          | Constraints | Description |
|--------------|---------------|-------------|-------------|
| id           | UUID          | PK          |             |
| expense_type | VARCHAR(50)   |             | marketing, operations, logistics, ads, other |
| category     | VARCHAR(100)  | NULL        | e.g. Google Ads, Facebook, Delivery cost |
| amount       | DECIMAL(12,2) | NOT NULL    |             |
| currency     | VARCHAR(3)    | DEFAULT INR |             |
| period_start | DATE          | NULL        |             |
| period_end   | DATE          | NULL        |             |
| reference    | VARCHAR(255)  | NULL        | Invoice/ref |
| created_at   | TIMESTAMP     |             |             |
| updated_at   | TIMESTAMP     |             |             |

Used for Cost Per Acquisition (ad spend), Cost Breakdown report, and Net Profit (revenue − COGS − expenses).

---

## 1.17 Search (Module 6 – Fuzzy Search, No Elasticsearch)

**Use fuzzy search**, not Elasticsearch.

- **Option A (PostgreSQL):** Use **`pg_trgm`** extension for similarity/ILIKE-based fuzzy matching on `marketplace_items` (name, description, category_tag, theme, etc.) and `vendors` (business_name, description, city). Autocomplete: `WHERE name ILIKE :q || '%'` or trigram similarity.
- **Option B (application):** Implement fuzzy matching in app (e.g. Levenshtein, fuzzy string library) on result sets or cached search fields.
- **Filters:** Continue to use exact/range filters (price, category, occasion, color, size, location) on relational tables.

No separate search engine or indices; all search runs against the same DB with fuzzy + filters.

---

## 1.18 Entity Relationship Summary

- **Users** 1:N Weddings, Carts, Wishlists, Reviews, Orders (as customer), SocialAccounts.
- **Users** 1:1 Vendors (vendor profile).
- **Weddings** 1:N WeddingBudgetAllocations, WeddingProgramFunctions, WeddingJourneyProgress.
- **BudgetCategories** 1:N WeddingBudgetAllocations, BudgetAllocationRules.
- **Vendors** 1:N VendorAvailability, MarketplaceItems, Orders (via order_items), Reviews (target). No payouts/commission in DB.
- **Categories** 1:N MarketplaceItems (category_id).
- **MarketplaceItems** 1:N ProductVariants, OrderItems, Wishlists, ItemMedia.
- **Orders** 1:N OrderItems, Payments, Shipments, Refunds, CouponRedemptions.
- **Carts** 1:N CartItems; Carts N:1 Users or GuestCheckoutSessions.
- **Coupons** 1:N CouponRedemptions.
- **Vendors.commission_percentage** is reference only (admin pays vendor manually); no commission/payout tables.

---

## 1.19 Indexing for Budget, Location & Guest-Based Filtering

Venues, products, and services are shown mainly by **budget**, **location (venue)**, and **guest count**. The following indexes keep these filters fast.

### 1.19.1 Budget-based filtering

Queries: “Items/vendors within user’s budget” and “Within allocated category budget”.

| Table | Index | Purpose |
|-------|--------|---------|
| **weddings** | `(user_id)`, `(total_budget)` | Get wedding and its budget for filtering. |
| **wedding_budget_allocations** | `(wedding_id)`, `(wedding_id, category_id)` | Category-wise allocated amount for a wedding. |
| **marketplace_items** | `(min_budget)`, `(max_budget)` | Range: “venue/product within budget”. |
| **marketplace_items** | `(price)` | Price range filters. |
| **marketplace_items** | `(min_budget, max_budget, status)` | Composite: active items in budget range. |
| **marketplace_items** | `(category_id, status, min_budget, max_budget)` | Category + budget (and active). |
| **vendors** | `(min_budget)`, `(max_budget)` | Vendor budget range. |
| **vendors** | `(min_budget, max_budget, status)` | Active vendors in budget range. |
| **product_variants** | `(item_id, price)` | Item-level price/variant filtering. |

### 1.19.2 Location-based filtering (venue & vendor)

Queries: “Venues/items in this city/area”, “Vendors in location”.

| Table | Index | Purpose |
|-------|--------|---------|
| **marketplace_items** | `(location_city)` | Venue/product by city. |
| **marketplace_items** | `(location_city, item_type)` | Venues (or other types) in city. |
| **marketplace_items** | `(location_city, status)` | Active items in city. |
| **marketplace_items** | `(location)` | Exact location/area (if used in filters). |
| **marketplace_items** | `(location_city, item_type, status, min_budget, max_budget)` | Composite: venue discovery by city + budget. |
| **vendors** | `(city)` | Vendor by city. |
| **vendors** | `(city, vendor_type)` | Vendors by city and type. |
| **vendors** | `(city, status)` | Active vendors in city. |
| **vendor_availability** | `(vendor_id, available_date)` | Already UNIQUE; use for date + vendor filters. |

### 1.19.3 Guest-count–based filtering

Queries: “Venues that can seat X guests”, “Catering/items for guest count”.

| Table | Index | Purpose |
|-------|--------|---------|
| **weddings** | `(guest_count)` | Wedding’s guest count for capacity filters. |
| **marketplace_items** | `(capacity)` | Venue capacity ≥ guest_count. |
| **marketplace_items** | `(capacity, status)` | Active venues by capacity. |
| **marketplace_items** | `(location_city, capacity, status)` | Venues in city that fit guest count. |
| **marketplace_items** | `(capacity, min_budget, max_budget, status)` | Venues by capacity and budget. |

### 1.19.4 Combined “required cheezen” (budget + location + guests)

For “venues/products by budget + location + guests” in one query:

| Table | Composite index | Purpose |
|-------|------------------|---------|
| **marketplace_items** | `(item_type, status, location_city, capacity, min_budget, max_budget)` | Venue discovery: type + city + capacity + budget (order columns by filter selectivity: status, item_type, then location_city, capacity, budget). |
| **marketplace_items** | `(category_id, status, location_city, min_budget, max_budget)` | Products/services by category, location, budget. |
| **vendors** | `(vendor_type, status, city, min_budget, max_budget)` | Vendors by type, city, budget. |

### 1.19.5 Other useful indexes

| Table | Index | Purpose |
|-------|--------|---------|
| **marketplace_items** | `(vendor_id, status)` | “All active items of a vendor”. |
| **marketplace_items** | `(category_id, status)` | Listing by category. |
| **marketplace_items** | `(item_type, status)` | Filter by product / service / venue / etc. |
| **budget_categories** | `(category_id)` on budget_allocation_rules | Join rules to categories. |
| **categories** | `(parent_id)`, `(slug)` | Category tree and lookups. |

### 1.19.6 Example index definitions (PostgreSQL)

```sql
-- Budget + status (items)
CREATE INDEX idx_marketplace_items_budget_status ON marketplace_items (status, min_budget, max_budget) WHERE status = 'Active';
CREATE INDEX idx_marketplace_items_category_budget ON marketplace_items (category_id, status, min_budget, max_budget) WHERE status = 'Active';

-- Location (venue / items)
CREATE INDEX idx_marketplace_items_location_city_type ON marketplace_items (location_city, item_type, status) WHERE status = 'Active';
CREATE INDEX idx_vendors_city_status ON vendors (city, status) WHERE status = 'Active';

-- Guests (capacity)
CREATE INDEX idx_marketplace_items_capacity ON marketplace_items (capacity, status) WHERE item_type = 'Venue' OR capacity IS NOT NULL;
CREATE INDEX idx_marketplace_items_city_capacity ON marketplace_items (location_city, capacity, status) WHERE status = 'Active';

-- Combined: venue by budget + location + guests
CREATE INDEX idx_marketplace_items_venue_discovery ON marketplace_items (item_type, status, location_city, capacity, min_budget, max_budget) WHERE status = 'Active';

-- Wedding / budget allocation
CREATE INDEX idx_wedding_budget_allocations_wedding ON wedding_budget_allocations (wedding_id, category_id);
CREATE INDEX idx_vendors_budget ON vendors (min_budget, max_budget, status) WHERE status = 'Active';
```

**Note:** Create only the indexes that match your actual query patterns; too many indexes slow down writes. Start with budget, location_city, capacity, and status, then add composites (e.g. venue discovery) once queries are fixed.

---

# 2. API Modeling

Base URL: `https://api.myshaadistore.com/v1` (or `/api/v1`). All APIs return JSON. Protected routes use `Authorization: Bearer <token>` or session cookie.

---

## 2.1 Authentication

- **Customers** register via `/auth/register` (role: customer) or social login.
- **Vendors** do **not** self-register. Admin adds vendors; admin can optionally create a user (role: vendor) and link to vendor (`vendors.user_id`) so the vendor can log in to the **view-only** Vendor Panel.
- **Admins** are created directly in DB or via seed.

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/auth/register` | **Customer** sign up | `{ "email", "password", "firstName", "lastName", "phone?", "role": "customer" }` | `{ "userId", "token", "expiresAt" }` |
| POST | `/auth/login` | Email/password login | `{ "email", "password" }` | `{ "userId", "token", "expiresAt", "user": { ... } }` |
| POST | `/auth/social` | Social login (Google, Facebook, Apple) | `{ "provider", "idToken" \| "accessToken" }` | `{ "userId", "token", "isNewUser", "user": { ... } }` |
| POST | `/auth/guest-session` | Create guest session for checkout | `{ "email?", "phone?", "firstName?", "lastName?" }` | `{ "guestSessionId", "sessionToken" }` |
| GET | `/auth/me` | Current user (protected) | - | `{ "userId", "email", "firstName", "lastName", "role", "phone" }` |
| POST | `/auth/refresh` | Refresh token | `{ "refreshToken" }` | `{ "token", "expiresAt" }` |
| POST | `/auth/logout` | Invalidate token/session | - | `{ "message": "Logged out" }` |

---

## 2.2 Wedding Management (Customer)

### 2.2.1 Weddings

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/weddings` | Create wedding | `{ "weddingDate", "totalBudget", "guestCount" }` | `{ "weddingId", "message" }` |
| GET | `/weddings` | List user's weddings | - | `[{ "weddingId", "weddingDate", "totalBudget", "guestCount", "currentJourneyStep" }]` |
| GET | `/weddings/:weddingId` | Get wedding details | - | `{ "weddingId", "weddingDate", "totalBudget", "guestCount", "currentJourneyStep", "estimatedCateringNeeds", "estimatedSeatingNeeds", "estimatedGiftNeeds" }` |
| PUT | `/weddings/:weddingId` | Update wedding (triggers budget recalc) | `{ "weddingDate?", "totalBudget?", "guestCount?" }` | `{ "weddingId", "message" }` |
| DELETE | `/weddings/:weddingId` | Delete wedding | - | `{ "message" }` |

### 2.2.2 Budget Allocation

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/weddings/:weddingId/budget-allocation` | Get allocation per category | - | `[{ "categoryId", "categoryName", "allocatedAmount", "actualSpent", "remaining" }]` |
| POST | `/weddings/:weddingId/budget-allocation/auto` | Run smart allocation engine | - | `{ "message", "allocations": [...] }` |
| PUT | `/weddings/:weddingId/budget-allocation/:categoryId` | Update one category amount | `{ "allocatedAmount" }` | `{ "message" }` |

### 2.2.3 Journey & Guest Estimates

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/weddings/:weddingId/journey-progress` | Journey steps status | - | `{ "currentStep", "progress": { "Venue": "Completed", "Programs": "InProgress", ... } }` |
| PUT | `/weddings/:weddingId/journey-progress` | Set current step | `{ "step" }` | `{ "message" }` |
| GET | `/weddings/:weddingId/guest-needs-estimate` | Catering, seating, gift estimates | - | `{ "cateringNeeds", "seatingNeeds", "giftNeeds" }` |

### 2.2.4 Programs

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/weddings/:weddingId/programs` | List functions with budget | - | `[{ "functionId", "name", "date", "time", "locationName", "estimatedCost", "actualCost", "status" }]` |
| POST | `/weddings/:weddingId/programs` | Add function | `{ "name", "date?", "time?", "locationName?", "estimatedCost?" }` | `{ "functionId", "message" }` |
| PUT | `/weddings/:weddingId/programs/:functionId` | Update function | `{ "name?", "date?", "time?", "locationName?", "estimatedCost?", "actualCost?", "status?" }` | `{ "message" }` |
| DELETE | `/weddings/:weddingId/programs/:functionId` | Remove function | - | `{ "message" }` |

---

## 2.3 Vendor Discovery (Customer)

| Method | Endpoint | Description | Query params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/vendors` | Browse/filter vendors | `type`, `city`, `rating_min`, `budget_min`, `budget_max`, `date`, `capacity`, `cuisine`, `dietary`, `decor_theme`, `per_plate_min`, `per_plate_max`, `function_count?` (SOW: filter by number of wedding functions) | `[{ "vendorId", "businessName", "vendorType", "city", "ratingAvg", "minBudget", "maxBudget", "imageUrl?" }]` |
| GET | `/vendors/:vendorId` | Vendor profile | - | `{ "vendorId", "businessName", "description", "vendorType", "city", "contactEmail", "contactPhone", "ratingAvg", "ratingCount", ... }` |
| GET | `/vendors/:vendorId/availability` | Availability calendar | `start_date`, `end_date` | `[{ "date", "isAvailable" }]` |

---

## 2.4 Marketplace (Customer)

| Method | Endpoint | Description | Query params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/marketplace/items` | List/filter items | `item_type`, `category`, `for_gender`, `budget_min`, `budget_max`, `theme`, `bulk_pricing`, `budget_per_gift_min`, `budget_per_gift_max`, `occasion`, `color`, `size`, `location`, `function_count?` (SOW: filter by number of functions), `page`, `limit`, `sort` | `{ "items": [...], "total", "page", "limit" }` |
| GET | `/marketplace/items/:itemId` | Item detail | - | `{ "itemId", "name", "description", "price", "variants", "vendor", "reviewsSummary", ... }` |

---

## 2.5 Curated Packages & Honeymoon

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/packages/wedding` | List wedding packages | `budget_min?`, `budget_max?` | `[{ "packageId", "name", "totalBudget", "imageUrl", "itemCount" }]` |
| GET | `/packages/wedding/:packageId` | Package detail with items | - | `{ "packageId", "name", "totalBudget", "items": [...] }` |
| GET | `/packages/honeymoon` | Honeymoon packages | `location_type`, `budget_min`, `budget_max` | `[{ "id", "name", "locationType", "minBudget", "maxBudget", "durationDays" }]` |
| GET | `/packages/honeymoon/:id` | Honeymoon package detail | - | `{ "id", "name", "description", "locationName", "minBudget", "maxBudget", ... }` |

---

## 2.6 Cart & Checkout (Customer)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/cart` | Get current cart | - | `{ "cartId", "items": [{ "itemId", "variantId", "quantity", "unitPrice", "name" }], "subtotal" }` |
| POST | `/cart/items` | Add to cart | `{ "itemId", "variantId?", "quantity", "customizationData?" }` | `{ "cartId", "message" }` |
| PUT | `/cart/items/:id` | Update quantity | `{ "quantity" }` | `{ "message" }` |
| DELETE | `/cart/items/:id` | Remove line | - | `{ "message" }` |
| POST | `/cart/shipping-quote` | Get shipping cost | `{ "pincode?", "weight?" }` or derive from cart | `{ "amount", "freeShippingAbove?", "carrierOptions?" }` |

---

## 2.7 Orders & Payments (Customer)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/orders` | Create order (from cart) | `{ "cartId", "shippingAddress", "billingAddress?", "couponCode?", "guestSessionId?" }` | `{ "orderId", "orderNumber", "totalAmount", "paymentOrderId?" }` (Razorpay order id for client-side capture) |
| POST | `/orders/:orderId/confirm-payment` | Confirm payment (Razorpay) | `{ "gatewayPaymentId", "gatewayOrderId", "signature?" }` | `{ "orderId", "status", "message" }` |
| GET | `/orders` | My orders | `status?, page, limit` | `{ "orders": [...], "total", "page", "limit" }` |
| GET | `/orders/:orderId` | Order detail | - | `{ "orderId", "orderNumber", "status", "items", "shippingAddress", "payments", "shipments" }` |
| GET | `/orders/:orderId/tracking` | Tracking for order | - | `{ "shipments": [{ "awbNumber", "trackingUrl", "events": [...] }] }` |
| POST | `/orders/:orderId/cancel` | Cancel order | `{ "reason?" }` | `{ "message" }` |

---

## 2.8 Wishlist & Reviews (Customer)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/wishlist` | My wishlist | - | `[{ "itemId", "variantId?", "item": { ... } }]` |
| POST | `/wishlist` | Add to wishlist | `{ "itemId", "variantId?" }` | `{ "message" }` |
| DELETE | `/wishlist/:itemId` | Remove (optional `?variantId=`) | - | `{ "message" }` |
| POST | `/reviews` | Submit review (post order) | `{ "targetType": "vendor" \| "product", "targetId", "orderId?", "rating", "title?", "body?" }` | `{ "reviewId", "message" }` |
| GET | `/marketplace/items/:itemId/reviews` | Item reviews | `page, limit` | `{ "reviews": [...], "summary": { "avgRating", "count" } }` |
| GET | `/vendors/:vendorId/reviews` | Vendor reviews | `page, limit` | Same structure |

---

## 2.9 Notifications (Customer)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/notifications` | List user notifications | `page, limit, unreadOnly?` | `{ "notifications": [...], "unreadCount" }` |
| PUT | `/notifications/:id/read` | Mark read | - | `{ "message" }` |
| POST | `/notifications/push-subscribe` | Register push token (PWA) | `{ "token", "deviceType?" }` | `{ "message" }` |

---

## 2.10 Search (Module 6 – Fuzzy Search)

| Method | Endpoint | Description | Query params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/search` | **Fuzzy search** (e.g. pg_trgm or app-level) on items & vendors | `q`, `type` (items \| vendors), `category`, `min_price`, `max_price`, `location`, `page`, `limit` | `{ "items": [...], "vendors": [...], "total", "suggestions?" }` |
| GET | `/search/autocomplete` | Autocomplete suggestions (fuzzy/prefix) | `q`, `limit` | `{ "suggestions": [{ "text", "type", "id", "payload?" }] }` |

---

## 2.11 Vendor Panel APIs (View Only)

Base path: `/vendor` (all protected, vendor role). **Vendors cannot add or edit anything**; all data is added by Admin. Vendor panel is **read-only**: view dashboard, my products, sales stats, graphs.

### 2.11.1 Dashboard & Stats

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/vendor/dashboard` | Overview: revenue, order counts, low-stock count, recent orders | `{ "totalRevenue", "ordersCount", "lowStockCount", "recentOrders", "topProducts?" }` |
| GET | `/vendor/profile` | My vendor profile (read-only) | Same as GET `/vendors/:id` for self |

### 2.11.2 Products (View Only)

| Method | Endpoint | Description | Query params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/vendor/items` | List products assigned to this vendor (read-only) | `status?, page, limit` | `{ "items": [...], "total" }` |
| GET | `/vendor/items/:itemId` | Item detail (read-only) | - | Full item + variants (no edit) |
| GET | `/vendor/inventory/alerts` | Low-stock alerts for my products | - | `[{ "variantId", "itemName", "currentStock", "threshold" }]` |
| GET | `/vendor/availability` | My availability calendar (read-only; set by admin) | `start_date`, `end_date` | `[{ "date", "isAvailable" }]` |

### 2.11.3 Orders & Sales (View Only)

| Method | Endpoint | Description | Query params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/vendor/orders` | Orders containing my products (read-only) | `status?, from, to, page, limit` | `{ "orders": [...], "total" }` |
| GET | `/vendor/orders/:orderId` | Order detail for my items only (read-only) | - | `{ "orderId", "items": [...], "shippingAddress", "customerPhone" }` |
| GET | `/vendor/shipments` | Shipments for my orders (read-only) | `status?, page, limit` | `{ "shipments": [...] }` |

### 2.11.4 Analytics & Graphs (View Only)

| Method | Endpoint | Description | Query params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/vendor/analytics` | Sales & performance: which product sold how much, revenue, counts | `from`, `to`, `groupBy` (day \| week \| month) | `{ "revenue", "ordersCount", "topProducts", "byProduct": [{ "itemId", "name", "quantitySold", "revenue" }] }` |
| GET | `/vendor/analytics/graphs` | Data for charts (e.g. sales over time, product-wise) | `from`, `to`, `metric` | `{ "series": [...] }` |

**No vendor APIs for:** adding/editing products, bulk upload, availability, accept/reject orders, creating shipments, coupons, or earnings (commission is manual outside system).

---

## 2.12 Admin Panel APIs

Base path: `/admin` (all protected, admin role).

### 2.12.1 Dashboard & Config

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/admin/dashboard` | Overview | `{ "totalSales", "totalVendors", "totalOrders", "revenueByPeriod" }` |
| GET | `/admin/budget-rules` | List allocation rules | `[{ "ruleId", "categoryId", "categoryName", "percentage", "isActive" }]` |
| POST | `/admin/budget-rules` | Create rule | `{ "categoryId", "percentage", "minBudget?, maxBudget?" }` |
| PUT | `/admin/budget-rules/:ruleId` | Update rule | `{ "percentage?", "isActive?" }` |
| DELETE | `/admin/budget-rules/:ruleId` | Delete rule | - |

### 2.12.2 Vendors (Admin Adds & Manages)

Admin **adds** all vendors. When adding a vendor, admin sets **commission_percentage** for their own reference (to pay vendor manually outside the system). No in-app commission or payout.

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/admin/vendors` | List vendors | `status?, page, limit` | `{ "vendors": [...], "total" }` |
| GET | `/admin/vendors/:vendorId` | Vendor detail | - | Full vendor + stats (includes commission_percentage) |
| **POST** | **`/admin/vendors`** | **Add vendor** | `{ "businessName", "slug?", "description?", "vendorType", "city", "state", "address_line", "contact_email", "contact_phone", "min_budget?", "max_budget?", "commission_percentage?", "user_id?" }` | `{ "vendorId", "message" }` |
| PUT | `/admin/vendors/:vendorId` | Update vendor (including commission_percentage) | Same fields as POST | `{ "message" }` |
| PUT | `/admin/vendors/:vendorId/suspend` | Suspend vendor | `{ "reason?" }` | `{ "message" }` |
| GET | `/admin/vendors/:vendorId/availability` | Get vendor availability (for venue/booking) | `start_date`, `end_date` | `[{ "date", "isAvailable" }]` |
| PUT | `/admin/vendors/:vendorId/availability` | Set vendor availability (admin) | `{ "dates": ["YYYY-MM-DD", ...], "isAvailable": true \| false }` | `{ "message" }` |
| GET | `/admin/vendors/performance` | Vendor performance (revenue, orders, rating) | `from?, to?` | `[{ "vendorId", "rating", "revenue", "ordersCount" }]` |

### 2.12.3 Products / Items / Venues (Admin Adds & Manages)

Admin **adds** all products, services, and venues with **category, subcategory, vendor, location** (for venue), etc. Full CRUD from Admin only.

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/admin/items` | List all marketplace items | `vendorId?, categoryId?, item_type?, status?, page, limit` | `{ "items": [...], "total" }` |
| GET | `/admin/items/:itemId` | Item detail | - | Full item + variants |
| **POST** | **`/admin/items`** | **Add product/venue/service** | `{ "vendorId", "categoryId?", "name", "slug?", "description?", "price", "item_type", "category_tag?", "for_gender?", "theme?", "capacity?", "location?", "location_city?", "min_budget?", "max_budget?", "is_premium?", ... }` (category, subcategory via categoryId/parent, vendor via vendorId, location for venue) | `{ "itemId", "message" }` |
| PUT | `/admin/items/:itemId` | Update item | Same fields as POST | `{ "message" }` |
| DELETE | `/admin/items/:itemId` | Soft delete item | - | `{ "message" }` |
| POST | `/admin/items/:itemId/variants` | Add variant to item | `{ "sku", "size?", "color?", "price", "stockQuantity", "lowStockThreshold?" }` | `{ "variantId", "message" }` |
| PUT | `/admin/items/:itemId/variants/:variantId` | Update variant | Same fields | `{ "message" }` |
| POST | `/admin/items/bulk-upload` | Bulk CSV upload (admin) | `multipart/form-data` file | `{ "jobId", "message", "rowsProcessed?, "errors?" }` |

### 2.12.4 Categories & Packages

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/admin/categories` | List categories (tree) | - | `[{ "categoryId", "name", "parentId", "children": [...] }]` |
| POST | `/admin/categories` | Create category | `{ "name", "slug?", "parentId?", "description?", "sortOrder?" }` |
| PUT | `/admin/categories/:categoryId` | Update | Same fields | |
| DELETE | `/admin/categories/:categoryId` | Delete/deactivate | - | |
| GET | `/admin/packages/wedding` | List wedding packages | - | `[...]` |
| POST | `/admin/packages/wedding` | Create package | `{ "name", "slug?", "totalBudget", "description?", "items": [{ "itemId?", "vendorId?", "categoryId?", "suggestedAmount" }] }` |
| PUT | `/admin/packages/wedding/:packageId` | Update package | Same | |
| GET | `/admin/packages/honeymoon` | List honeymoon packages | - | |
| POST | `/admin/packages/honeymoon` | Create honeymoon package | `{ "name", "locationType", "locationName", "minBudget", "maxBudget", "durationDays", ... }` |

### 2.12.5 Offers & Content

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/admin/coupons` | All coupons | `vendorId?, active?` | `[...]` |
| POST | `/admin/coupons` | Create platform coupon | Same as vendor coupon + scope | |
| PUT | `/admin/coupons/:couponId` | Edit/deactivate | - | |
| GET | `/admin/banners` | Campaign banners | - | `[...]` |
| POST | `/admin/banners` | Create banner | `{ "title", "imageUrl", "linkUrl", "position", "validFrom?, validUntil?" }` |
| PUT | `/admin/banners/:id` | Update | - | |
| GET | `/admin/content-blocks` | Content blocks (homepage, etc.) | - | `[...]` |
| PUT | `/admin/content-blocks/:key` | Update block | `{ "title?", "body?", "config?" }` | |

### 2.12.6 Orders, Shipments & Users

| Method | Endpoint | Description | Query / Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/admin/orders` | All orders | `status?, vendorId?, from, to, page, limit` | `{ "orders": [...], "total" }` |
| GET | `/admin/orders/:orderId` | Order detail | - | Full order + payments + shipments |
| PUT | `/admin/orders/:orderId/status` | Update status | `{ "status" }` | |
| **POST** | **`/admin/orders/:orderId/shipments`** | **Create shipment (Shiprocket)** – admin creates label/shipment | `{ "orderItemIds?", "weightKg?", "dimensions?" }` | `{ "shipmentId", "awbNumber", "trackingUrl", "labelUrl" }` |
| GET | `/admin/users` | Customer/user list | `role?, search?, page, limit` | `{ "users": [...], "total" }` |
| GET | `/admin/users/:userId` | User detail | - | |
| PUT | `/admin/users/:userId` | Update (e.g. suspend) | `{ "isActive?" }` | |

### 2.12.7 Notifications & Activity

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/admin/notification-templates` | Email templates (Web3Forms) | - | `[...]` |
| PUT | `/admin/notification-templates/:code` | Enable/disable or edit | `{ "isActive?", "bodyText?", "subject?" }` | |
| GET | `/admin/activity-logs` | Activity log | `actorId?, entityType?, entityId?, from, to, page, limit` | `{ "logs": [...], "total" }` |

### 2.12.8 Reporting & Export

| Method | Endpoint | Description | Query params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/admin/reports/sales` | Sales report | `from`, `to`, `groupBy` | `{ "summary", "byDay" \| "byWeek" \| "byMonth", "paymentMethodBreakdown" }` |
| GET | `/admin/reports/vendors` | Vendor performance report | `from`, `to` | `[{ "vendorId", "revenue", "orders" }]` (no commission/payout in app) |
| GET | `/admin/reports/export` | CSV export | `type` (sales \| vendors \| orders), `from`, `to` | File download or presigned URL |

### 2.12.9 Cost / Expense Management (for CPA, Cost Breakdown, Net Profit)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/admin/expenses` | List expenses | `type?`, `from`, `to`, `page`, `limit` | `{ "expenses": [...], "total" }` |
| POST | `/admin/expenses` | Record expense (ads, ops, logistics) | `{ "expenseType", "category?", "amount", "periodStart?", "periodEnd?", "reference?" }` | `{ "id", "message" }` |
| PUT | `/admin/expenses/:id` | Update expense | Same fields | `{ "message" }` |
| DELETE | `/admin/expenses/:id` | Delete expense | - | `{ "message" }` |

---

## 2.13 Analytics & Metrics APIs (Admin / Internal)

These can be under `/admin/analytics` or a separate analytics service consuming the same DB/events.

| Metric / Report | Endpoint (suggested) | Description |
|-----------------|----------------------|-------------|
| Sessions & users | `GET /admin/analytics/sessions` | Total visits, unique users, returning users; query: `from`, `to`, `groupBy` |
| Total sales | `GET /admin/analytics/sales` | Daily/weekly/monthly revenue trends |
| Payment method breakdown | Included in sales report or `GET /admin/analytics/payment-methods` | Revenue by UPI, card, COD, etc. |
| Traffic source | `GET /admin/analytics/traffic` | Organic, paid, social, direct, referral (from sessions.utm_* / traffic_source) |
| CPA | `GET /admin/analytics/cpa` | Ad spend (from cost data) / paying customers |
| Conversion rate | `GET /admin/analytics/conversion` | Purchases / sessions or visits |
| Vendor-wise sales | `GET /admin/analytics/vendor-sales` | Revenue per vendor (no commission/payout in app) |
| Order fulfillment time | `GET /admin/analytics/fulfillment-time` | Avg time order → delivery |
| SLA breach alerts | `GET /admin/analytics/sla-breaches` | Orders/shipments exceeding SLA |
| Low-stock alerts | `GET /admin/inventory/alerts` or vendor API | Already covered |
| Coupon usage | `GET /admin/analytics/coupons` | Redemptions, revenue impact |
| Device split | `GET /admin/analytics/devices` | Sessions by device_type |
| AOV | `GET /admin/analytics/aov` | Avg order value |
| Cart abandonment | `GET /admin/analytics/cart-abandonment` | Rate and list |
| Checkout drop-off | `GET /admin/analytics/checkout-dropoff` | Funnel by step (from checkout_steps) |
| Top viewed products | `GET /admin/analytics/top-pages` | From page_views where page_type=product |
| User journey flow | `GET /admin/analytics/journey` | Aggregated paths (e.g. Home → Product → Cart → Checkout) |
| Heatmaps | Backed by `user_clicks`; API can return aggregated x/y or scroll by page_path | |
| Best-selling products | `GET /admin/analytics/best-sellers` | By quantity or revenue |
| Low-performing products | `GET /admin/analytics/low-performers` | Low sales or engagement |
| Product-wise conversion | `GET /admin/analytics/product-conversion` | Views → add to cart → purchase per item |
| Inventory turnover | `GET /admin/analytics/inventory-turnover` | From order_items and stock changes |
| Refunds & cancellations | `GET /admin/analytics/refunds` | Count, amount, reasons (refunds table) |
| New vs returning | `GET /admin/analytics/customers` | First-time vs repeat (count of orders per user) |
| CLV | `GET /admin/analytics/clv` | Sum of order totals per user (and segment) |
| Repeat purchase rate | Derived from same customer analytics | |
| Churn rate | Defined period; users with no order in last N days | |
| Gross margin | Requires COGS on items; revenue - COGS | |
| Net profit | Revenue - commissions - ops - logistics (cost breakdown) | |
| Cost breakdown | `GET /admin/analytics/costs` | Marketing, ops, logistics (if stored) |

---

## 2.14 Logistics & Webhooks (Backend)

- **Payment: Razorpay only.** Create order on checkout, confirm with `POST /orders/:orderId/confirm-payment`; webhook for payment.captured/failed to update `payments` and `orders`.
- **Order tracking: Shiprocket only.** No multi-carrier. Admin (or backend on order confirm) creates shipment via Shiprocket API; store AWB and tracking in `shipments` and `shipment_tracking_events`. Poll Shiprocket tracking API and store events; `GET /orders/:orderId/tracking` reads from DB.
- **Shipping quote:** `POST /cart/shipping-quote` uses `shipping_rules` (weight/location, free-shipping threshold) or Shiprocket rate API.
- **Notifications:** Send **email via Web3Forms** (order placed, shipped, etc.); log in `notification_logs` with channel = email.

---

## 2.15 Pagination & Filtering Conventions

- **Pagination:** `page` (1-based) and `limit` (default 20, max 100). Response: `{ "data": [...], "total", "page", "limit" }`.
- **Sorting:** `sort=field` or `sort=-field` for descending.
- **Date ranges:** `from`, `to` in `YYYY-MM-DD` or ISO8601.
- **Errors:** HTTP status 4xx/5xx; body `{ "code", "message", "details?" }`.

---

This document can be extended with exact request/response samples and error codes per endpoint as the implementation progresses.
