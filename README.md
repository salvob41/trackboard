# Trackboard

A fast, local-first kanban board for tracking anything — job applications, sales leads, apartment hunting, projects, or whatever you need. Runs entirely in the browser with zero setup. No accounts, no servers, no data collection.

## Features

- **Kanban Board** — Drag-and-drop items across customizable stages with stage transition tracking
- **Multi-Board** — Create independent boards from templates, each with its own items, stages, and settings
- **5 Built-in Templates** — Job Application, Lead/Sales, Property, Project, or start from scratch with Custom
- **Template-Based Onboarding** — First-time users pick a template to get started instantly
- **Configurable Card Fields** — Each board has a primary field (e.g. "Company") and an optional secondary field (e.g. "Role", "Price") shown as a subtitle on cards
- **Image Support** — Upload, paste, drag-and-drop, or fetch images from URLs. Stored in IndexedDB with compression. Lightbox viewer with keyboard navigation.
- **Activity Timeline** — Track stage transitions, add comments, and attach tagged info to each item
- **Backup & Restore** — Export/import boards as JSON files, with backup reminders after 7 days or 10 changes
- **Dark Mode** — Full dark mode support via Nuxt UI
- **100% Client-Side** — All data stays in your browser. Item data in localStorage, images in IndexedDB. Nothing is sent anywhere.

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
| Storage | localStorage (data) + IndexedDB (images) |
| Image Processing | Canvas API, WebP compression |
| Testing | Vitest |
| Deployment | GitHub Pages (static) |

## Boards & Templates

Each board is isolated with its own items, stages, settings, and backup state. Create as many as you need.

| Template | Stages | Primary Field | Secondary Field |
|----------|--------|--------------|----------------|
| Job Application | Wishlist, Applied, Interview, Rejected | Company | Role |
| Lead / Sales | New, Contacted, Qualified, Won, Lost | Company | Contact |
| Property | Saved, Viewing, Offer, Accepted, Rejected | Name | Price |
| Project | Backlog, In Progress, Review, Done | Title | Owner |
| Custom | (you define them) | Name | Details |

Settings are per-board — change labels, toggle the secondary field on cards, enable/disable images, customize stages.

## Images

Images can be added to any item via:
- **File picker** — click "Add Image"
- **Drag and drop** — drop images onto the form
- **Paste** — Ctrl/Cmd+V from clipboard
- **URL fetch** — paste an image URL and click "Fetch"

Images are compressed to WebP (max 1000px, 80% quality) and stored in **IndexedDB** — no localStorage size limits. The card shows a thumbnail with a "+N" badge, and the detail view has a full gallery with lightbox navigation (click to zoom, arrow keys to browse).

## Project Structure

```
frontend/
├── adapters/
│   └── localStorage.ts          # Workspace-aware storage API + migrations
├── composables/
│   ├── useItems.ts               # Item CRUD
│   ├── useStages.ts              # Stage operations
│   ├── useInfoItems.ts           # Activity/comment operations
│   ├── useSettings.ts            # Per-board settings + presets
│   ├── useWorkspaces.ts          # Board CRUD, switch, export/import
│   ├── useBackup.ts              # Backup reminder logic
│   ├── useImageStore.ts          # IndexedDB image storage (idb-keyval)
│   └── useImageUpload.ts         # Image compression, paste/drop/URL handling
├── components/
│   ├── KanbanBoard.vue           # Main board with drag-and-drop columns
│   ├── ItemCard.vue              # Card with fields + image thumbnail
│   ├── ItemDetail.vue            # Full item view with gallery + timeline
│   ├── ItemForm.vue              # Create/edit with image upload
│   ├── SettingsModal.vue         # Board settings + board management
│   ├── StagesSettings.vue        # Stage management (add, edit, reorder, delete)
│   ├── WorkspaceCreateModal.vue  # Template picker for new boards
│   ├── WorkspaceSelector.vue     # Header tabs + new board button
│   ├── ImportExport.vue          # Backup & restore (v1/v2 compatible)
│   └── ...
├── config/
│   └── templates.ts              # Built-in board templates
├── types/
│   └── index.ts                  # Item, Stage, InfoItem, Settings, Workspace types
├── utils/
│   ├── linkify.ts                # XSS-safe URL linkification
│   └── pluralize.ts              # Simple pluralization helper
├── tests/
│   ├── adapters/localStorage.test.ts      # Storage, board, import/export tests
│   ├── composables/useImageStore.test.ts  # IndexedDB image store tests
│   ├── composables/useImageUpload.test.ts # Paste/drop extraction tests
│   └── utils/linkify.test.ts              # Linkify tests (XSS, query params)
├── pages/
│   └── index.vue
└── nuxt.config.ts
```

## Data Model

```
Board (Workspace)
 ├── Items (name, secondaryField, stage, notes)
 │    ├── InfoItems (comments, transitions, tagged info)
 │    └── Images (stored in IndexedDB, not localStorage)
 ├── Stages (key, label, color, order)
 └── Settings (labels, secondary field, images toggle)
```

Item data is stored per-board in localStorage (`app-tracker:{boardId}:items`). Images are stored separately in IndexedDB via `idb-keyval`.

## Import / Export

- **Export** — Downloads a JSON file with all items, stages, info items, and settings for a board
- **Import** — Creates a new board from a JSON file (supports both v1 and v2 formats)
- **Backward Compatible** — v1 exports (with `applications` key) are automatically migrated on import

Note: Images are stored in IndexedDB and are not included in exports.

## Static Site Deployment (GitHub Pages)

The GitHub Actions workflow builds and deploys on every push to `main`:

```bash
# Generate locally
cd frontend
NUXT_PUBLIC_BASE_URL=/trackboard/ npx nuxt generate
```

## Testing

```bash
cd frontend
npm run test          # run once
npm run test:watch    # watch mode
```

42 tests covering storage API, board isolation, import/export, image store, image upload, and linkify.

## License

MIT
