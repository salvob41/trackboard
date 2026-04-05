interface ImageUploadOptions {
  maxDimension: number
  maxSizeKb: number
  quality: number
}

const DEFAULT_OPTIONS: ImageUploadOptions = {
  maxDimension: 1200,
  maxSizeKb: 500,
  quality: 0.8,
}

export const useImageUpload = (options: Partial<ImageUploadOptions> = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = reject
      
      reader.onload = (e) => {
        const img = new Image()
        img.onerror = reject
        
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          
          if (width > opts.maxDimension || height > opts.maxDimension) {
            if (width > height) {
              height = Math.round((height * opts.maxDimension) / width)
              width = opts.maxDimension
            } else {
              width = Math.round((width * opts.maxDimension) / height)
              height = opts.maxDimension
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }
          
          ctx.drawImage(img, 0, 0, width, height)
          
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
          let quality = opts.quality
          let base64 = canvas.toDataURL(mimeType, quality)
          
          while (base64.length > opts.maxSizeKb * 1024 * 1.37 && quality > 0.1) {
            quality -= 0.1
            base64 = canvas.toDataURL(mimeType, quality)
          }
          
          resolve(base64)
        }
        
        img.src = e.target?.result as string
      }
      
      reader.readAsDataURL(file)
    })
  }

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

  const handleDrop = (event: DragEvent): File[] => {
    const files = event.dataTransfer?.files
    if (!files) return []
    
    return Array.from(files).filter(f => f.type.startsWith('image/'))
  }

  const processFiles = async (files: File[]): Promise<string[]> => {
    return Promise.all(files.map(f => compressImage(f)))
  }

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Only image files are allowed'
    }
    return null
  }

  return {
    compressImage,
    handlePaste,
    handleDrop,
    processFiles,
    validateFile,
  }
}
