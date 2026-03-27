# MyShaadiStore – Admin + Backend (single app)

## Plan

See **`docs/BUILD_PLAN_BACKEND_AND_ADMIN.md`** for the full step-by-step plan.

## Auth (no role-based access)

- **Admin panel:** Admin logs in with **email + password from env** (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Only this login can access admin APIs.
- **Vendor panel:** Vendor logs in with **email + password** that **admin sets** when creating the vendor. Only vendor login can access vendor APIs.
- **User app:** User logs in with **phone number only** (no email/password).

## Quick start (one app: mss-admin = Admin UI + Backend)

There is **no separate backend folder**. All backend logic runs inside **mss-admin** as Next.js API routes.

```bash
cd mss-admin
cp .env.local.example .env.local
```

Edit **`.env.local`**:

- `MONGODB_URI=mongodb://localhost:27017/myshaadistore`
- `ADMIN_EMAIL=admin@mss.com`
- `ADMIN_PASSWORD=your-secure-password`
- `JWT_SECRET=your-jwt-secret-change-in-production`

```bash
npm install
npm run dev
```

- **mss-admin** runs on **port 5000**. Open **http://localhost:5000**. Login with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- **API (same origin):** All APIs are at **http://localhost:5000/api/v1/...** (e.g. `POST /api/v1/auth/admin/login`, `GET /api/v1/admin/dashboard`, etc.).

### mss-user (port 3000)

```bash
cd mss-user
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev
```

- **mss-user** runs on **port 3000**. Open **http://localhost:3000**.
- User app calls the API on **http://localhost:5000** (mss-admin). Set `NEXT_PUBLIC_API_URL=http://localhost:5000` in `.env.local`.

### API endpoints (all under `/api/v1`)

- **Health:** `GET /api/v1/health`
- **Admin login:** `POST /api/v1/auth/admin/login` — body: `{ "email", "password" }`
- **Vendor login:** `POST /api/v1/auth/vendor/login` — body: `{ "email", "password" }`
- **User login (phone):** `POST /api/v1/auth/user/login` — body: `{ "phone": "9876543210" }`
- **Admin (Bearer token):** `/api/v1/admin/dashboard`, `/admin/vendors`, `/admin/journey-steps`, `/admin/categories`, `/admin/items`, `/admin/orders`, `/admin/users`

## What’s included

- **mss-admin (Next.js):** Admin UI + full backend as API routes. **MongoDB** for vendors, journey_steps, categories, items, variants, orders. Auth: admin (env), vendor (email+password in DB), user (phone). No separate server or port.
- **Admin UI:** Login (admin email/pass), sidebar, dashboard, Vendors (add vendor with **email + password**), Journey Steps, Categories, Items, Orders, Users.

## Next steps

1. Build vendor panel (vendor login with email+pass only).
2. Build user app in **mss-user** (phone-only login).
3. Integrate Razorpay, Shiprocket, Web3Forms.
