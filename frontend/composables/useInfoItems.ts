import type { InfoItem, InfoItemCreate, InfoItemUpdate } from '~/types'
import { storage } from '~/adapters/localStorage'

export const useInfoItems = () => {
    const getInfoItems = async (itemId: number | string): Promise<InfoItem[]> => {
        return storage.getInfoItems(itemId)
    }

    const createInfoItem = async (itemId: number | string, infoItem: InfoItemCreate): Promise<InfoItem> => {
        return storage.createInfoItem(itemId, infoItem)
    }

    const updateInfoItem = async (
        itemId: number | string,
        infoItemId: number | string,
        infoItem: InfoItemUpdate
    ): Promise<InfoItem> => {
        return storage.updateInfoItem(itemId, infoItemId, infoItem)
    }

    const deleteInfoItem = async (itemId: number | string, infoItemId: number | string): Promise<void> => {
        return storage.deleteInfoItem(itemId, infoItemId)
    }

    return {
        getInfoItems,
        createInfoItem,
        updateInfoItem,
        deleteInfoItem,
    }
}
