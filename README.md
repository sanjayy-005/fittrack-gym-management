# FitTrack - Gym Management System

A full stack gym management app: members, trainers, membership plans, renewals, payments with printable receipts, attendance tracking, reports and role-based access, in a responsive black and orange dark UI.

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, React Router, Axios |
| Backend | Python, Django 5.2, Django REST Framework |
| Database | MySQL |
| Auth | JWT (SimpleJWT, with refresh and logout blacklist) |
| Deploy | Render (API) + Vercel (frontend) |

## Features

- **Dashboard**: member stats, revenue, monthly revenue chart, plan mix, member growth, attendance trend, expiring memberships, recent payments.
- **Members**: add, edit, delete, search, filter by membership status, trainer and active state, and a detail view with membership, payment and attendance history.
- **Trainers**: CRUD, optional login account, assign or unassign members, see each trainer's members.
- **Plans and memberships**: monthly, quarterly and yearly plans, sell a membership, renew, cancel, expiry tracking ("expiring in 7 days"), automatic expiry.
- **Payments**: record payments, filter by status, method and date, summary totals, printable receipts.
- **Attendance**: check in and check out, daily log, and reports (visits per day, peak hours, most regular members).
- **Users and roles**: login and logout, protected routes, three roles (see below), admin screen for user accounts.
- **Quality**: form validation, loading states, error messages, pagination, and server-side permissions on every endpoint.

### Roles

| | Admin | Front desk (STAFF) | Trainer |
|---|---|---|---|
| Dashboard | Everything | Everything | Own members only, no revenue |
| Members | Full control | Full control | View own members |
| Trainers | Full control | View, assign members | - |
| Plans | Full control | View | View |
| Memberships | Full control | Sell, renew, cancel | View own members |
| Payments | Full control | Record, edit, view | - |
| Attendance | Full control | Check in and out, delete | Check in own members |
| User accounts | Full control | - | - |

These rules are enforced by the API (`backend/core/permissions.py`). The UI only hides what the API would refuse anyway.

## Project structure

```
fittrack/
├── backend/                  Django project
│   ├── config/               settings, urls, wsgi
│   ├── core/                 permissions, pagination, errors, seed_data command
│   ├── accounts/             custom User (role field), JWT login/logout, user admin API
│   ├── members/  trainers/  plans/  payments/  attendance/  dashboard/
│   ├── build.sh              used by Render
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 React app
│   ├── src/api/              axios client (token refresh) and endpoint functions
│   ├── src/components/       Layout, ui/ building blocks, feature modals
│   ├── src/pages/            one file per screen
│   ├── src/context/          auth and toast providers
│   ├── vercel.json
│   └── .env.example
├── render.yaml               Render blueprint
└── README.md
```

## Run it on Windows

You need: **Python 3.10 or newer**, **Node.js 18 or newer** (20 LTS recommended), **MySQL 8**, and **Git**.

### 1. Create the database

Open *MySQL Command Line Client* (or MySQL Workbench) and run:

```sql
CREATE DATABASE fittrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Start the backend

Open a terminal in the project folder:

```bat
cd backend
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Open `backend\.env` in a text editor and set `DB_PASSWORD` to your MySQL password. Then:

```bat
python manage.py makemigrations
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

The API is now at http://127.0.0.1:8000/api/ (health check: http://127.0.0.1:8000/api/health/).

> **PowerShell says "running scripts is disabled"?** Run `Set-ExecutionPolicy -Scope Process Bypass` once in that window, then activate the venv again. Or use Command Prompt (`cmd`) instead.
>
> **`makemigrations` matters.** The migration files are generated on your machine so they always match your Django version. Run it once, then commit the new `migrations/` files to Git.

### 3. Start the frontend

Open a **second** terminal:

```bat
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open http://localhost:5173.

### Demo logins (created by `seed_data`)

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `Admin@123` |
| Front desk | `staff` | `Staff@123` |
| Trainer | `arjun` (also `priya`, `rahul`) | `Trainer@123` |

`python manage.py seed_data --reset` wipes everything and reloads fresh demo data. To create your own admin instead, run `python manage.py createsuperuser` (it gets the Admin role automatically).

### Keeping memberships up to date

Memberships past their end date are marked expired automatically whenever the API is used. You can also run it by hand, or schedule it daily:

```bat
python manage.py update_membership_status
```

## API overview

All endpoints are under `/api/` and need `Authorization: Bearer <access token>` except login and health. List endpoints are paginated (`?page=2&page_size=20`) and support `?search=` and `?ordering=`.

| Endpoint | Purpose |
|---|---|
| `POST /auth/login/`, `/auth/refresh/`, `/auth/logout/` | JWT login, refresh, logout (blacklists the refresh token) |
| `GET /auth/me/` | Current user |
| `/auth/users/` | User accounts (admin only) |
| `/members/` | CRUD. Filters: `membership_status`, `trainer`, `trainer_isnull`, `is_active`, `gender` |
| `/trainers/`, `/trainers/{id}/members/`, `/assign/`, `/unassign/` | Trainers and assignments |
| `/plans/` | Membership plans |
| `/memberships/`, `/memberships/{id}/renew/`, `/cancel/` | Sell, renew and cancel memberships. Filters: `status`, `plan`, `member`, `expiring_in` |
| `/payments/`, `/payments/summary/`, `/payments/{id}/receipt/` | Payments, totals, receipt data |
| `/attendance/`, `/attendance/check-in/`, `/{id}/check-out/`, `/report/?days=30` | Attendance and reports |
| `/dashboard/` | Dashboard numbers and chart data |

You can also manage data at http://127.0.0.1:8000/admin/ with an admin login.

## Deploy

The backend goes on **Render**, the frontend on **Vercel**. Render does not offer MySQL, so you need a MySQL 8 database hosted elsewhere (for example Aiven, Railway or any managed MySQL). Check each provider's current free-tier limits.

### Step 1: Put the code on GitHub

See [Push to GitHub](#push-to-github) below.

### Step 2: Backend on Render

1. Create your MySQL database with your provider and note its host, port, database name, user and password.
2. In Render choose **New +, Blueprint**, connect your GitHub repo and select it. Render reads `render.yaml`.
3. Fill in the values it asks for: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`. Leave `CORS_ALLOWED_ORIGINS` empty for now.
4. If your database provider uses its own SSL certificate (Aiven does), download its CA file, save it as `backend/certs/ca.pem`, commit it, and set `DB_SSL_CA=certs/ca.pem` in Render. The default value works for providers that use public certificates.
5. Deploy. `build.sh` installs packages, collects static files, runs migrations, and loads demo data when `SEED_DEMO_DATA=true`.
6. Open `https://<your-service>.onrender.com/api/health/`. You should see `{"status": "ok", "database": "up"}`.

Notes: free Render services sleep when idle, so the first request after a pause can take a while. The demo passwords are public in this README, so after the first deploy set `SEED_DEMO_DATA` to `false` and change the passwords in **Users** (or `/admin/`) before sharing the link.

### Step 3: Frontend on Vercel

1. In Vercel choose **Add New, Project** and import the same GitHub repo.
2. Set **Root Directory** to `frontend`. The framework (Vite) is detected automatically.
3. Add the environment variable `VITE_API_URL` = `https://<your-service>.onrender.com/api` (include `/api`, no trailing slash).
4. Deploy. Vercel gives you a URL like `https://fittrack.vercel.app`.

### Step 4: Connect the two

In Render, open your service, then **Environment**, and set:

```
CORS_ALLOWED_ORIGINS=https://fittrack.vercel.app
CSRF_TRUSTED_ORIGINS=https://<your-service>.onrender.com
```

Use your real addresses, without a trailing slash. Save, let Render redeploy, then log in on your Vercel site. If you later add a custom domain, add it to `CORS_ALLOWED_ORIGINS` too (comma separated).

## Push to GitHub

Create an empty repository on github.com (no README, no .gitignore), then in the `fittrack` folder:

```bat
git init
git add .
git commit -m "Initial commit: FitTrack gym management system"
git branch -M main
git remote add origin https://github.com/<your-username>/fittrack.git
git push -u origin main
```

The included `.gitignore` keeps your `.env` files, `venv` and `node_modules` out of the repository. Never commit real passwords or secret keys. Check with `git status` before every commit.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Access denied for user` | Wrong `DB_USER` or `DB_PASSWORD` in `backend\.env`. |
| `Unknown database 'fittrack'` | Run the `CREATE DATABASE` command from step 1. |
| `No changes detected` or missing tables | Run `python manage.py makemigrations` before `migrate`. |
| Login page says it cannot reach the server | The backend is not running, or `VITE_API_URL` is wrong. Restart `npm run dev` after editing `.env`. |
| Browser console shows a CORS error | Add your frontend address to `CORS_ALLOWED_ORIGINS` (no trailing slash) and restart the backend. |
| `ImproperlyConfigured: SECRET_KEY` on Render | `DEBUG` is `False` and no `SECRET_KEY` is set. The blueprint generates one. |
| Page not found after refreshing on Vercel | Make sure `frontend/vercel.json` is committed (it rewrites all routes to `index.html`). |

## Good to know

- Tokens are kept in the browser's `localStorage`. That is fine for a portfolio project; a larger product might prefer httpOnly cookies.
- Money is stored as exact decimals (never floats) and shown in Indian rupees. To change the currency symbol, edit `frontend/src/utils/format.js`.
- A member can check in once per day, and only with an active membership.
- A member who has payment records cannot be deleted (the payment history is protected). Mark them inactive instead.
