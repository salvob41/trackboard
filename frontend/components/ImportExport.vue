<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Backup & Restore</h3>
      <span class="text-xs text-gray-500 dark:text-gray-400">
        Last backup: {{ lastBackupFormatted }}
      </span>
    </div>

    <div class="space-y-3">
      <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <UIcon name="i-heroicons-arrow-down-tray" class="text-lg text-gray-500 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Download Backup</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Save this workspace's data as a file</p>
        </div>
        <UButton color="primary" variant="soft" size="sm" @click="handleExport">Download</UButton>
      </div>

      <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <UIcon name="i-heroicons-arrow-up-tray" class="text-lg text-gray-500 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Import as New Workspace</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Load a backup file as a new workspace</p>
        </div>
        <UButton color="gray" variant="soft" size="sm" @click="triggerImport" :loading="importing">Browse...</UButton>
      </div>
    </div>

    <p class="text-xs text-gray-400 dark:text-gray-500 italic">
      Your data is stored in this browser only. Download a backup to keep your data safe or transfer to another device.
    </p>

    <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleFileSelect" />
  </div>
</template>

<script setup lang="ts">
const toast = useToast()
const { recordBackup, lastBackupFormatted } = useBackup()
const { activeWorkspace, exportWorkspace, importWorkspace, switchWorkspace } = useWorkspaces()
const fileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)

function handleExport() {
  if (!activeWorkspace.value) return
  exportWorkspace(activeWorkspace.value.id)
  recordBackup()
  toast.add({ title: 'Data exported successfully', color: 'green', icon: 'i-heroicons-check-circle' })
}

function triggerImport() {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  importing.value = true
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)

    // Map v1 format (applications) to v2 (items)
    if ('applications' in parsed && !('items' in parsed)) {
      parsed.items = parsed.applications
      delete parsed.applications
    }

    // Validate required arrays
    if (!Array.isArray(parsed.items) || !Array.isArray(parsed.stages)) {
      toast.add({ title: 'Invalid file format', color: 'red', icon: 'i-heroicons-x-circle' })
      return
    }

    // Normalize optional fields
    if (!Array.isArray(parsed.infoItems)) {
      parsed.infoItems = []
    }

    // Import as new workspace
    const ws = importWorkspace(parsed)
    toast.add({ title: `Imported as workspace "${ws.name}"`, color: 'green', icon: 'i-heroicons-check-circle' })
    switchWorkspace(ws.id)
  } catch {
    toast.add({ title: 'Could not read file', color: 'red', icon: 'i-heroicons-x-circle' })
  } finally {
    importing.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

defineExpose({ handleExport })
</script>
