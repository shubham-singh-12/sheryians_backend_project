# Authentication & Product CRUD API's — Sheryians Coding School Assignment

A small e-commerce platform with JWT access + refresh token authentication and
full Product CRUD, validated with `express-validator`, plus a React frontend
that consumes the API.

## Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Auth:** JWT (short-lived access token + long-lived refresh token)
- **Validation:** express-validator
- **Frontend:** React (Vite) + React Router + Axios

## Project Structure

```
project/
├── backend/
│   ├── config/db.js
│   ├── controllers/authController.js
│   ├── controllers/productController.js
│   ├── middleware/authenticate.js
│   ├── middleware/validate.js
│   ├── models/User.js
│   ├── models/Product.js
│   ├── routes/authRoutes.js
│   ├── routes/productRoutes.js
│   ├── utils/generateTokens.js
│   ├── validations/authValidation.js
│   ├── validations/productValidation.js
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js
    │   ├── api/tokenStore.js
    │   ├── api/productService.js
    │   ├── context/AuthContext.jsx
    │   ├── components/Navbar.jsx
    │   ├── components/ProtectedRoute.jsx
    │   ├── pages/Login.jsx
    │   ├── pages/Register.jsx
    │   ├── pages/Products.jsx
    │   ├── pages/ProductForm.jsx
    │   ├── App.jsx
    │   └── main.jsx
    └── .env.example
```

## How the Auth Flow Works

1. **Register** — password is hashed with bcrypt (10 salt rounds) before being
   saved. The created user is returned without a password and without tokens.
2. **Login** — password is checked with `bcrypt.compare`. On success:
   - An **access token** (15 min, signed with `ACCESS_TOKEN_SECRET`) is
     returned in the JSON response body.
   - A **refresh token** (7 days, signed with `REFRESH_TOKEN_SECRET`) is set
     as an **httpOnly, secure cookie** and also saved on the user document in
     MongoDB, so it can be revoked later.
3. **Protected requests** — the frontend sends `Authorization: Bearer <accessToken>`.
   The `authenticate` middleware verifies it and attaches `req.user`.
4. **Refresh** — when the access token expires, the frontend calls
   `/api/auth/refresh-token` (the browser sends the httpOnly cookie
   automatically). The server verifies the token's signature **and** checks
   it against the token stored in the database. If valid, it issues a new
   access token and **rotates** the refresh token (old one is replaced).
   Reused/invalid/expired refresh tokens return `401`/`403`, and the frontend
   sends the user back to login.
5. **Logout** — clears the stored refresh token in the database and clears
   the cookie, so that token can never be used again.

On the frontend, the access token is kept only in memory (not
`localStorage`) to reduce XSS exposure. On app load, the app silently calls
`/auth/refresh-token` using the httpOnly cookie to restore the session if one
exists.

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in real secret values
npm run dev             # or: npm start
```

Backend runs on `http://localhost:5000` by default.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173` by default (Vite).

> Make sure `CLIENT_URL` in the backend `.env` matches the frontend origin,
> and `VITE_API_BASE_URL` in the frontend `.env` matches the backend's
> `/api` base URL — this is required for cookies (`withCredentials`) and CORS
> to work correctly.

## API Endpoints

### Auth

| Method | Endpoint                    | Access        | Description                          |
|--------|------------------------------|---------------|---------------------------------------|
| POST   | `/api/auth/register`         | Public        | Create a new user account            |
| POST   | `/api/auth/login`            | Public        | Authenticate, issue access + refresh tokens |
| POST   | `/api/auth/refresh-token`    | Public*       | Issue a new access token (*requires valid refresh token cookie) |
| POST   | `/api/auth/logout`           | Authenticated | Invalidate the refresh token         |
| GET    | `/api/auth/me`                | Authenticated | Return the logged-in user's profile  |

### Products

| Method | Endpoint              | Access        | Description             |
|--------|------------------------|---------------|--------------------------|
| POST   | `/api/products`        | Authenticated | Create a new product    |
| GET    | `/api/products`        | Public        | List all products       |
| GET    | `/api/products/:id`    | Public        | Get a single product    |
| PUT    | `/api/products/:id`    | Authenticated | Update a product        |
| DELETE | `/api/products/:id`    | Authenticated | Delete a product        |

## Validation

All request bodies, params, and query inputs are validated with
`express-validator` in `backend/validations/`. Invalid requests get a `400`
with a field-level error list:

```json
{
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address" }
  ]
}
```

- **Register:** `name`, valid `email`, `password` (min 6 chars + a digit),
  `confirmPassword` must match `password`.
- **Login:** valid `email`, `password` required.
- **Products (create):** `name` required, `price` must be a number > 0,
  `stock` must be a whole number ≥ 0.
- **Products (update):** same rules, but fields are optional since it's a
  partial update.
- **Route params:** `:id` is validated as a valid MongoDB ObjectId before any
  database lookup; a non-existent product returns `404`.

## Security Checklist

- [x] Passwords hashed with bcrypt (10 salt rounds), never returned or logged
- [x] JWT secrets read from `.env`, never hardcoded
- [x] Refresh tokens stored server-side (on the user document) so they can be
      revoked
- [x] Refresh token delivered as an httpOnly, secure (in production) cookie
- [x] Refresh token rotation on every `/refresh-token` call
- [x] Generic `401` message on login failure (doesn't reveal which field is wrong)
