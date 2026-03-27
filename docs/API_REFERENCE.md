# MyShaadiStore API Reference

Base URL for local development:

- Admin app + backend: `http://localhost:5000`
- All endpoints below are under: `http://localhost:5000/api/v1`

## Notes

- `Admin` routes require `Authorization: Bearer <admin_token>`.
- Public routes can be used by `mss-user` without admin auth unless noted.
- `Vendor` and `User` login endpoints return JWT tokens for their respective apps.

## Health

### `GET /api/v1/health`

Use: Quick server health check. Returns status and timestamp.

## Auth APIs

### `POST /api/v1/auth/admin/login`

Use: Admin login using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from env.

Body:

```json
{
  "email": "admin@mss.com",
  "password": "your-password"
}
```

### `POST /api/v1/auth/vendor/login`

Use: Vendor login using vendor email and password set by admin.

Body:

```json
{
  "email": "vendor@example.com",
  "password": "vendor-password"
}
```

### `POST /api/v1/auth/user/login`

Use: User login with phone number only.

Body:

```json
{
  "phone": "9876543210"
}
```

## Public APIs

### `GET /api/v1/journey-steps`

Use: Get all active journey steps for user flow/progress UI.

### `GET /api/v1/journey-steps/:stepIdOrSlug`

Use: Get one active journey step by Mongo ID or slug.

### `GET /api/v1/journey-steps/:stepIdOrSlug/categories`

Use: Get active categories for one journey step.

Query params:

- `parentCategoryId` or `parent_category_id`
- Pass empty value or `null` to fetch top-level categories only.

### `POST /api/v1/journey-steps/:stepIdOrSlug/categories`

Use: Admin convenience route to create a category directly under a journey step.

Body:

```json
{
  "name": "Banquet Hall",
  "slug": "banquet-hall",
  "parent_category_id": null,
  "is_active": true
}
```

### `GET /api/v1/items`

Use: Public item listing for the user app. Applies listing window checks and computes active discount/final price.

Query params:

- `journeyStepId` or `journey_step_id`
- `categoryId` or `category_id`
- `subcategoryId` or `subcategory_id`
- `vendorId` or `vendor_id`
- `status`
- `page`
- `limit`

## Admin APIs

### Dashboard

#### `GET /api/v1/admin/dashboard`

Use: Get admin dashboard stats like total sales, total vendors, total orders, last 7 days revenue, last 30 days revenue.

### Vendors

#### `GET /api/v1/admin/vendors`

Use: List vendors with optional pagination and status filter.

Query params:

- `status`
- `page`
- `limit`

#### `POST /api/v1/admin/vendors`

Use: Create a new vendor account and login credentials.

Important fields:

- `businessName` or `business_name`
- `email`
- `password`
- `vendorType` or `vendor_type`
- `city`
- `state`
- `contactPhone` or `contact_phone`
- `commissionPercentage` or `commission_percentage`
- `status`

#### `GET /api/v1/admin/vendors/:vendorId`

Use: Get one vendor detail for edit/view screens.

#### `PUT /api/v1/admin/vendors/:vendorId`

Use: Update vendor profile fields and optionally reset password.

#### `PUT /api/v1/admin/vendors/:vendorId/suspend`

Use: Mark a vendor as suspended.

### Users

#### `GET /api/v1/admin/users`

Use: Placeholder users listing API. Currently returns empty list with pagination shape.

Query params:

- `page`
- `limit`

#### `GET /api/v1/admin/users/:userId`

Use: Placeholder single-user lookup. Currently returns not found.

#### `PUT /api/v1/admin/users/:userId`

Use: Placeholder user update endpoint.

### Journey Steps

#### `GET /api/v1/admin/journey-steps`

Use: List all journey steps for admin management.

#### `POST /api/v1/admin/journey-steps`

Use: Create a new journey step.

Important fields:

- `title`
- `slug`
- `subtitle`
- `order`
- `icon`
- `is_active`

#### `GET /api/v1/admin/journey-steps/:stepId`

Use: Get one journey step by ID for edit screen.

#### `PUT /api/v1/admin/journey-steps/:stepId`

Use: Update one journey step.

#### `DELETE /api/v1/admin/journey-steps/:stepId`

Use: Delete one journey step.

### Categories

#### `GET /api/v1/admin/categories`

Use: List categories. Can return all categories or filter by journey step and/or parent category.

Query params:

- `journeyStepId` or `journey_step_id`
- `parentCategoryId` or `parent_category_id`

#### `POST /api/v1/admin/categories`

Use: Create a category or subcategory.

Important fields:

- `journeyStepId` or `journey_step_id`
- `name`
- `slug`
- `description`
- `parentCategoryId` or `parent_category_id`
- `is_active`

#### `GET /api/v1/admin/categories/:categoryId`

Use: Get one category for edit/view.

#### `PUT /api/v1/admin/categories/:categoryId`

Use: Update category fields, including parent category and linked journey step.

#### `DELETE /api/v1/admin/categories/:categoryId`

Use: Delete one category.

### Items

#### `GET /api/v1/admin/items`

Use: List items for admin with filters.

Query params:

- `vendorId`
- `categoryId`
- `subcategoryId` or `subcategory_id`
- `journeyStepId` or `journey_step_id`
- `item_type`
- `status`
- `page`
- `limit`

#### `POST /api/v1/admin/items`

Use: Create a new item/service/product/venue.

Important fields:

- `vendorId` or `vendor_id`
- `journeyStepId` or `journey_step_id`
- `categoryId` or `category_id`
- `subcategoryId` or `subcategory_id`
- `name`
- `slug`
- `description`
- `images`
- `price`
- `itemType` or `item_type`
- `locationCity` or `location_city`
- `listing_start_at`
- `listing_end_at`
- `discount`
- `policies`
- `status`

#### `GET /api/v1/admin/items/:itemId`

Use: Get one item with its variants.

#### `PUT /api/v1/admin/items/:itemId`

Use: Update item fields, journey/category links, listing window, discount, and policies.

#### `DELETE /api/v1/admin/items/:itemId`

Use: Delete one item and its variants.

### Item Variants

#### `POST /api/v1/admin/items/:itemId/variants`

Use: Create a variant for an item.

Important fields:

- `sku`
- `size`
- `color`
- `price`
- `stockQuantity` or `stock_quantity`
- `lowStockThreshold` or `low_stock_threshold`

#### `PUT /api/v1/admin/items/:itemId/variants/:variantId`

Use: Update variant stock and/or price.

### Orders

#### `GET /api/v1/admin/orders`

Use: List all orders with optional status filter and pagination.

Query params:

- `status`
- `page`
- `limit`

#### `GET /api/v1/admin/orders/:orderId`

Use: Get one order detail.

#### `PUT /api/v1/admin/orders/:orderId/status`

Use: Update only the order status.

Body:

```json
{
  "status": "Confirmed"
}
```

## Quick Grouping

- Auth: admin, vendor, user login
- Public catalog: journey steps, step categories, items
- Admin management: dashboard, vendors, users, journey steps, categories, items, variants, orders







============================================================================================================================================================================================================================================================================================================================================================================================================================

Health

GET /api/v1/health

Auth APIs

POST /api/v1/auth/admin/login

POST /api/v1/auth/vendor/login

POST /api/v1/auth/user/login

Public APIs

GET /api/v1/journey-steps

GET /api/v1/journey-steps/:stepIdOrSlug

GET /api/v1/journey-steps/:stepIdOrSlug/categories

POST /api/v1/journey-steps/:stepIdOrSlug/categories

GET /api/v1/items

Admin APIs
Dashboard

GET /api/v1/admin/dashboard

Vendors

GET /api/v1/admin/vendors

POST /api/v1/admin/vendors

GET /api/v1/admin/vendors/:vendorId

PUT /api/v1/admin/vendors/:vendorId

PUT /api/v1/admin/vendors/:vendorId/suspend

Users

GET /api/v1/admin/users

GET /api/v1/admin/users/:userId

PUT /api/v1/admin/users/:userId

Journey Steps

GET /api/v1/admin/journey-steps

POST /api/v1/admin/journey-steps

GET /api/v1/admin/journey-steps/:stepId

PUT /api/v1/admin/journey-steps/:stepId

DELETE /api/v1/admin/journey-steps/:stepId

Categories

GET /api/v1/admin/categories

POST /api/v1/admin/categories

GET /api/v1/admin/categories/:categoryId

PUT /api/v1/admin/categories/:categoryId

DELETE /api/v1/admin/categories/:categoryId

Items

GET /api/v1/admin/items

POST /api/v1/admin/items

GET /api/v1/admin/items/:itemId

PUT /api/v1/admin/items/:itemId

DELETE /api/v1/admin/items/:itemId

Item Variants

POST /api/v1/admin/items/:itemId/variants

PUT /api/v1/admin/items/:itemId/variants/:variantId

Orders

GET /api/v1/admin/orders

GET /api/v1/admin/orders/:orderId

PUT /api/v1/admin/orders/:orderId/status