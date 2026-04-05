# Application Tracker

A fast, privacy-first kanban board for tracking anything — job applications, sales leads, apartment hunting, projects, or whatever you need. Runs entirely in the browser with zero setup. No accounts, no servers, no data collection.

## Features

- **Kanban Board** — Drag-and-drop items across customizable stages with stage transition tracking
- **Multi-Workspace** — Create independent boards from templates, each with its own items, stages, and settings
- **5 Built-in Templates** — Job Application, Lead/Sales, Property, Project, or start from scratch with Custom
- **Template-Based Onboarding** — First-time users pick a template to get started instantly
- **Configurable Card Fields** — Each workspace has a primary field (e.g. "Company") and an optional secondary field (e.g. "Role", "Price") shown as a subtitle on cards
- **Activity Timeline** — Track stage transitions, add comments, and attach tagged info to each item
- **Backup & Restore** — Export/import workspaces as JSON files, with backup reminders after 7 days or 10 changes
- **Dark Mode** — Full dark mode support via Nuxt UI
- **100% Client-Side** — All data stays in your browser's localStorage. Nothing is sent anywhere.

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. Pick a template, name your board, and start tracking.

> **Your data lives in your browser only.** Use the built-in export feature to back up your data or transfer it to another device.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 3, Vue 3 |
| UI | Nuxt UI, Tailwind CSS |
| Drag & Drop | vue-draggable-plus |
| Storage | Browser localStorage |
| Testing | Vitest |
| Deployment | GitHub Pages (static) |

## Workspaces & Templates

Each workspace is an isolated board with its own items, stages, settings, and backup state. Create as many as you need.

| Template | Stages | Primary Field | Secondary Field |
|----------|--------|--------------|----------------|
| Job Application | Wishlist, Applied, Interview, Rejected | Company | Role |
| Lead / Sales | New, Contacted, Qualified, Won, Lost | Company | Contact |
| Property | Saved, Viewing, Offer, Accepted, Rejected | Name | Price |
| Project | Backlog, In Progress, Review, Done | Title | Owner |
| Custom | (you define them) | Name | Details |

Settings are per-workspace — change labels, toggle the secondary field on cards, customize stages.

## Project Structure

```
frontend/
├── adapters/
│   └── localStorage.ts      # Workspace-aware storage API + migrations
├── composables/
│   ├── useItems.ts           # Item CRUD
│   ├── useStages.ts          # Stage operations
│   ├── useInfoItems.ts       # Activity/comment operations
│   ├── useSettings.ts        # Per-workspace settings + presets
│   ├── useWorkspaces.ts      # Workspace CRUD, switch, export/import
│   └── useBackup.ts          # Backup reminder logic
├── components/
│   ├── KanbanBoard.vue       # Main board with drag-and-drop columns
│   ├── ItemCard.vue          # Card with primary/secondary fields
│   ├── ItemDetail.vue        # Full item view with activity timeline
│   ├── ItemForm.vue          # Create/edit item modal
│   ├── SettingsModal.vue     # Workspace settings + workspace management
│   ├── StagesSettings.vue    # Stage management (add, edit, reorder, delete)
│   ├── WorkspaceCreateModal.vue  # Template picker for new workspaces
│   ├── WorkspaceSelector.vue # Header tabs for workspace switching
│   ├── ImportExport.vue      # Backup & restore (v1/v2 compatible)
│   └── ...
├── config/
│   └── templates.ts          # Built-in workspace templates
├── types/
│   └── index.ts              # Item, Stage, InfoItem, Settings, Workspace types
├── utils/
│   ├── linkify.ts            # XSS-safe URL linkification
│   └── pluralize.ts          # Simple pluralization helper
├── tests/
│   ├── adapters/localStorage.test.ts  # Storage, workspace, import/export tests
│   └── utils/linkify.test.ts          # Linkify tests (XSS, query params)
├── pages/
│   └── index.vue
└── nuxt.config.ts
```

## Data Model

```
Workspace
 ├── Items (name, secondaryField, stage, notes)
 │    └── InfoItems (comments, transitions, tagged info)
 ├── Stages (key, label, color, order)
 └── Settings (itemLabel, primaryFieldLabel, secondaryFieldLabel, showSecondaryOnCard)
```

All data is stored per-workspace in localStorage under namespaced keys (`app-tracker:{workspaceId}:items`, etc.).

## Import / Export

- **Export** — Downloads a JSON file with all items, stages, info items, and settings for a workspace
- **Import** — Creates a new workspace from a JSON file (supports both v1 and v2 formats)
- **Backward Compatible** — v1 exports (with `applications` key) are automatically migrated to v2 format on import

## Static Site Deployment (GitHub Pages)

The GitHub Actions workflow builds and deploys on every push to `main`:

```bash
# Generate locally
cd frontend
NUXT_PUBLIC_BASE_URL=/app-tracker/ npx nuxt generate
```

## Testing

```bash
cd frontend
npm run test          # run once
npm run test:watch    # watch mode
```

20 tests covering localStorage storage API, workspace isolation, import/export roundtrip, and linkify XSS safety.

## License

MIT
