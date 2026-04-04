// frontend/adapters/localStorage.ts
import type { StorageAdapter } from '~/types/storage'
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
} from '~/types'

const KEYS = {
  items: 'app-tracker:items',
  stages: 'app-tracker:stages',
  infoItems: 'app-tracker:info-items',
  settings: 'app-tracker:settings',
  migrationVersion: 'app-tracker:migration-version',
} as const

const CURRENT_MIGRATION_VERSION = 1

const DEFAULT_STAGES: Omit<Stage, 'id'>[] = [
  { key: 'wishlist', label: 'Wishlist', color: 'gray', order: 1 },
  { key: 'applied', label: 'Applied', color: 'blue', order: 2 },
  { key: 'interview', label: 'Interview', color: 'yellow', order: 3 },
  { key: 'rejected', label: 'Rejected', color: 'red', order: 4 },
]

const DEFAULT_SETTINGS: Settings = {
  itemLabel: 'Application',
  primaryFieldLabel: 'Company',
}

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
  write(KEYS.items, migratedItems)

  const oldInfoItems = read<any>('app-tracker:info-items')
  const migratedInfoItems: InfoItem[] = oldInfoItems.map((item: any) => ({
    ...item,
    item_id: item.application_id,
    application_id: undefined,
  })).filter((item: any) => item.item_id !== undefined)
  write(KEYS.infoItems, migratedInfoItems)

  writeItem(KEYS.settings, DEFAULT_SETTINGS)

  localStorage.removeItem('app-tracker:applications')
  localStorage.removeItem('app-tracker:info-items')
}

function runMigrations(): void {
  const version = parseInt(localStorage.getItem(KEYS.migrationVersion) || '0', 10)
  if (version < 1) {
    migrateFromV0()
    localStorage.setItem(KEYS.migrationVersion, '1')
  }
}

function seedStagesIfEmpty(): Stage[] {
  const stages = read<Stage>(KEYS.stages)
  if (stages.length > 0) return stages
  const seeded = DEFAULT_STAGES.map(s => ({ ...s, id: uuid() }))
  write(KEYS.stages, seeded)
  return seeded
}

runMigrations()

export const localStorageAdapter: StorageAdapter = {
  // Items
  async getItems(): Promise<Item[]> {
    const items = read<Item>(KEYS.items)
    const allInfoItems = read<InfoItem>(KEYS.infoItems)
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
    const items = read<Item>(KEYS.items)
    const item = items.find(a => String(a.id) === String(id))
    if (!item) throw new Error(`Item ${id} not found`)
    const infoItems = read<InfoItem>(KEYS.infoItems).filter(
      i => String(i.item_id) === String(id)
    )
    return { ...item, info_items: infoItems }
  },

  async createItem(data: ItemCreate): Promise<Item> {
    const items = read<Item>(KEYS.items)
    const newItem: Item = {
      ...data,
      id: uuid(),
      created_at: now(),
    }
    write(KEYS.items, [...items, newItem])
    return newItem
  },

  async updateItem(id: number | string, data: ItemUpdate): Promise<Item> {
    const items = read<Item>(KEYS.items)
    const index = items.findIndex(a => String(a.id) === String(id))
    if (index === -1) throw new Error(`Item ${id} not found`)
    const updated = { ...items[index], ...data, updated_at: now() }
    items[index] = updated
    write(KEYS.items, items)
    return updated
  },

  async deleteItem(id: number | string): Promise<void> {
    const items = read<Item>(KEYS.items)
    write(KEYS.items, items.filter(a => String(a.id) !== String(id)))
    const infoItems = read<InfoItem>(KEYS.infoItems)
    write(KEYS.infoItems, infoItems.filter(i => String(i.item_id) !== String(id)))
  },

  // Stages
  async getStages(): Promise<Stage[]> {
    return seedStagesIfEmpty()
  },

  async addStage(stage: Omit<Stage, 'id'>): Promise<Stage> {
    const stages = read<Stage>(KEYS.stages)
    const newStage: Stage = { ...stage, id: uuid() }
    write(KEYS.stages, [...stages, newStage])
    return newStage
  },

  async updateStage(id: number | string, stage: Partial<Stage>): Promise<Stage> {
    const stages = read<Stage>(KEYS.stages)
    const index = stages.findIndex(s => String(s.id) === String(id))
    if (index === -1) throw new Error(`Stage ${id} not found`)
    const updated = { ...stages[index], ...stage }
    stages[index] = updated
    write(KEYS.stages, stages)
    return updated
  },

  async deleteStage(id: number | string): Promise<void> {
    const stages = read<Stage>(KEYS.stages)
    write(KEYS.stages, stages.filter(s => String(s.id) !== String(id)))
  },

  // Info Items
  async getInfoItems(itemId: number | string): Promise<InfoItem[]> {
    return read<InfoItem>(KEYS.infoItems).filter(
      i => String(i.item_id) === String(itemId)
    )
  },

  async createInfoItem(itemId: number | string, infoItem: InfoItemCreate): Promise<InfoItem> {
    const items = read<InfoItem>(KEYS.infoItems)
    const newItem: InfoItem = {
      ...infoItem,
      id: uuid(),
      item_id: itemId,
      created_at: now(),
    }
    write(KEYS.infoItems, [...items, newItem])
    return newItem
  },

  async updateInfoItem(itemId: number | string, infoItemId: number | string, infoItem: InfoItemUpdate): Promise<InfoItem> {
    const items = read<InfoItem>(KEYS.infoItems)
    const index = items.findIndex(
      i => String(i.id) === String(infoItemId) && String(i.item_id) === String(itemId)
    )
    if (index === -1) throw new Error(`InfoItem ${infoItemId} not found`)
    const updated = { ...items[index], ...infoItem }
    items[index] = updated
    write(KEYS.infoItems, items)
    return updated
  },

  async deleteInfoItem(itemId: number | string, infoItemId: number | string): Promise<void> {
    const items = read<InfoItem>(KEYS.infoItems)
    write(
      KEYS.infoItems,
      items.filter(
        i => !(String(i.id) === String(infoItemId) && String(i.item_id) === String(itemId))
      )
    )
  },

  // Settings
  getSettings(): Settings {
    const settings = readItem<Settings>(KEYS.settings)
    return settings || DEFAULT_SETTINGS
  },

  saveSettings(settings: Settings): void {
    writeItem(KEYS.settings, settings)
  },
}
