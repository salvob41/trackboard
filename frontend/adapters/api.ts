// frontend/adapters/api.ts
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
} from '~/types'

const getBase = () => useRuntimeConfig().public.apiBase

export const apiAdapter: StorageAdapter = {
  // Items
  async getItems(): Promise<Item[]> {
    return $fetch<Item[]>(`${getBase()}/items`)
  },

  async getItem(id: number | string): Promise<ItemWithInfoItems> {
    return $fetch<ItemWithInfoItems>(`${getBase()}/items/${id}`)
  },

  async createItem(data: ItemCreate): Promise<Item> {
    return $fetch<Item>(`${getBase()}/items`, {
      method: 'POST',
      body: data,
    })
  },

  async updateItem(id: number | string, data: ItemUpdate): Promise<Item> {
    return $fetch<Item>(`${getBase()}/items/${id}`, {
      method: 'PUT',
      body: data,
    })
  },

  async deleteItem(id: number | string): Promise<void> {
    await $fetch(`${getBase()}/items/${id}`, { method: 'DELETE' })
  },

  // Stages
  async getStages(): Promise<Stage[]> {
    return $fetch<Stage[]>(`${getBase()}/stages`)
  },

  async addStage(stage: Omit<Stage, 'id'>): Promise<Stage> {
    return $fetch<Stage>(`${getBase()}/stages`, {
      method: 'POST',
      body: stage,
    })
  },

  async updateStage(id: number | string, stage: Partial<Stage>): Promise<Stage> {
    return $fetch<Stage>(`${getBase()}/stages/${id}`, {
      method: 'PATCH',
      body: stage,
    })
  },

  async deleteStage(id: number | string): Promise<void> {
    await $fetch(`${getBase()}/stages/${id}`, { method: 'DELETE' })
  },

  // Info Items
  async getInfoItems(itemId: number | string): Promise<InfoItem[]> {
    return $fetch<InfoItem[]>(`${getBase()}/items/${itemId}/info-items/`)
  },

  async createInfoItem(itemId: number | string, infoItem: InfoItemCreate): Promise<InfoItem> {
    return $fetch<InfoItem>(`${getBase()}/items/${itemId}/info-items/`, {
      method: 'POST',
      body: infoItem,
    })
  },

  async updateInfoItem(itemId: number | string, infoItemId: number | string, infoItem: InfoItemUpdate): Promise<InfoItem> {
    return $fetch<InfoItem>(`${getBase()}/items/${itemId}/info-items/${infoItemId}`, {
      method: 'PUT',
      body: infoItem,
    })
  },

  async deleteInfoItem(itemId: number | string, infoItemId: number | string): Promise<void> {
    await $fetch(`${getBase()}/items/${itemId}/info-items/${infoItemId}`, { method: 'DELETE' })
  },
}
