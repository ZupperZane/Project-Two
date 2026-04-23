# Project Two

React + Vite frontend with an Express server and MongoDB-backed API endpoints.

## How MongoDB Works (short version)

- MongoDB stores JSON-like documents (BSON) instead of rows/tables.
- Documents live in collections (similar to tables).
- You query documents by fields, and add indexes for fast lookups.
- In production, MongoDB usually runs as a replica set for availability.

## MongoDB Wiring In This Repo

This repo now includes:

- `mongo.js`: shared MongoDB client/DB connection.
- `index.js`: API routes:
  - `GET /api/health`
  - `GET /api/messages`
  - `POST /api/messages`
- `vite.config.ts`: dev proxy from frontend `/api/*` to `http://localhost:3000`.
- `src/pages/Home.tsx`: demo UI that reads/writes messages via the API.

## Setup

1. Create `.env` from `.env.example`.
2. Fill in:
   - `MONGODB_URI` (Atlas or local MongoDB URI)
   - `MONGODB_DB` (database name, default is `project_two`)
   - Firebase Admin credentials (`FIREBASE_SERVICE_ACCOUNT_KEY` or `GOOGLE_APPLICATION_CREDENTIALS`)
3. Run backend and frontend in separate terminals:

```bash
npm run server
npm run dev
```

## Quick API Check

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/messages
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"text":"hello mongo"}'
```

## Auth + Roles

Role hierarchy:

- `admin`
- `employer`
- `job_seeker`

The backend now verifies Firebase ID tokens on protected routes and stores per-account data in:

- `users`
- `admin_profiles`
- `employer_profiles`
- `job_seeker_profiles`
- `applications`

Key protected routes:

- `POST /api/users/bootstrap`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `DELETE /api/users/me`
- `GET /api/admin/users`
- `GET /api/admin/jobs`
- `PATCH /api/admin/users/:uid/status`
- `DELETE /api/admin/jobs/:id`
- `POST /api/employer/company-profile`
- `POST /api/employer/jobs`
- `PATCH /api/employer/jobs/:id`
- `DELETE /api/employer/jobs/:id`
- `GET /api/employer/jobs/:id/applicants`
- `GET /api/job-seeker/profile`
- `PATCH /api/job-seeker/profile`
- `POST /api/job-seeker/applications`
- `GET /api/job-seeker/applications`
