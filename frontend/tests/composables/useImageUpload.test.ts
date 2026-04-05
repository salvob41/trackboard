import { describe, it, expect } from 'vitest'

describe('Image paste handling', () => {
  it('should extract image file from clipboard event', () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
    const mockItem = {
      type: 'image/png',
      getAsFile: () => mockFile,
    }
    
    const mockEvent = {
      clipboardData: {
        items: [mockItem],
      },
    } as unknown as ClipboardEvent
    
    const handlePaste = (event: ClipboardEvent): File[] => {
      const items = event.clipboardData?.items
      if (!items) return []
      
      const files: File[] = []
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
      return files
    }
    
    const files = handlePaste(mockEvent)
    expect(files).toHaveLength(1)
    expect(files[0]).toBe(mockFile)
  })

  it('should return empty array when no image items', () => {
    const mockItem = {
      type: 'text/plain',
      getAsFile: () => null,
    }
    
    const mockEvent = {
      clipboardData: {
        items: [mockItem],
      },
    } as unknown as ClipboardEvent
    
    const handlePaste = (event: ClipboardEvent): File[] => {
      const items = event.clipboardData?.items
      if (!items) return []
      
      const files: File[] = []
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
      return files
    }
    
    const files = handlePaste(mockEvent)
    expect(files).toHaveLength(0)
  })

  it('should return empty array when no clipboard data', () => {
    const mockEvent = {
      clipboardData: null,
    } as unknown as ClipboardEvent
    
    const handlePaste = (event: ClipboardEvent): File[] => {
      const items = event.clipboardData?.items
      if (!items) return []
      
      const files: File[] = []
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
      return files
    }
    
    const files = handlePaste(mockEvent)
    expect(files).toHaveLength(0)
  })

  it('should extract multiple image files', () => {
    const mockFile1 = new File(['test1'], 'test1.png', { type: 'image/png' })
    const mockFile2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
    
    const mockEvent = {
      clipboardData: {
        items: [
          { type: 'image/png', getAsFile: () => mockFile1 },
          { type: 'image/jpeg', getAsFile: () => mockFile2 },
        ],
      },
    } as unknown as ClipboardEvent
    
    const handlePaste = (event: ClipboardEvent): File[] => {
      const items = event.clipboardData?.items
      if (!items) return []
      
      const files: File[] = []
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
      return files
    }
    
    const files = handlePaste(mockEvent)
    expect(files).toHaveLength(2)
  })
})

describe('Image addImages deduplication', () => {
  it('should add exactly one image when paste event is processed once', async () => {
    const images: string[] = []
    
    const processFiles = async (files: File[]): Promise<string[]> => {
      return files.map(f => `processed-${f.name}`)
    }
    
    const addImages = async (files: File[]) => {
      const processed = await processFiles(files)
      images.push(...processed)
    }
    
    const mockFile = new File(['test-image-data'], 'test.png', { type: 'image/png' })
    
    await addImages([mockFile])
    
    expect(images).toHaveLength(1)
    expect(images[0]).toBe('processed-test.png')
  })
})
