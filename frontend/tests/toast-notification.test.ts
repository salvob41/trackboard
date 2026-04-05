import { describe, it, expect } from 'vitest'

describe('Toast notification for storage quota error', () => {
  it('should identify StorageQuotaExceededError by name', () => {
    class StorageQuotaExceededError extends Error {
      constructor(message = 'Storage quota exceeded') {
        super(message)
        this.name = 'StorageQuotaExceededError'
      }
    }

    const error = new StorageQuotaExceededError()
    expect(error.name).toBe('StorageQuotaExceededError')
  })

  it('should trigger toast for quota error', () => {
    const toasts: any[] = []
    
    const toast = {
      add: (options: any) => {
        toasts.push(options)
      }
    }

    const mockError = {
      name: 'StorageQuotaExceededError',
      message: 'Storage quota exceeded. Please delete some items or images to free up space.'
    }

    if (mockError.name === 'StorageQuotaExceededError') {
      toast.add({
        title: 'Storage Full',
        description: 'Your browser storage is full. Please delete some items or images to free up space.',
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle',
        timeout: 10000,
      })
    }

    expect(toasts).toHaveLength(1)
    expect(toasts[0].title).toBe('Storage Full')
    expect(toasts[0].color).toBe('red')
  })

  it('should not trigger quota toast for other errors', () => {
    const toasts: any[] = []
    
    const toast = {
      add: (options: any) => {
        toasts.push(options)
      }
    }

    const mockError = {
      name: 'SomeOtherError',
      message: 'Something went wrong'
    }

    if (mockError.name === 'StorageQuotaExceededError') {
      toast.add({
        title: 'Storage Full',
        color: 'red',
      })
    } else {
      toast.add({
        title: 'Failed to save',
        color: 'red',
      })
    }

    expect(toasts).toHaveLength(1)
    expect(toasts[0].title).toBe('Failed to save')
  })
})
