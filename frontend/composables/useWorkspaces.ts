import type { Workspace, TemplateId } from '~/types'
import { storage } from '~/adapters/localStorage'

export const useWorkspaces = () => {
  const workspaces = useState<Workspace[]>('workspaces', () => [])
  const activeWorkspace = useState<Workspace | null>('activeWorkspace', () => null)

  const loadWorkspaces = () => {
    workspaces.value = storage.getWorkspaces()
    activeWorkspace.value = storage.getActiveWorkspace()
  }

  const createWorkspace = (name: string, templateId: TemplateId): Workspace => {
    const ws = storage.createWorkspace(name, templateId)
    loadWorkspaces()
    return ws
  }

  const switchWorkspace = (id: string) => {
    storage.switchWorkspace(id)
    // Use href assignment instead of reload() to ensure a full navigation
    window.location.href = window.location.pathname
  }

  const renameWorkspace = (id: string, name: string) => {
    storage.renameWorkspace(id, name)
    loadWorkspaces()
  }

  const deleteWorkspace = (id: string) => {
    storage.deleteWorkspace(id)
    if (activeWorkspace.value?.id === id) {
      window.location.reload()
    } else {
      loadWorkspaces()
    }
  }

  const exportWorkspace = (id: string) => {
    const data = storage.exportWorkspace(id)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const ws = workspaces.value.find(w => w.id === id)
    const date = new Date().toISOString().split('T')[0]
    const safeName = (ws?.name || 'workspace').toLowerCase().replace(/\s+/g, '-')
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeName}-export-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importWorkspace = (data: any): Workspace => {
    const ws = storage.importWorkspace(data)
    loadWorkspaces()
    return ws
  }

  return {
    workspaces: readonly(workspaces),
    activeWorkspace: readonly(activeWorkspace),
    loadWorkspaces,
    createWorkspace,
    switchWorkspace,
    renameWorkspace,
    deleteWorkspace,
    exportWorkspace,
    importWorkspace,
  }
}
