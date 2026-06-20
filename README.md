# Mongo CRUD REST API with JWT & Role-Based Access

A Node.js + Express + MongoDB REST API demonstrating:
- Full CRUD (GET, POST, PUT, PATCH, DELETE)
- Register & Login with JWT
- Auth middleware (protect routes)
- Hierarchical role-based access: **admin > manager > employee**
- Testable in Postman

---

## 1. Project Structure

```
mongo-crud-jwt-api/
├── config/
│   └── db.js                 # MongoDB connection
├── models/
│   ├── User.js                # name, email, password (hashed), role
│   └── Product.js             # CRUD demo resource
├── middleware/
│   ├── authMiddleware.js      # verifies JWT, attaches req.user
│   └── roleMiddleware.js      # authorize() / minRole() role checks
├── controllers/
│   ├── authController.js      # register, login, getMe
│   └── productController.js   # create, read, update, delete
├── routes/
│   ├── authRoutes.js
│   └── productRoutes.js
├── server.js                  # app entry point
├── .env.example
└── package.json
```

## 2. Setup

```bash
cd mongo-crud-jwt-api
npm install
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/mongo_crud_jwt
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```

- Use a local MongoDB (`mongodb://127.0.0.1:27017/...`) or a MongoDB Atlas connection string.
- `JWT_SECRET` should be a long random string in production.

Run it:

```bash
npm run dev    # nodemon, auto-restart
# or
npm start
```

Server runs at `http://localhost:5000`.

---

## 3. Roles & Access Rules

| Role     | Read products | Create/Update | Delete |
|----------|:---:|:---:|:---:|
| employee | ✅ | ❌ | ❌ |
| manager  | ✅ | ✅ | ❌ |
| admin    | ✅ | ✅ | ✅ |

This is enforced with two reusable middlewares in `middleware/roleMiddleware.js`:
- `minRole('manager')` → allows manager **and anything ranked above it** (admin).
- `authorize('admin')` → allows only the exact role(s) listed.

---

## 4. API Reference

### Auth — `/api/auth`

| Method | Endpoint | Access | Body |
|---|---|---|---|
| POST | `/api/auth/register` | Public | `{ "name", "email", "password", "role" }` (role optional, defaults to `employee`) |
| POST | `/api/auth/login` | Public | `{ "email", "password" }` |
| GET | `/api/auth/me` | Private (any logged-in user) | — (send Bearer token) |

**Register example**
```json
POST /api/auth/register
{
  "name": "Asha Patel",
  "email": "asha@example.com",
  "password": "secret123",
  "role": "manager"
}
```

**Response**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "...", "name": "Asha Patel", "email": "asha@example.com", "role": "manager" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Login example**
```json
POST /api/auth/login
{ "email": "asha@example.com", "password": "secret123" }
```

### Products — `/api/products` (CRUD, all routes require JWT)

| Method | Endpoint | Min Role | Description |
|---|---|---|---|
| GET | `/api/products` | employee | List all products |
| GET | `/api/products/:id` | employee | Get one product |
| POST | `/api/products` | manager | Create a product |
| PUT | `/api/products/:id` | manager | Full update |
| PATCH | `/api/products/:id` | manager | Partial update |
| DELETE | `/api/products/:id` | admin | Delete a product |

Every request (except register/login) needs this header:
```
Authorization: Bearer <token>
```

**Create product example**
```json
POST /api/products
Authorization: Bearer <manager_or_admin_token>

{
  "name": "Wireless Mouse",
  "description": "Ergonomic 2.4GHz mouse",
  "price": 799,
  "quantity": 50
}
```

---

## 5. Testing in Postman

1. **Create a Postman Collection** called `Mongo CRUD JWT API`.
2. Add a **Collection Variable** `baseUrl` = `http://localhost:5000` and `token` = (leave blank for now).
3. **Register** → `POST {{baseUrl}}/api/auth/register` with the JSON body above.
4. **Login** → `POST {{baseUrl}}/api/auth/login`. In the **Tests** tab of this request, add a script to auto-save the token:
   ```javascript
   const res = pm.response.json();
   pm.collectionVariables.set("token", res.data.token);
   ```
5. For every protected request, go to the **Authorization** tab → type **Bearer Token** → value `{{token}}` (or add header `Authorization: Bearer {{token}}` manually).
6. Test the CRUD endpoints:
   - `GET {{baseUrl}}/api/products`
   - `POST {{baseUrl}}/api/products` (needs manager/admin token)
   - `PUT {{baseUrl}}/api/products/:id`
   - `PATCH {{baseUrl}}/api/products/:id`
   - `DELETE {{baseUrl}}/api/products/:id` (needs admin token)
7. To test the role hierarchy: register one user with `"role": "employee"` and try `POST /api/products` — you should get a `403 Forbidden`.

A ready-to-import Postman collection is included: **`postman_collection.json`**.

---

## 6. Notes / Next Steps

- Passwords are hashed with `bcryptjs` before saving (see `User.js` pre-save hook).
- The `password` field uses `select: false` so it's never returned in queries by default.
- JWT payload only stores the user `id`; the middleware looks up the full user on every request — simple and always up to date, at the cost of one extra DB read per request (fine for most apps; swap for a cached/stateless approach if you need higher throughput).
- To add more resources, copy the `Product` model/controller/route pattern.
- For production: use HTTPS, a strong rotated `JWT_SECRET`, rate limiting (`express-rate-limit`), and input validation (`express-validator` or `zod`).
