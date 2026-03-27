# MyShaadiStore – Journey Steps & Admin Data Model

## 1. Scope

This document explains how the platform now works around **journey steps** instead of legacy **budget rules**.

- Budget rules and their admin page have been removed.
- The system is driven by ~7–8 **journey steps** (Venues, Decor, Catering, Photography, Make-up, Invitations, Shopping, Honeymoon, etc.).
- Admin manages:
  - Vendors
  - Journey steps
  - Categories per journey step
  - Items/services per (journey step + category + vendor)
- The user site (`mss-user`) consumes this data to render the multi-step experience like the reference designs.

---

## 2. Core Concepts

### 2.1 Journey Steps (User Journey)

- The main user journey is split into steps, e.g.:

  1. Venues  
  2. Decor  
  3. Catering  
  4. Photography  
  5. Make-up  
  6. Invitations  
  7. Shopping  
  8. Honeymoon  

- These steps drive:
  - The **top progress bar** and chips on the user site.
  - Separate admin screens where data for each step is managed.

### 2.2 Categories per Journey Step

- Each journey step has its own categories, for example:

  - Venues → Banquet Hall, Lawn, Resort, Destination …  
  - Make-up → Bridal HD, Airbrush, Party …

- Categories are tied to a single journey step via `journey_step_id`.

#### Shopping step: Category + Subcategory

For the **Shopping** journey step, we support both:

- **Category** (top-level): `parent_category_id = null`
- **Subcategory**: `parent_category_id = <category_id>`

This allows the user UI to filter items first by category, then by subcategory.

### 2.3 Vendors

- Vendors are global and created in the **Vendors** tab in the admin panel.
- A single vendor can provide items in multiple journey steps and categories.
- Vendors have:
  - Business name, type, city/state
  - Email + password (for vendor login later)
  - Commission % (for admin’s offline reference)

### 2.4 Items / Services

- Every item/service belongs to:
  - `vendor_id`
  - `journey_step_id`
  - `category_id` (inside that step)
  - `subcategory_id` (optional; used in Shopping step only)

- Example:
  - Vendor: *Om Shivay Banquets*
  - Journey step: *Venues*
  - Category: *Banquet Hall*
  - Item: *Grand Ballroom – 500 Guests*

---

## 3. Database Model (MongoDB)

The admin backend (`mss-admin` Next.js app) uses MongoDB. We extend the schema as follows.

### 3.1 Collection: `journey_steps`

Represents the ~7–8 steps in the user journey.

Fields (example):

- `_id` (ObjectId) → exposed as `step_id`
- `slug` (string, e.g. `"venues"`, `"decor"`)
- `title` (string, e.g. `"Choose Your Wedding Venue"`)
- `subtitle` (string, optional description shown on the page)
- `order` (number, display order in progress bar)
- `icon` (string key for frontend mapping, optional)
- `is_active` (boolean)
- `created_at`, `updated_at` (Date)

### 3.2 Collection: `categories`

Existing collection reused as **journey categories** by adding a field:

- `_id` (ObjectId) → exposed as `category_id`
- `journey_step_id` (string – references `journey_steps.step_id`)
- `name` (string)
- `slug` (string)
- `description` (string, optional)
- `parent_category_id` (string, nullable; used for Shopping subcategories)
- `sort_order` (number)
- `is_active` (boolean)
- `created_at`, `updated_at` (Date)

> **Note**: Previous tree-style `parent_id` is not required for v1 and can be ignored.

### 3.3 Collection: `vendors`

Already exists and is reused as-is (with minor UI polish).

Important fields:

- `_id` → `vendor_id`
- `business_name`
- `vendor_type` (Venue, Catering, Decor, etc.)
- `city`, `state`
- `email`, `passwordHash`
- `commission_percentage`
- `status` (`"Active"`, `"Suspended"`, etc.)

### 3.4 Collection: `items`

We extend `items` to include the journey context:

- `_id` → `item_id`
- `vendor_id` (string – vendor who owns this item)
- `journey_step_id` (string – which journey step)
- `category_id` (string – category within that step)
- `subcategory_id` (string, nullable; Shopping only)
- `name`
- `slug`
- `description`
- `images` (array of URLs)
- `price`
- `item_type` (`"Product"` / `"Service"`)
- `location`, `location_city`
- `tags` (array of strings, optional)
- `status` (`"Active"`, `"Inactive"`)
- `listing_start_at`, `listing_end_at` (Date, nullable) – controls listing visibility
- `created_at`, `updated_at`

#### Policies

Stored in `items.policies`:

- `returnable` (boolean)
- `replaceable` (boolean)
- `exchangeable` (boolean)
- `return_window_days` (number, nullable)
- `return_policy_text` (string, nullable)
- `exchange_policy_text` (string, nullable)
- `damage_policy_text` (string, nullable)

#### Time-bound discount (auto-expire)

Stored in `items.discount`:

- `is_enabled` (boolean)
- `percentage` (number 0–100)
- `starts_at` (Date, nullable)
- `ends_at` (Date, nullable)

**How the “4 hours discount” automatically stops:**

- Backend computes discount at read-time.
- If `now` is outside `[starts_at, ends_at]`, discount is treated as inactive automatically.
- This means even if the fields remain in DB, the discount **will not apply** after expiry.

Optional later: a cleanup job can flip `is_enabled=false` after expiry, but correctness does not depend on it.

### 3.5 Removed / Deprecated: Budget Rules

- The old `budget_rules` table and `/admin/budget-rules` API/page are removed.
- Any logic that depended on budget percentages is replaced by **journey steps + categories + items**.

---

## 4. Admin Panel – How Data Is Managed

### 4.1 Vendors

Screen: **Vendors** (`/vendors`)

- Admin can:
  - View vendor list (name, email, type, city, commission %, status).
  - Add vendors with email + password (for vendor login later).
  - Suspend / edit vendors (in future).

### 4.2 Journey Steps

Screen: **Journey Steps** (`/journey-steps`)

- Admin defines the 7–8 steps of the user journey.
- For each journey step, admin manages:
  - Title (headline on user page).
  - Subtitle (small description under heading).
  - Slug (used in URLs and API).
  - Display order.
  - Active flag.

These steps are used by:

- Admin screens (category and item filters).
- User app’s progress bar and per-step pages.

### 4.3 Categories per Journey Step

Screen: **Categories** (`/categories`)

- Admin selects a journey step (e.g. *Venues*).
- For that step, admin manages categories:
  - Name
  - Slug
  - Sort order
  - Active flag

User app then uses these categories per step to filter items.

**Shopping step special:**

- Admin can create **subcategories** by selecting a **parent category** during category creation.

### 4.4 Items / Services

Screen: **Products & Venues** (`/items`)

- Items are conceptually linked to:
  - Journey Step
  - Category (within that step)
  - Subcategory (Shopping only)
  - Vendor

- The v1 UI shows an items list. The backend model already supports adding:
  - `vendor_id`
  - `journey_step_id`
  - `category_id`

In the next iteration, the admin UI will expose filters and creation forms that enforce this relationship so that each item clearly belongs to a journey step + category + vendor.

This has now been implemented in admin:

- Item creation requires step + category + vendor
- Shopping step optionally supports subcategory
- Admin can enter listing window, discount window, and policies

---

## 5. User App (mss-user) – How It Uses This Data

The user-facing site will use these APIs:

1. **Journey steps for progress bar and navigation**
   - `GET /api/v1/journey-steps` → list active steps, ordered by `order`.

2. **Step detail page**
   - `GET /api/v1/journey-steps/:stepSlug` → step info (title, subtitle, etc.).
   - `GET /api/v1/journey-steps/:stepId/categories` → categories for that step.
   - `GET /api/v1/items?journey_step_id=...&category_id=...&subcategory_id=...` → items for that step/category/subcategory.

3. **Vendor information**
   - User cards show vendor name + city using joined data from `vendors` when needed.

The visual layout (progress bar, “Choose Your Wedding Venue”, cards with images, etc.) maps directly to:

- `journey_steps` → step titles/subtitles + completion % (calculated client-side).
- `categories` → step-specific filter buttons.
- `items` → cards with image/name/rating/vendor/price and “Select” button.

**Listing windows & discount auto-expiry**

- `/api/v1/items` filters out items that are outside listing window (`listing_start_at`/`listing_end_at`).
- `/api/v1/items` returns computed fields:
  - `is_discount_active`
  - `discount_percentage`
  - `final_price`


---

## 6. Summary of Changes Compared to Old Design

- **Removed:**
  - Budget rules collection and `/admin/budget-rules` page.
  - Any dependency on category percentages for budget allocation.

- **Added:**
  - `journey_steps` collection + APIs.
  - Journey Steps entry in admin sidebar.
  - Clear conceptual model linking **Vendor → Items → (Journey Step + Category)**.

- **Next implementation steps:**
  - Wire categories and items APIs/UI tightly to `journey_step_id`.
  - Build full Journey Steps admin page for listing and editing steps.
  - Update user app to consume journey steps, categories, and items for each step page.

