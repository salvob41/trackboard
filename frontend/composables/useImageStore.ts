import { get, set, del } from 'idb-keyval'

function imageKey(itemId: string | number, index: number): string {
  return `img:${itemId}:${index}`
}

export const useImageStore = () => {
  const saveImages = async (itemId: string | number, dataUrls: string[]): Promise<void> => {
    // Delete existing images first to handle count changes (e.g. user removed images)
    await deleteImages(itemId)
    await Promise.all(
      dataUrls.map((dataUrl, i) => set(imageKey(itemId, i), dataUrl))
    )
    // Store count separately to avoid scanning all keys on reads
    await set(`img:${itemId}:count`, dataUrls.length)
  }

  const getImages = async (itemId: string | number): Promise<string[]> => {
    const count = await get<number>(`img:${itemId}:count`)
    if (!count) return []
    const images = await Promise.all(
      Array.from({ length: count }, (_, i) => get<string>(imageKey(itemId, i)))
    )
    return images.filter((img): img is string => !!img)
  }

  const getImageCount = async (itemId: string | number): Promise<number> => {
    return (await get<number>(`img:${itemId}:count`)) || 0
  }

  const getFirstImage = async (itemId: string | number): Promise<string | null> => {
    return (await get<string>(imageKey(itemId, 0))) || null
  }

  const deleteImages = async (itemId: string | number): Promise<void> => {
    const count = await get<number>(`img:${itemId}:count`)
    if (!count) return
    await Promise.all(
      Array.from({ length: count }, (_, i) => del(imageKey(itemId, i)))
    )
    await del(`img:${itemId}:count`)
  }

  return { saveImages, getImages, getImageCount, getFirstImage, deleteImages }
}
