import type { Item, ItemWithInfoItems, ItemCreate, ItemUpdate } from '~/types'

export const useItems = () => {
    const adapter = useStorage()

    const getItems = async (): Promise<Item[]> => {
        return adapter.getItems()
    }

    const getItem = async (id: number | string): Promise<ItemWithInfoItems> => {
        return adapter.getItem(id)
    }

    const createItem = async (item: ItemCreate): Promise<Item> => {
        return adapter.createItem(item)
    }

    const updateItem = async (id: number | string, item: ItemUpdate): Promise<Item> => {
        return adapter.updateItem(id, item)
    }

    const deleteItem = async (id: number | string): Promise<void> => {
        return adapter.deleteItem(id)
    }

    return {
        getItems,
        getItem,
        createItem,
        updateItem,
        deleteItem,
    }
}
