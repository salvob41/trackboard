<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
    <ClientOnly>
      <BackupReminder v-if="!needsOnboarding" @export="handleQuickExport" />
    </ClientOnly>

    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div class="px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-briefcase" class="text-3xl text-primary" />
            <h1 class="text-2xl font-bold">{{ appTitle }}</h1>
            <WorkspaceSelector class="ml-2" />
          </div>
          <div class="flex items-center gap-3">
            <UButton 
              icon="i-heroicons-plus" 
              @click="openCreateModal"
              size="lg"
            >
              New {{ itemLabel }}
            </UButton>
            <UTooltip text="Download Backup">
              <UButton
                icon="i-heroicons-arrow-down-tray"
                color="gray"
                variant="ghost"
                @click="handleQuickExport"
              >
                <span class="hidden lg:inline ml-1">Backup</span>
              </UButton>
            </UTooltip>
            <UButton
              icon="i-heroicons-cog-6-tooth"
              color="gray"
              variant="ghost"
              @click="showStagesSettings = true"
            />
            <UButton
              icon="i-heroicons-ellipsis-horizontal"
              color="gray"
              variant="ghost"
              @click="showSettings = true"
            />
            <ClientOnly>
              <UButton
                :icon="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'"
                color="gray"
                variant="ghost"
                @click="toggleDark"
              />
            </ClientOnly>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <div v-if="pending" class="flex justify-center items-center h-96">
        <UIcon name="i-heroicons-arrow-path" class="text-4xl animate-spin" />
      </div>

      <div v-else-if="error" class="max-w-7xl mx-auto px-4 py-8">
        <UAlert 
          color="red" 
          variant="soft"
          title="Error loading items"
          :description="error.message"
        />
      </div>

      <KanbanBoard
        v-else
        :items="items"
        :stages="stages"
        @update-stage="handleUpdateStage"
        @edit="openEditModal"
        @delete="handleDelete"
        @click="openDetailModal"
      />
    </main>

    <ItemForm
      v-model="showModal"
      :item="selectedItem"
      :stages="stages"
      @submit="handleSubmit"
    />

    <ItemDetail
      v-model="showDetailModal"
      :item="selectedItemDetail"
      @edit="openEditFromDetail"
      @delete="handleDelete"
    />

    <StagesSettings
      v-model="showStagesSettings"
      :stages="stages"
    />

    <SettingsModal
      v-model="showSettings"
    />

    <ConfirmDeleteModal
      v-model="showDeleteModal"
      :item-name="itemToDelete?.name || ''"
      :loading="deleteLoading"
      @confirm="handleConfirmDelete"
    />

    <StageCommentModal
      v-model="showCommentModal"
      :pending-transition="pendingTransition"
      @save="handleCommentSave"
      @skip="handleCommentSkip"
    />

    <ClientOnly>
      <FirstVisitNotice v-if="!needsOnboarding" />
      <WorkspaceCreateModal
        v-model="needsOnboarding"
        :required="true"
        @update:model-value="handleOnboardingComplete"
      />
    </ClientOnly>

    <footer class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto">
      <div class="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <span class="text-sm text-gray-400 dark:text-gray-500">{{ appTitle }}</span>
        <div class="flex items-center gap-4">
          <a
            href="https://github.com/salvob41/app-tracker"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1.5"
          >
            <UIcon name="i-simple-icons-github" class="text-base" />
            GitHub
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { Item, ItemCreate } from '~/types'

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const toast = useToast()
const { recordBackup, recordChange } = useBackup()
const { settings, loadSettings } = useSettings()
const { loadWorkspaces, activeWorkspace, exportWorkspace, workspaces } = useWorkspaces()

const appTitle = computed(() => `${settings.value.itemLabel} Tracker`)
const itemLabel = computed(() => settings.value.itemLabel)

const toggleDark = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const { getItems, createItem, updateItem, deleteItem } = useItems()
const { createInfoItem, updateInfoItem } = useInfoItems()
const { stages, loadStages } = useStages()

const items = ref<Item[]>([])
const pending = ref(true)
const error = ref<Error | null>(null)
const showSettings = ref(false)
const showModal = ref(false)
const selectedItem = ref<Item | undefined>()
const showDetailModal = ref(false)
const selectedItemDetail = ref<Item | undefined>()
const showStagesSettings = ref(false)

const showCommentModal = ref(false)
const pendingTransition = ref<{
  itemId: number | string
  fromStage: string
  toStage: string
  eventItemId: number | string | null
} | null>(null)
const blockDetailForItemId = ref<number | string | null>(null)

const showDeleteModal = ref(false)
const itemToDelete = ref<Item | null>(null)
const deleteLoading = ref(false)
const needsOnboarding = ref(false)

const loadItems = async (showLoading = true) => {
  try {
    if (showLoading) pending.value = true
    error.value = null
    const [fetchedItems] = await Promise.all([
      getItems(),
      loadStages()
    ])
    items.value = fetchedItems
  } catch (e) {
    error.value = e as Error
  } finally {
    if (showLoading) pending.value = false
  }
}

const openCreateModal = () => {
  selectedItem.value = undefined
  showModal.value = true
}

const openEditModal = (item: Item) => {
  selectedItem.value = item
  showModal.value = true
}

const openDetailModal = (item: Item) => {
  if (blockDetailForItemId.value === item.id) return
  selectedItemDetail.value = item
  showDetailModal.value = true
}

const openEditFromDetail = (item: Item) => {
  selectedItem.value = item
  showModal.value = true
}

const handleSubmit = async (data: ItemCreate) => {
  try {
    if (selectedItem.value) {
      const index = items.value.findIndex(i => i.id === selectedItem.value!.id)
      if (index !== -1) {
        items.value[index] = { ...items.value[index], ...data }
      }
      await updateItem(selectedItem.value.id, data)
    } else {
      await createItem(data)
    }
    showModal.value = false
    await loadItems(false)
    
    recordChange()
  } catch (e: any) {
    console.error('Save error:', e?.constructor?.name, e?.name, e?.message)
    if (e?.name === 'StorageQuotaExceededError' || e?.message?.includes('quota')) {
      toast.add({
        title: 'Storage Full',
        description: 'Your browser storage is full. Please delete some items or images to free up space.',
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle',
        timeout: 10000,
      })
    } else {
      console.error('Failed to save item:', e)
      toast.add({
        title: 'Failed to save',
        description: 'An error occurred while saving. Please try again.',
        color: 'red',
      })
    }
    await loadItems()
  }
}

const handleUpdateStage = async (id: number | string, toStage: string, fromStage: string) => {
  blockDetailForItemId.value = id
  const index = items.value.findIndex(i => i.id === id)
  if (index !== -1) {
    items.value[index] = { ...items.value[index], stage: toStage }
  }
  try {
    await updateItem(id, { stage: toStage })
    const created = await createInfoItem(id, {
      event_type: 'transition',
      from_stage: fromStage,
      to_stage: toStage,
      event_date: new Date().toISOString(),
      content: null,
      tag: null,
    })
    pendingTransition.value = {
      itemId: id,
      fromStage,
      toStage,
      eventItemId: created.id,
    }
    showCommentModal.value = true
    
    recordChange()
  } catch (e) {
    blockDetailForItemId.value = null
    console.error('Failed to update stage:', e)
    await loadItems()
  }
}

const handleCommentSave = async (comment: string) => {
  if (!pendingTransition.value?.eventItemId) return
  const { itemId, eventItemId } = pendingTransition.value
  try {
    await updateInfoItem(itemId, eventItemId, { content: comment })
    const idx = items.value.findIndex(i => i.id === itemId)
    if (idx !== -1) {
      items.value[idx] = { ...items.value[idx], last_comment_preview: comment }
    }
  } finally {
    showCommentModal.value = false
    pendingTransition.value = null
    blockDetailForItemId.value = null
  }
}

const handleCommentSkip = () => {
  showCommentModal.value = false
  pendingTransition.value = null
  blockDetailForItemId.value = null
}

const handleDelete = (id: number | string) => {
  const item = items.value.find(i => i.id === id)
  if (item) {
    itemToDelete.value = item
    showDeleteModal.value = true
  }
}

const handleConfirmDelete = async () => {
  if (!itemToDelete.value) return
  
  try {
    deleteLoading.value = true
    const id = itemToDelete.value.id
    
    items.value = items.value.filter(i => i.id !== id)
    if (selectedItemDetail.value?.id === id) {
      showDetailModal.value = false
    }

    await deleteItem(id)
    showDeleteModal.value = false
    
    recordChange()
  } catch (e) {
    console.error('Failed to delete item:', e)
    await loadItems()
  } finally {
    deleteLoading.value = false
    itemToDelete.value = null
  }
}

const handleQuickExport = () => {
  if (!activeWorkspace.value) return
  exportWorkspace(activeWorkspace.value.id)
  recordBackup()
  toast.add({ title: 'Data exported successfully', color: 'green', icon: 'i-heroicons-check-circle' })
}

const handleOnboardingComplete = () => {
  needsOnboarding.value = false
  loadWorkspaces()
  loadSettings()
  loadItems()
}

onMounted(() => {
  loadWorkspaces()
  if (workspaces.value.length === 0) {
    needsOnboarding.value = true
    pending.value = false
    return
  }
  loadSettings()
  loadItems()
})
</script>
