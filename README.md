# Application Tracker

A clean, fast job application tracker with a Kanban-style board. Track your job applications across customizable stages — runs entirely in the browser with local storage, or with a full backend + PostgreSQL.

## Features

- **Kanban Board** — Drag-and-drop applications across customizable stages (Wishlist, Applied, Interview, Rejected, or your own)
- **Dual Storage Modes** — Use browser localStorage (zero setup) or a FastAPI + PostgreSQL backend
- **Info Items & Timeline** — Attach comments, track stage transitions, and see activity history per application
- **Backup & Restore** — Export/import your data as JSON; includes backup reminders after 7 days or 10 changes
- **GitHub Pages Deployment** — Auto-deploys the local-storage version as a static site via GitHub Actions
- **Stage Management** — Add, edit, reorder, and delete custom pipeline stages
- **Dark Mode** — Full dark mode support via Nuxt UI

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Nuxt 3, Vue 3, Nuxt UI, Tailwind CSS, vue-draggable-plus |
| Backend | FastAPI, SQLAlchemy 2, Pydantic 2, Alembic |
| Database | PostgreSQL 16 |
| Testing | Vitest (frontend) |
| Deployment | Docker Compose, GitHub Pages (static) |

## Quick Start

### Option 1: Local Storage Only (no backend needed)

The simplest way to run the app — everything is stored in your browser's localStorage.

```bash
cd frontend
npm install
NUXT_PUBLIC_STORAGE_MODE=local npm run dev
```

Open http://localhost:3000. That's it — no database, no backend.

> **Note:** Data lives in your browser only. Use the built-in Backup & Restore feature to save your data.

### Option 2: Docker Compose (full stack)

Runs the frontend, backend, and PostgreSQL together.

```bash
cp .env.example .env        # review and adjust if needed
docker-compose up -d
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |

### Option 3: Local Development (full stack, no Docker)

#### 1. Start PostgreSQL

Use any local PostgreSQL instance. Default connection:

```
postgresql://apptracker:apptracker123@localhost:5432/apptracker
```

Or set `DATABASE_URL` in your environment.

#### 2. Start the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head          # run database migrations
uvicorn app.main:app --reload
```

Backend runs at http://localhost:8000.

#### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000 and connects to the backend at `http://localhost:8000` by default.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NUXT_PUBLIC_STORAGE_MODE` | `api` | `api` = use backend + PostgreSQL; `local` = browser localStorage only |
| `NUXT_PUBLIC_API_BASE` | `http://localhost:8000` | Backend API URL (only used when storage mode is `api`) |
| `NUXT_PUBLIC_BASE_URL` | `/` | Base URL path for the frontend (used for GitHub Pages: `/app-tracker/`) |
| `DATABASE_URL` | `postgresql://apptracker:apptracker123@localhost:5432/apptracker` | PostgreSQL connection string |
| `POSTGRES_USER` | `apptracker` | PostgreSQL user (Docker Compose) |
| `POSTGRES_PASSWORD` | `apptracker123` | PostgreSQL password (Docker Compose) |
| `POSTGRES_DB` | `apptracker` | PostgreSQL database name (Docker Compose) |

## Storage Architecture

The app uses an adapter pattern to swap between storage backends transparently:

```
useApplications() / useStages() / useInfoItems()
         │
    useStorage()  ──→  storageMode === 'local' ? localStorageAdapter : apiAdapter
         │                        │                         │
         │              browser localStorage        FastAPI + PostgreSQL
```

Both adapters implement the same `StorageAdapter` interface, so all composables and components work identically regardless of storage mode.

## API Endpoints

### Applications

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/applications` | List all applications |
| `GET` | `/applications/{id}` | Get application with info items |
| `POST` | `/applications` | Create application |
| `PUT` | `/applications/{id}` | Update application |
| `DELETE` | `/applications/{id}` | Delete application |

### Stages

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/stages` | List all stages |
| `POST` | `/stages` | Create stage |
| `PATCH` | `/stages/{id}` | Update stage |
| `DELETE` | `/stages/{id}` | Delete stage |

### Info Items

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/applications/{id}/info-items/` | List info items for an application |
| `POST` | `/applications/{id}/info-items/` | Create info item |
| `PUT` | `/applications/{id}/info-items/{item_id}` | Update info item |
| `DELETE` | `/applications/{id}/info-items/{item_id}` | Delete info item |

### Utility

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | API info |
| `GET` | `/health` | Health check |

## Database Migrations

Migrations are managed with Alembic (in `backend/alembic/versions/`):

```bash
cd backend

# Apply all migrations
alembic upgrade head

# Create a new migration after model changes
alembic revision --autogenerate -m "description"

# Rollback one migration
alembic downgrade -1
```

## Backup & Restore (Local Storage Mode)

When running in `local` mode, your data lives only in the browser. The app includes:

- **Export** — Downloads a `app-tracker-export-YYYY-MM-DD.json` file with all applications, stages, and info items
- **Import** — Restores from a previously exported JSON file (with confirmation dialog and stats preview)
- **Backup Reminders** — A banner appears after 7 days without a backup or after 10 changes

## Static Site Generation (GitHub Pages)

The GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys a static version on every push to `main`:

```bash
# Generate locally
cd frontend
NUXT_PUBLIC_STORAGE_MODE=local NUXT_PUBLIC_BASE_URL=/app-tracker/ npx nuxt generate
```

The static site uses local storage mode exclusively — no backend required.

## Project Structure

```
app-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, router registration
│   │   ├── database.py          # SQLAlchemy engine and session
│   │   ├── models.py            # Application, ApplicationInfoItem, Stage
│   │   ├── schemas.py           # Pydantic request/response models
│   │   ├── crud.py              # Application CRUD operations
│   │   ├── crud_stages.py       # Stage CRUD operations
│   │   ├── crud_info_items.py   # Info item CRUD operations
│   │   └── routers/             # FastAPI route handlers
│   │       ├── applications.py
│   │       ├── stages.py
│   │       └── info_items.py
│   ├── alembic/                 # Database migrations
│   │   └── versions/            # Migration scripts (001–004)
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── adapters/
│   │   ├── api.ts               # REST API adapter (FastAPI backend)
│   │   └── localStorage.ts     # Browser localStorage adapter
│   ├── composables/
│   │   ├── useStorage.ts        # Adapter selector based on storage mode
│   │   ├── useApplications.ts   # Application operations
│   │   ├── useStages.ts         # Stage operations
│   │   ├── useInfoItems.ts      # Info item operations
│   │   └── useBackup.ts         # Backup reminder logic
│   ├── components/
│   │   ├── KanbanBoard.vue      # Main board with drag-and-drop
│   │   ├── ApplicationCard.vue  # Card in a kanban column
│   │   ├── ApplicationDetail.vue
│   │   ├── ApplicationForm.vue
│   │   ├── StagesSettings.vue   # Stage management UI
│   │   ├── ImportExport.vue     # Backup & restore
│   │   ├── BackupReminder.vue
│   │   ├── FirstVisitNotice.vue
│   │   └── ...
│   ├── types/
│   │   ├── index.ts             # Application, Stage, InfoItem types
│   │   └── storage.ts           # StorageAdapter interface
│   ├── pages/
│   │   └── index.vue
│   ├── nuxt.config.ts
│   ├── package.json
│   └── Dockerfile
├── .github/workflows/
│   └── deploy.yml               # GitHub Pages deployment
├── docker-compose.yml
├── .env.example
└── .gitignore
```

## Testing

```bash
cd frontend
npm run test          # run once
npm run test:watch    # watch mode
```

## License

MIT
