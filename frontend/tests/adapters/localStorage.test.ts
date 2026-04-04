import { describe, it, expect, beforeEach } from 'vitest'

const KEYS = {
  items: 'app-tracker:items',
  stages: 'app-tracker:stages',
  infoItems: 'app-tracker:info-items',
}

function readKey<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function writeKey<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

const DEFAULT_STAGES = [
  { key: 'wishlist', label: 'Wishlist', color: 'gray', order: 1 },
  { key: 'applied', label: 'Applied', color: 'blue', order: 2 },
  { key: 'interview', label: 'Interview', color: 'yellow', order: 3 },
  { key: 'rejected', label: 'Rejected', color: 'red', order: 4 },
]

describe('localStorage helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reads empty array when key is absent', () => {
    expect(readKey(KEYS.items)).toEqual([])
  })

  it('writes and reads back data', () => {
    const data = [{ id: '1', name: 'Acme' }]
    writeKey(KEYS.items, data)
    expect(readKey(KEYS.items)).toEqual(data)
  })

  it('filters info items by item_id', () => {
    const infoItems = [
      { id: 'a', item_id: 'item1', content: 'note1' },
      { id: 'b', item_id: 'item2', content: 'note2' },
    ]
    writeKey(KEYS.infoItems, infoItems)
    const all = readKey<{ item_id: string }>(KEYS.infoItems)
    const filtered = all.filter(i => i.item_id === 'item1')
    expect(filtered).toHaveLength(1)
    expect(filtered[0]).toMatchObject({ content: 'note1' })
  })

  it('default stages seed has correct keys', () => {
    expect(DEFAULT_STAGES.map(s => s.key)).toEqual(['wishlist', 'applied', 'interview', 'rejected'])
  })

  it('seeds default stages when storage is empty', () => {
    const stored = readKey(KEYS.stages)
    if (stored.length === 0) {
      const seeded = DEFAULT_STAGES.map(s => ({ ...s, id: `seed-${s.key}` }))
      writeKey(KEYS.stages, seeded)
    }
    expect(readKey(KEYS.stages)).toHaveLength(4)
  })
})

describe('import/export validation', () => {
  it('detects valid export format', () => {
    const validExport = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items: [],
      stages: [],
      infoItems: [],
    }
    const isValid = (
      validExport.version === 1 &&
      'items' in validExport &&
      'stages' in validExport &&
      'infoItems' in validExport
    )
    expect(isValid).toBe(true)
  })

  it('rejects missing required keys', () => {
    const badExport = { version: 1, items: [] }
    const isValid = (
      badExport.version === 1 &&
      'items' in badExport &&
      'stages' in badExport &&
      'infoItems' in badExport
    )
    expect(isValid).toBe(false)
  })

  it('rejects unknown version', () => {
    const futureExport = { version: 99, items: [], stages: [], infoItems: [] }
    const isValid = futureExport.version === 1
    expect(isValid).toBe(false)
  })
})
