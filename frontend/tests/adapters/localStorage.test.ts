import { describe, it, expect, beforeEach } from 'vitest'
import { storage, StorageQuotaExceededError } from '../../adapters/localStorage'

function initTestWorkspace() {
  const id = crypto.randomUUID()
  const registry = {
    activeWorkspaceId: id,
    workspaces: [{ id, name: 'Test Default', templateId: 'job-application', createdAt: new Date().toISOString() }],
  }
  localStorage.setItem('app-tracker:workspaces', JSON.stringify(registry))
  localStorage.setItem(`app-tracker:${id}:items`, '[]')
  localStorage.setItem(`app-tracker:${id}:info-items`, '[]')
  localStorage.setItem(`app-tracker:${id}:stages`, JSON.stringify([
    { id: crypto.randomUUID(), key: 'wishlist', label: 'Wishlist', color: 'gray', order: 1 },
    { id: crypto.randomUUID(), key: 'applied', label: 'Applied', color: 'blue', order: 2 },
    { id: crypto.randomUUID(), key: 'interview', label: 'Interview', color: 'yellow', order: 3 },
    { id: crypto.randomUUID(), key: 'rejected', label: 'Rejected', color: 'red', order: 4 },
  ]))
}

describe('storage API (workspace-aware)', () => {
  beforeEach(() => {
    localStorage.clear()
    initTestWorkspace()
  })

  it('lists workspaces after initialization', () => {
    const workspaces = storage.getWorkspaces()
    expect(workspaces.length).toBeGreaterThanOrEqual(1)
  })

  it('creates a new workspace from template', () => {
    const ws = storage.createWorkspace('Test Workspace', 'property')
    expect(ws.name).toBe('Test Workspace')
    expect(ws.templateId).toBe('property')
    expect(ws.id).toBeTruthy()
  })

  it('switches active workspace', () => {
    const ws = storage.createWorkspace('Second', 'project')
    storage.switchWorkspace(ws.id)
    const active = storage.getActiveWorkspace()
    expect(active?.id).toBe(ws.id)
  })

  it('creates and retrieves items in active workspace', async () => {
    const item = await storage.createItem({ name: 'Acme', stage: 'wishlist', notes: '' })
    expect(item.id).toBeTruthy()
    expect(item.name).toBe('Acme')

    const items = await storage.getItems()
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Acme')
  })

  it('items are isolated per workspace', async () => {
    await storage.createItem({ name: 'WS1 Item', stage: 'wishlist', notes: '' })

    const ws2 = storage.createWorkspace('WS2', 'custom')
    storage.switchWorkspace(ws2.id)

    const items = await storage.getItems()
    expect(items).toHaveLength(0)
  })

  it('gets settings with template defaults', () => {
    const ws = storage.createWorkspace('Props', 'property')
    storage.switchWorkspace(ws.id)
    const settings = storage.getSettings()
    expect(settings.itemLabel).toBe('Property')
    expect(settings.primaryFieldLabel).toBe('Name')
    expect(settings.secondaryFieldLabel).toBe('Price')
    expect(settings.showSecondaryOnCard).toBe(true)
  })

  it('saves and retrieves settings, merging with template defaults', () => {
    const ws = storage.createWorkspace('Test', 'job-application')
    storage.switchWorkspace(ws.id)
    storage.saveSettings({ itemLabel: 'Job', primaryFieldLabel: 'Company', secondaryFieldLabel: 'Role', showSecondaryOnCard: false })
    const settings = storage.getSettings()
    expect(settings.itemLabel).toBe('Job')
    expect(settings.showSecondaryOnCard).toBe(false)
  })

  it('seeds stages from template for new workspace', async () => {
    const ws = storage.createWorkspace('Seeded', 'job-application')
    storage.switchWorkspace(ws.id)
    const stages = await storage.getStages()
    expect(stages.length).toBeGreaterThanOrEqual(4)
    expect(stages.map(s => s.key)).toContain('wishlist')
  })
})

describe('export / import', () => {
  beforeEach(() => {
    localStorage.clear()
    initTestWorkspace()
  })

  it('exports workspace data in v2 format', async () => {
    const ws = storage.createWorkspace('Export Test', 'job-application')
    storage.switchWorkspace(ws.id)
    await storage.createItem({ name: 'TestCo', stage: 'wishlist', notes: 'test' })

    const exported = storage.exportWorkspace(ws.id)
    expect(exported.version).toBe(2)
    expect(exported.workspace?.name).toBe('Export Test')
    expect(exported.workspace?.templateId).toBe('job-application')
    expect(Array.isArray(exported.items)).toBe(true)
    expect(exported.items).toHaveLength(1)
    expect(Array.isArray(exported.stages)).toBe(true)
    expect(Array.isArray(exported.infoItems)).toBe(true)
    expect(exported.settings).toBeTruthy()
  })

  it('imports v2 export and creates new workspace', async () => {
    const ws = storage.createWorkspace('Original', 'lead-sales')
    storage.switchWorkspace(ws.id)
    await storage.createItem({ name: 'Lead1', stage: 'new', notes: '' })
    const exported = storage.exportWorkspace(ws.id)

    const imported = storage.importWorkspace(exported)
    expect(imported.name).toBe('Original')
    expect(imported.templateId).toBe('lead-sales')

    storage.switchWorkspace(imported.id)
    const items = await storage.getItems()
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Lead1')
  })

  it('imports workspace with secondaryField data intact', async () => {
    const ws = storage.createWorkspace('SF Test', 'job-application')
    storage.switchWorkspace(ws.id)
    await storage.createItem({ name: 'Google', secondaryField: 'SWE', stage: 'wishlist', notes: '' })
    const exported = storage.exportWorkspace(ws.id)

    const imported = storage.importWorkspace(exported)
    storage.switchWorkspace(imported.id)
    const items = await storage.getItems()
    expect(items[0].secondaryField).toBe('SWE')
  })

  it('import preserves settings including secondary field config', () => {
    const ws = storage.createWorkspace('Settings Test', 'property')
    storage.switchWorkspace(ws.id)
    const exported = storage.exportWorkspace(ws.id)

    const imported = storage.importWorkspace(exported)
    storage.switchWorkspace(imported.id)
    const settings = storage.getSettings()
    expect(settings.secondaryFieldLabel).toBe('Price')
    expect(settings.showSecondaryOnCard).toBe(true)
  })

  it('handles import of data with missing infoItems gracefully', () => {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      workspace: { name: 'Partial', templateId: 'custom' },
      items: [{ id: 'x', name: 'Test', stage: 'backlog', created_at: new Date().toISOString() }],
      stages: [{ id: 's1', key: 'backlog', label: 'Backlog', color: 'gray', order: 1 }],
    }
    const imported = storage.importWorkspace(data)
    expect(imported.name).toBe('Partial')
  })

  it('deleting a workspace removes its data', async () => {
    const ws = storage.createWorkspace('ToDelete', 'custom')
    storage.switchWorkspace(ws.id)
    await storage.createItem({ name: 'Gone', stage: 'backlog', notes: '' })

    const allWs = storage.getWorkspaces()
    const other = allWs.find(w => w.id !== ws.id)!
    storage.switchWorkspace(other.id)

    storage.deleteWorkspace(ws.id)
    expect(storage.getWorkspaces().find(w => w.id === ws.id)).toBeUndefined()
  })
})

describe('StorageQuotaExceededError', () => {
  it('has correct name and message', () => {
    const error = new StorageQuotaExceededError()
    expect(error.name).toBe('StorageQuotaExceededError')
    expect(error.message).toContain('Storage quota exceeded')
  })

  it('can be caught and identified by name', () => {
    const error = new StorageQuotaExceededError()
    
    try {
      throw error
    } catch (e: any) {
      expect(e.name).toBe('StorageQuotaExceededError')
      expect(e instanceof Error).toBe(true)
    }
  })
})
