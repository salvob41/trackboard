import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Image storage deduplication', () => {
  it('should not exceed maxImages when adding images multiple times', async () => {
    const images: string[] = []
    const maxImages = 10
    
    const processFiles = async (files: File[]): Promise<string[]> => {
      return files.map((f, i) => `base64-image-${i}-${f.name}`)
    }
    
    const addImages = async (files: File[]) => {
      const currentCount = images.length
      
      if (currentCount >= maxImages) {
        return
      }
      
      const uniqueFiles = files.filter((file, index, self) => 
        index === self.findIndex(f => f.name === file.name && f.size === file.size && f.type === file.type)
      )
      
      const filesToProcess = uniqueFiles.slice(0, maxImages - currentCount)
      
      if (filesToProcess.length === 0) return
      
      const base64Images = await processFiles(filesToProcess)
      
      const existingImages = new Set(images)
      const newImages = base64Images.filter(img => !existingImages.has(img))
      
      if (newImages.length > 0) {
        images.push(...newImages)
      }
    }
    
    const mockFile = (name: string) => new File(['test'], name, { type: 'image/png' })
    
    await addImages([mockFile('img1.png'), mockFile('img2.png')])
    expect(images.length).toBe(2)
    
    await addImages([mockFile('img3.png'), mockFile('img4.png')])
    expect(images.length).toBe(4)
    
    await addImages([mockFile('img5.png')])
    expect(images.length).toBe(5)
  })
  
  it('should deduplicate same file pasted multiple times across calls', async () => {
    const images: string[] = []
    const maxImages = 10
    
    const processFiles = async (files: File[]): Promise<string[]> => {
      return files.map((f, i) => `base64-image-${f.name}`)
    }
    
    const addImages = async (files: File[]) => {
      const currentCount = images.length
      
      if (currentCount >= maxImages) {
        return
      }
      
      const uniqueFiles = files.filter((file, index, self) => 
        index === self.findIndex(f => f.name === file.name && f.size === file.size && f.type === file.type)
      )
      
      const filesToProcess = uniqueFiles.slice(0, maxImages - currentCount)
      
      if (filesToProcess.length === 0) return
      
      const base64Images = await processFiles(filesToProcess)
      
      const existingImages = new Set(images)
      const newImages = base64Images.filter(img => !existingImages.has(img))
      
      if (newImages.length > 0) {
        images.push(...newImages)
      }
    }
    
    const sameFile = new File(['test'], 'same.png', { type: 'image/png' })
    
    await addImages([sameFile])
    expect(images.length).toBe(1)
    
    await addImages([sameFile])
    expect(images.length).toBe(1)
    
    await addImages([sameFile, sameFile])
    expect(images.length).toBe(1)
  })
  
  it('should respect maxImages limit', async () => {
    const images: string[] = []
    const maxImages = 4
    
    const processFiles = async (files: File[]): Promise<string[]> => {
      return files.map((f, i) => `base64-image-${i}-${f.name}`)
    }
    
    const addImages = async (files: File[]) => {
      const currentCount = images.length
      
      if (currentCount >= maxImages) {
        return
      }
      
      const uniqueFiles = files.filter((file, index, self) => 
        index === self.findIndex(f => f.name === file.name && f.size === file.size && f.type === file.type)
      )
      
      const filesToProcess = uniqueFiles.slice(0, maxImages - currentCount)
      
      if (filesToProcess.length === 0) return
      
      const base64Images = await processFiles(filesToProcess)
      
      const existingImages = new Set(images)
      const newImages = base64Images.filter(img => !existingImages.has(img))
      
      if (newImages.length > 0) {
        images.push(...newImages)
      }
    }
    
    const mockFile = (i: number) => new File(['test'], `img${i}.png`, { type: 'image/png' })
    
    await addImages([mockFile(1), mockFile(2)])
    expect(images.length).toBe(2)
    
    await addImages([mockFile(3), mockFile(4)])
    expect(images.length).toBe(4)
    
    await addImages([mockFile(5)])
    expect(images.length).toBe(4)
    
    await addImages([mockFile(6), mockFile(7)])
    expect(images.length).toBe(4)
  })
  
  it('should handle mix of new and existing images', async () => {
    const images: string[] = ['base64-existing-image']
    const maxImages = 10
    
    const processFiles = async (files: File[]): Promise<string[]> => {
      return files.map((f, i) => `base64-image-${i}-${f.name}`)
    }
    
    const addImages = async (files: File[]) => {
      const currentCount = images.length
      
      if (currentCount >= maxImages) {
        return
      }
      
      const uniqueFiles = files.filter((file, index, self) => 
        index === self.findIndex(f => f.name === file.name && f.size === file.size && f.type === file.type)
      )
      
      const filesToProcess = uniqueFiles.slice(0, maxImages - currentCount)
      
      if (filesToProcess.length === 0) return
      
      const base64Images = await processFiles(filesToProcess)
      
      const existingImages = new Set(images)
      const newImages = base64Images.filter(img => !existingImages.has(img))
      
      if (newImages.length > 0) {
        images.push(...newImages)
      }
    }
    
    const mockFile = (name: string) => new File(['test'], name, { type: 'image/png' })
    
    await addImages([mockFile('new1.png'), mockFile('new2.png')])
    expect(images.length).toBe(3)
    expect(images).toContain('base64-existing-image')
    expect(images).toContain('base64-image-0-new1.png')
    expect(images).toContain('base64-image-1-new2.png')
  })
})
