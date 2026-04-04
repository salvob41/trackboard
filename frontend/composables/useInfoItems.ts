import type { InfoItem, InfoItemCreate, InfoItemUpdate } from '~/types'

export const useInfoItems = () => {
    const adapter = useStorage()

    const getInfoItems = async (itemId: number | string): Promise<InfoItem[]> => {
        return adapter.getInfoItems(itemId)
    }

    const createInfoItem = async (itemId: number | string, infoItem: InfoItemCreate): Promise<InfoItem> => {
        return adapter.createInfoItem(itemId, infoItem)
    }

    const updateInfoItem = async (
        itemId: number | string,
        infoItemId: number | string,
        infoItem: InfoItemUpdate
    ): Promise<InfoItem> => {
        return adapter.updateInfoItem(itemId, infoItemId, infoItem)
    }

    const deleteInfoItem = async (itemId: number | string, infoItemId: number | string): Promise<void> => {
        return adapter.deleteInfoItem(itemId, infoItemId)
    }

    return {
        getInfoItems,
        createInfoItem,
        updateInfoItem,
        deleteInfoItem,
    }
}
