// frontend/types/storage.ts
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

export interface StorageAdapter {
  // Items
  getItems(): Promise<Item[]>
  getItem(id: number | string): Promise<ItemWithInfoItems>
  createItem(data: ItemCreate): Promise<Item>
  updateItem(id: number | string, data: ItemUpdate): Promise<Item>
  deleteItem(id: number | string): Promise<void>

  // Stages
  getStages(): Promise<Stage[]>
  addStage(stage: Omit<Stage, 'id'>): Promise<Stage>
  updateStage(id: number | string, stage: Partial<Stage>): Promise<Stage>
  deleteStage(id: number | string): Promise<void>

  // Info Items (always scoped to an item)
  getInfoItems(itemId: number | string): Promise<InfoItem[]>
  createInfoItem(itemId: number | string, infoItem: InfoItemCreate): Promise<InfoItem>
  updateInfoItem(itemId: number | string, infoItemId: number | string, infoItem: InfoItemUpdate): Promise<InfoItem>
  deleteInfoItem(itemId: number | string, infoItemId: number | string): Promise<void>
}
