import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { useImageStore } from '../../composables/useImageStore'

// idb-keyval uses IndexedDB which is available in jsdom via fake-indexeddb
describe('useImageStore', () => {
  const { saveImages, getImages, getImageCount, getFirstImage, getImagePreview, deleteImages } = useImageStore()
  const itemId = 'test-item-1'

  beforeEach(async () => {
    await deleteImages(itemId)
    await deleteImages('test-item-2')
  })

  it('saves and retrieves images', async () => {
    await saveImages(itemId, ['data:image/png;base64,abc', 'data:image/png;base64,def'])
    const images = await getImages(itemId)
    expect(images).toHaveLength(2)
    expect(images[0]).toBe('data:image/png;base64,abc')
    expect(images[1]).toBe('data:image/png;base64,def')
  })

  it('returns empty array when no images', async () => {
    const images = await getImages('nonexistent')
    expect(images).toEqual([])
  })

  it('getImageCount returns correct count', async () => {
    await saveImages(itemId, ['img1', 'img2', 'img3'])
    expect(await getImageCount(itemId)).toBe(3)
  })

  it('getImageCount returns 0 for nonexistent item', async () => {
    expect(await getImageCount('nonexistent')).toBe(0)
  })

  it('getFirstImage returns first image', async () => {
    await saveImages(itemId, ['first', 'second'])
    expect(await getFirstImage(itemId)).toBe('first')
  })

  it('getFirstImage returns null when no images', async () => {
    expect(await getFirstImage('nonexistent')).toBeNull()
  })

  it('getImagePreview returns thumbnail and count', async () => {
    await saveImages(itemId, ['thumb', 'other'])
    const preview = await getImagePreview(itemId)
    expect(preview.thumbnail).toBe('thumb')
    expect(preview.count).toBe(2)
  })

  it('getImagePreview returns null/0 for nonexistent item', async () => {
    const preview = await getImagePreview('nonexistent')
    expect(preview.thumbnail).toBeNull()
    expect(preview.count).toBe(0)
  })

  it('deleteImages removes all images and count', async () => {
    await saveImages(itemId, ['img1', 'img2'])
    await deleteImages(itemId)
    expect(await getImages(itemId)).toEqual([])
    expect(await getImageCount(itemId)).toBe(0)
  })

  it('saveImages with empty array clears existing images', async () => {
    await saveImages(itemId, ['img1', 'img2'])
    await saveImages(itemId, [])
    expect(await getImages(itemId)).toEqual([])
    expect(await getImageCount(itemId)).toBe(0)
  })

  it('saveImages replaces previous images', async () => {
    await saveImages(itemId, ['old1', 'old2'])
    await saveImages(itemId, ['new1'])
    const images = await getImages(itemId)
    expect(images).toEqual(['new1'])
  })

  it('images are isolated per item', async () => {
    await saveImages(itemId, ['item1-img'])
    await saveImages('test-item-2', ['item2-img'])
    expect(await getImages(itemId)).toEqual(['item1-img'])
    expect(await getImages('test-item-2')).toEqual(['item2-img'])
  })
})
