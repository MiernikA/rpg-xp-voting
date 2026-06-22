# RPG XP Voting

Production-ready full-stack web app for tabletop RPG groups to distribute post-session XP or reward points.

## Stack

- Backend: FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL, JWT, Pydantic v2
- Frontend: React, TypeScript, Vite, Material UI, React Router, TanStack Query, Axios, Recharts
- Infrastructure: Docker, Docker Compose, Vercel, Neon Postgres, Render blueprint

## Features

- JWT login with access and refresh tokens
- Admin and player roles
- Environment-seeded default admin account
- Admin player management, password reset endpoint, and deactivation
- Groups with independent members and sessions
- Players can belong to more than one group
- Draft, active, and closed voting sessions
- Voting sessions are scoped to a group and store a fixed participant list
- Closed sessions are immutable
- Exact point-pool validation
- XP is awarded 1:1 from voting points
- Session pools and vote lines must be multiples of 5
- One submission per player per session
- Self-voting blocked
- Result comments always show authors
- Player My Info page with profile color, groups, and received point history
- Mobile-first voting page with sticky submit footer
- Admin dashboard with progress metrics
- Results rankings, comments search, CSV export, Excel export
- Statistics dashboard with Recharts
- PWA-ready manifest and service worker

## Local Development

Copy env examples if you want to run services outside Docker:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Run the full stack:

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

Default local admin from `docker-compose.yml`:

- Username: `admin`
- Password: `admin12345`

## Backend Commands

From `backend/`:

```bash
pip install -r requirements-dev.txt
alembic upgrade head
python -m scripts.seed_admin
uvicorn app.main:app --reload
ruff check .
black --check .
pytest
```

## Frontend Commands

From `frontend/`:

```bash
npm install
npm run dev
npm run lint
npm run build
```

## API Overview

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/register` when `ALLOW_REGISTRATION=true`
- `GET/POST/PATCH /api/groups`
- `GET/POST/PATCH /api/players`
- `POST /api/players/{id}/reset-password`
- `GET/POST/PATCH /api/sessions`
- `GET /api/sessions/active`
- `POST /api/sessions/{id}/activate`
- `POST /api/sessions/{id}/close`
- `GET /api/sessions/{id}/progress`
- `GET /api/votes/recipients`
- `GET /api/votes/recipients?session_id={id}`
- `POST /api/votes/{session_id}/submit`
- `GET /api/results/{session_id}`
- `GET /api/results/{session_id}/players/{player_id}`
- `GET /api/results/comments/search`
- `GET /api/results/{session_id}/export.csv`
- `GET /api/results/{session_id}/export.xlsx`
- `GET /api/statistics/dashboard`
- `GET /api/statistics`

## Free Deployment: Vercel + Neon

The free deployment path is:

- Vercel Hobby for the React frontend and FastAPI serverless function
- Neon Free for PostgreSQL

Vercel serves the frontend from `frontend/dist` and rewrites `/api/*` to the Python function in `api/index.py`. The function runs Alembic migrations and seeds the configured admin account on cold start.

1. Create a Neon project and copy the pooled PostgreSQL connection string.
2. In Vercel, import this GitHub repository as a new project.
3. Keep the default project root as the repository root.
4. Use the included `vercel.json`; it builds the frontend with:

```bash
cd frontend && npm ci && npm run build
```

5. Set these Vercel environment variables for Production:

```bash
ENVIRONMENT=production
DATABASE_URL=<neon pooled connection string>
JWT_SECRET=<long random secret>
CORS_ORIGINS=https://<your-vercel-project>.vercel.app
ADMIN_USERNAME=<admin username>
ADMIN_PASSWORD=<admin password>
ADMIN_DISPLAY_NAME=Game Master
ALLOW_REGISTRATION=false
```

6. Deploy from Vercel.
7. After deploy, verify:

- `https://<your-vercel-project>.vercel.app/api/healthz`
- `https://<your-vercel-project>.vercel.app/api/auth/login`
- admin login in the browser

Notes:

- The Neon Free plan has limited compute, storage, and egress. It is enough for a small private RPG group, but it can suspend when free limits are exceeded.
- Vercel Hobby serverless functions have a short execution window, so avoid large imports, heavy reports, or very large exports.
- If the app grows beyond the free limits, move the backend to a persistent service and keep Neon or another managed Postgres provider.

## Render Deployment

This repo includes `render.yaml` for a Blueprint deployment.

1. Push the repository to GitHub.
2. In Render, create a new Blueprint from the repo.
3. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `CORS_ORIGINS` on the API service.
4. Set `VITE_API_URL` on the web service to `https://<api-service>.onrender.com/api`.
5. Set `CORS_ORIGINS` on the API service to `https://<web-service>.onrender.com`.
6. Deploy.

The backend container runs migrations and seeds the configured admin on startup:

```bash
alembic upgrade head && python -m scripts.seed_admin && uvicorn app.main:app
```

## Data Integrity Notes

Closed sessions cannot be edited or reopened. Historical vote rows are never overwritten. To run a new vote after a mistake, create a new session.

## Production Notes

- Use a long random `JWT_SECRET`.
- Store credentials only in Render environment variables.
- Keep `ALLOW_REGISTRATION=false` unless public player signup is intended.
- Use Render PostgreSQL for `DATABASE_URL`.
- Configure CORS to the exact frontend origin.
