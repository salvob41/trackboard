// frontend/adapters/localStorage.ts
import type {
  Item,
  ItemWithInfoItems,
  ItemCreate,
  ItemUpdate,
  InfoItem,
  InfoItemCreate,
  InfoItemUpdate,
  Stage,
  Settings,
  Workspace,
  WorkspaceRegistry,
  TemplateId,
} from '~/types'
import { WORKSPACE_TEMPLATES } from '~/config/templates'

const REGISTRY_KEY = 'app-tracker:workspaces'

function keysFor(workspaceId: string) {
  return {
    items: `app-tracker:${workspaceId}:items`,
    stages: `app-tracker:${workspaceId}:stages`,
    infoItems: `app-tracker:${workspaceId}:info-items`,
    settings: `app-tracker:${workspaceId}:settings`,
    backup: `app-tracker:${workspaceId}:last-backup`,
    changes: `app-tracker:${workspaceId}:changes-since-backup`,
    firstVisit: `app-tracker:${workspaceId}:first-visit-acknowledged`,
  }
}

function K() {
  return keysFor(getActiveWorkspaceId())
}

// --- Low-level helpers ---

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function readItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

function writeItem<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function uuid(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

// --- Registry ---

function getRegistry(): WorkspaceRegistry | null {
  return readItem<WorkspaceRegistry>(REGISTRY_KEY)
}

function saveRegistry(registry: WorkspaceRegistry): void {
  writeItem(REGISTRY_KEY, registry)
}

export function getActiveWorkspaceId(): string {
  const registry = getRegistry()
  if (!registry) throw new Error('No workspace registry found')
  return registry.activeWorkspaceId
}

function applyDefaultWorkspace(): void {
  const registry = getRegistry()
  if (!registry) return
  const defaultId = localStorage.getItem('app-tracker:default-workspace')
  if (defaultId && registry.workspaces.find(w => w.id === defaultId)) {
    registry.activeWorkspaceId = defaultId
    saveRegistry(registry)
  }
}

// --- Migrations ---

function migrateFromV0(): void {
  const oldApps = read<any>('app-tracker:applications')
  if (oldApps.length === 0) return

  const migratedItems: Item[] = oldApps.map((app: any) => ({
    id: app.id,
    name: app.company,
    stage: app.stage,
    notes: app.notes,
    created_at: app.created_at,
    updated_at: app.updated_at,
    last_event_preview: app.last_event_preview,
    last_comment_preview: app.last_comment_preview,
  }))
  write('app-tracker:items', migratedItems)

  const oldInfoItems = read<any>('app-tracker:info-items')
  const migratedInfoItems: InfoItem[] = oldInfoItems.map((item: any) => ({
    ...item,
    item_id: item.application_id,
    application_id: undefined,
  })).filter((item: any) => item.item_id !== undefined)
  write('app-tracker:info-items', migratedInfoItems)

  localStorage.removeItem('app-tracker:applications')
}

function migrateToWorkspaces(): void {
  if (getRegistry()) return

  // Run v0 migration first (applications → items)
  const migVer = parseInt(localStorage.getItem('app-tracker:migration-version') || '0', 10)
  if (migVer < 1) {
    migrateFromV0()
    localStorage.setItem('app-tracker:migration-version', '1')
  }

  // Check if there's existing data to migrate
  const items = read<Item>('app-tracker:items')
  const stages = read<Stage>('app-tracker:stages')
  const infoItems = read<InfoItem>('app-tracker:info-items')
  const settings = readItem<Settings>('app-tracker:settings')

  // If no existing data, skip — let the UI show the template picker
  if (items.length === 0 && stages.length === 0) return

  const id = uuid()
  const keys = keysFor(id)

  // Move existing flat data into the new workspace namespace
  write(keys.items, items)
  write(keys.infoItems, infoItems)

  if (stages.length > 0) {
    write(keys.stages, stages)
  } else {
    const template = WORKSPACE_TEMPLATES.find(t => t.id === 'job-application')!
    write(keys.stages, template.stages.map(s => ({ ...s, id: uuid() })))
  }

  writeItem(keys.settings, settings || WORKSPACE_TEMPLATES.find(t => t.id === 'job-application')!.settings)

  // Copy backup state
  const backup = localStorage.getItem('app-tracker:last-backup')
  if (backup) localStorage.setItem(keys.backup, backup)
  const changes = localStorage.getItem('app-tracker:changes-since-backup')
  if (changes) localStorage.setItem(keys.changes, changes)
  const firstVisit = localStorage.getItem('app-tracker:first-visit-acknowledged')
  if (firstVisit) localStorage.setItem(keys.firstVisit, firstVisit)

  // Create registry
  const registry: WorkspaceRegistry = {
    activeWorkspaceId: id,
    workspaces: [{
      id,
      name: 'My Applications',
      templateId: 'job-application',
      createdAt: now(),
    }],
  }
  saveRegistry(registry)

  // Clean up old flat keys
  localStorage.removeItem('app-tracker:items')
  localStorage.removeItem('app-tracker:stages')
  localStorage.removeItem('app-tracker:info-items')
  localStorage.removeItem('app-tracker:settings')
  localStorage.removeItem('app-tracker:migration-version')
  localStorage.removeItem('app-tracker:last-backup')
  localStorage.removeItem('app-tracker:changes-since-backup')
  localStorage.removeItem('app-tracker:first-visit-acknowledged')
}

// Run migration and apply defaults at module load (skip during SSR)
if (typeof window !== 'undefined') {
  migrateToWorkspaces()
  applyDefaultWorkspace()
}

// --- Seed stages for active workspace if empty ---

function seedStagesIfEmpty(): Stage[] {
  const k = K()
  const stages = read<Stage>(k.stages)
  if (stages.length > 0) return stages
  const registry = getRegistry()!
  const ws = registry.workspaces.find(w => w.id === registry.activeWorkspaceId)
  const template = WORKSPACE_TEMPLATES.find(t => t.id === ws?.templateId) || WORKSPACE_TEMPLATES[0]
  const seeded = template.stages.map(s => ({ ...s, id: uuid() }))
  write(k.stages, seeded)
  return seeded
}

// --- Storage API ---

export const storage = {
  // Items
  async getItems(): Promise<Item[]> {
    const k = K()
    const items = read<Item>(k.items)
    const allInfoItems = read<InfoItem>(k.infoItems)
    return items.map(item => {
      const infoItems = allInfoItems
        .filter(i => String(i.item_id) === String(item.id))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const lastActivity = infoItems[0]
      return {
        ...item,
        last_event_preview: lastActivity
          ? lastActivity.event_type === 'transition'
            ? `${lastActivity.from_stage} → ${lastActivity.to_stage}`
            : lastActivity.content || null
          : null,
        last_comment_preview: lastActivity?.content || null,
      }
    })
  },

  async getItem(id: number | string): Promise<ItemWithInfoItems> {
    const k = K()
    const items = read<Item>(k.items)
    const item = items.find(a => String(a.id) === String(id))
    if (!item) throw new Error(`Item ${id} not found`)
    const infoItems = read<InfoItem>(k.infoItems).filter(
      i => String(i.item_id) === String(id)
    )
    return { ...item, info_items: infoItems }
  },

  async createItem(data: ItemCreate): Promise<Item> {
    const k = K()
    const items = read<Item>(k.items)
    const newItem: Item = {
      ...data,
      id: uuid(),
      created_at: now(),
    }
    write(k.items, [...items, newItem])
    return newItem
  },

  async updateItem(id: number | string, data: ItemUpdate): Promise<Item> {
    const k = K()
    const items = read<Item>(k.items)
    const index = items.findIndex(a => String(a.id) === String(id))
    if (index === -1) throw new Error(`Item ${id} not found`)
    const updated = { ...items[index], ...data, updated_at: now() }
    items[index] = updated
    write(k.items, items)
    return updated
  },

  async deleteItem(id: number | string): Promise<void> {
    const k = K()
    const items = read<Item>(k.items)
    write(k.items, items.filter(a => String(a.id) !== String(id)))
    const infoItems = read<InfoItem>(k.infoItems)
    write(k.infoItems, infoItems.filter(i => String(i.item_id) !== String(id)))
  },

  // Stages
  async getStages(): Promise<Stage[]> {
    return seedStagesIfEmpty()
  },

  async addStage(stage: Omit<Stage, 'id'>): Promise<Stage> {
    const k = K()
    const stages = read<Stage>(k.stages)
    const newStage: Stage = { ...stage, id: uuid() }
    write(k.stages, [...stages, newStage])
    return newStage
  },

  async updateStage(id: number | string, stage: Partial<Stage>): Promise<Stage> {
    const k = K()
    const stages = read<Stage>(k.stages)
    const index = stages.findIndex(s => String(s.id) === String(id))
    if (index === -1) throw new Error(`Stage ${id} not found`)
    const updated = { ...stages[index], ...stage }
    stages[index] = updated
    write(k.stages, stages)
    return updated
  },

  async deleteStage(id: number | string): Promise<void> {
    const k = K()
    const stages = read<Stage>(k.stages)
    write(k.stages, stages.filter(s => String(s.id) !== String(id)))
  },

  // Info Items
  async getInfoItems(itemId: number | string): Promise<InfoItem[]> {
    const k = K()
    return read<InfoItem>(k.infoItems).filter(
      i => String(i.item_id) === String(itemId)
    )
  },

  async createInfoItem(itemId: number | string, infoItem: InfoItemCreate): Promise<InfoItem> {
    const k = K()
    const items = read<InfoItem>(k.infoItems)
    const newItem: InfoItem = {
      ...infoItem,
      id: uuid(),
      item_id: itemId,
      created_at: now(),
    }
    write(k.infoItems, [...items, newItem])
    return newItem
  },

  async updateInfoItem(itemId: number | string, infoItemId: number | string, infoItem: InfoItemUpdate): Promise<InfoItem> {
    const k = K()
    const items = read<InfoItem>(k.infoItems)
    const index = items.findIndex(
      i => String(i.id) === String(infoItemId) && String(i.item_id) === String(itemId)
    )
    if (index === -1) throw new Error(`InfoItem ${infoItemId} not found`)
    const updated = { ...items[index], ...infoItem }
    items[index] = updated
    write(k.infoItems, items)
    return updated
  },

  async deleteInfoItem(itemId: number | string, infoItemId: number | string): Promise<void> {
    const k = K()
    const items = read<InfoItem>(k.infoItems)
    write(
      k.infoItems,
      items.filter(
        i => !(String(i.id) === String(infoItemId) && String(i.item_id) === String(itemId))
      )
    )
  },

  // Settings
  getSettings(): Settings {
    const k = K()
    const registry = getRegistry()!
    const ws = registry.workspaces.find(w => w.id === registry.activeWorkspaceId)
    const template = WORKSPACE_TEMPLATES.find(t => t.id === ws?.templateId) || WORKSPACE_TEMPLATES[0]
    const stored = readItem<Settings>(k.settings)
    // Merge template defaults with stored values so existing workspaces get new fields
    // (e.g. secondaryFieldLabel added after workspace was created)
    return { ...template.settings, ...stored }
  },

  saveSettings(settings: Settings): void {
    writeItem(K().settings, settings)
  },

  // Workspace CRUD
  getWorkspaces(): Workspace[] {
    return getRegistry()?.workspaces || []
  },

  getActiveWorkspace(): Workspace | null {
    const registry = getRegistry()
    if (!registry) return null
    return registry.workspaces.find(w => w.id === registry.activeWorkspaceId) || null
  },

  createWorkspace(name: string, templateId: TemplateId): Workspace {
    const registry = getRegistry()!
    const id = uuid()
    const template = WORKSPACE_TEMPLATES.find(t => t.id === templateId) || WORKSPACE_TEMPLATES[0]
    const keys = keysFor(id)

    // Seed stages from template
    write(keys.stages, template.stages.map(s => ({ ...s, id: uuid() })))
    write(keys.items, [])
    write(keys.infoItems, [])
    writeItem(keys.settings, template.settings)

    const workspace: Workspace = { id, name, templateId, createdAt: now() }
    registry.workspaces.push(workspace)
    saveRegistry(registry)
    return workspace
  },

  switchWorkspace(id: string): void {
    const registry = getRegistry()!
    if (!registry.workspaces.find(w => w.id === id)) throw new Error(`Workspace ${id} not found`)
    registry.activeWorkspaceId = id
    saveRegistry(registry)
  },

  renameWorkspace(id: string, name: string): void {
    const registry = getRegistry()!
    const ws = registry.workspaces.find(w => w.id === id)
    if (!ws) throw new Error(`Workspace ${id} not found`)
    ws.name = name
    saveRegistry(registry)
  },

  deleteWorkspace(id: string): void {
    const registry = getRegistry()!
    if (registry.workspaces.length <= 1) throw new Error('Cannot delete last workspace')

    // Remove all data for this workspace
    const keys = keysFor(id)
    Object.values(keys).forEach(k => localStorage.removeItem(k))

    registry.workspaces = registry.workspaces.filter(w => w.id !== id)
    if (registry.activeWorkspaceId === id) {
      registry.activeWorkspaceId = registry.workspaces[0].id
    }
    saveRegistry(registry)
  },

  exportWorkspace(id: string) {
    const keys = keysFor(id)
    const registry = getRegistry()!
    const ws = registry.workspaces.find(w => w.id === id)
    return {
      version: 2,
      exportedAt: now(),
      workspace: ws ? { name: ws.name, templateId: ws.templateId } : null,
      items: read(keys.items),
      stages: read(keys.stages),
      infoItems: read(keys.infoItems),
      settings: readItem(keys.settings),
    }
  },

  importWorkspace(data: any): Workspace {
    const name = data.workspace?.name || 'Imported'
    const templateId = data.workspace?.templateId || 'custom'
    const id = uuid()
    const keys = keysFor(id)

    write(keys.items, data.items || [])
    write(keys.stages, data.stages || [])
    write(keys.infoItems, data.infoItems || [])
    if (data.settings) writeItem(keys.settings, data.settings)

    const registry = getRegistry()!
    const workspace: Workspace = { id, name, templateId, createdAt: now() }
    registry.workspaces.push(workspace)
    saveRegistry(registry)
    return workspace
  },
}
