import { describe, it, expect } from 'vitest'
import { useImageUpload } from '../../composables/useImageUpload'

describe('useImageUpload', () => {
  const { handlePaste, handleDrop, validateFile } = useImageUpload()

  describe('handlePaste', () => {
    it('extracts image files from clipboard event', () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
      const event = {
        clipboardData: {
          items: [{ type: 'image/png', getAsFile: () => mockFile }],
        },
      } as unknown as ClipboardEvent

      const files = handlePaste(event)
      expect(files).toHaveLength(1)
      expect(files[0]).toBe(mockFile)
    })

    it('returns empty array when no image items', () => {
      const event = {
        clipboardData: {
          items: [{ type: 'text/plain', getAsFile: () => null }],
        },
      } as unknown as ClipboardEvent

      expect(handlePaste(event)).toHaveLength(0)
    })

    it('returns empty array when no clipboard data', () => {
      const event = { clipboardData: null } as unknown as ClipboardEvent
      expect(handlePaste(event)).toHaveLength(0)
    })

    it('extracts multiple image files', () => {
      const file1 = new File(['a'], 'a.png', { type: 'image/png' })
      const file2 = new File(['b'], 'b.jpg', { type: 'image/jpeg' })
      const event = {
        clipboardData: {
          items: [
            { type: 'image/png', getAsFile: () => file1 },
            { type: 'image/jpeg', getAsFile: () => file2 },
          ],
        },
      } as unknown as ClipboardEvent

      expect(handlePaste(event)).toHaveLength(2)
    })
  })

  describe('handleDrop', () => {
    it('extracts image files from drag event', () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
      const event = {
        dataTransfer: { files: [mockFile] },
      } as unknown as DragEvent

      const files = handleDrop(event)
      expect(files).toHaveLength(1)
    })

    it('filters non-image files', () => {
      const imgFile = new File(['img'], 'img.png', { type: 'image/png' })
      const txtFile = new File(['txt'], 'doc.txt', { type: 'text/plain' })
      const event = {
        dataTransfer: { files: [imgFile, txtFile] },
      } as unknown as DragEvent

      expect(handleDrop(event)).toHaveLength(1)
    })
  })

  describe('validateFile', () => {
    it('returns null for valid image', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      expect(validateFile(file)).toBeNull()
    })

    it('returns error for non-image', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      expect(validateFile(file)).toBeTruthy()
    })
  })
})
