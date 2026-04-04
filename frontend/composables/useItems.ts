import type { Item, ItemWithInfoItems, ItemCreate, ItemUpdate } from '~/types'
import { storage } from '~/adapters/localStorage'

export const useItems = () => {
    const getItems = async (): Promise<Item[]> => {
        return storage.getItems()
    }

    const getItem = async (id: number | string): Promise<ItemWithInfoItems> => {
        return storage.getItem(id)
    }

    const createItem = async (item: ItemCreate): Promise<Item> => {
        return storage.createItem(item)
    }

    const updateItem = async (id: number | string, item: ItemUpdate): Promise<Item> => {
        return storage.updateItem(id, item)
    }

    const deleteItem = async (id: number | string): Promise<void> => {
        return storage.deleteItem(id)
    }

    return {
        getItems,
        getItem,
        createItem,
        updateItem,
        deleteItem,
    }
}
