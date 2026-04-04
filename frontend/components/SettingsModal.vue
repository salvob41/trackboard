<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-lg' }">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">Settings</h2>
          <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" @click="isOpen = false" />
        </div>
      </template>

      <div class="space-y-8">
        <!-- Current Workspace -->
        <div>
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-rectangle-stack" />
            Current Workspace
          </h3>
          <div class="space-y-3">
            <UFormGroup label="Name">
              <UInput v-model="workspaceName" @blur="handleRename" @keydown.enter="handleRename" />
            </UFormGroup>
            <div class="flex items-center gap-2">
              <UBadge color="primary" variant="subtle" size="sm">
                {{ activeWorkspace?.templateId }}
              </UBadge>
            </div>
          </div>
        </div>

        <UDivider />

        <!-- Labels -->
        <div>
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-tag" />
            Labels
          </h3>
          <div class="space-y-4">
            <UFormGroup label="Item Label" :help="`What each tracked item is called`">
              <USelect v-model="localSettings.itemLabel" :options="ITEM_LABEL_PRESETS" @change="handleSaveSettings" />
            </UFormGroup>
            <UFormGroup label="Primary Field Label" :help="`Label for the main name field`">
              <USelect v-model="localSettings.primaryFieldLabel" :options="PRIMARY_FIELD_PRESETS" @change="handleSaveSettings" />
            </UFormGroup>
            <UFormGroup label="Secondary Field Label" :help="`Label for the subtitle field`">
              <USelect v-model="localSettings.secondaryFieldLabel" :options="SECONDARY_FIELD_PRESETS" @change="handleSaveSettings" />
            </UFormGroup>
            <UFormGroup label="Show Secondary on Card" :help="`Display the secondary field as a subtitle on cards`">
              <UToggle v-model="localSettings.showSecondaryOnCard" @change="handleSaveSettings" />
            </UFormGroup>
          </div>
        </div>

        <UDivider />

        <!-- All Workspaces -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <UIcon name="i-heroicons-squares-2x2" />
              Workspaces
            </h3>
            <UButton icon="i-heroicons-plus" size="xs" color="primary" variant="soft" @click="showCreate = true">
              New
            </UButton>
          </div>

          <div class="space-y-2">
            <div
              v-for="ws in workspaces"
              :key="ws.id"
              class="flex items-center gap-3 p-3 rounded-lg border transition-colors"
              :class="ws.id === activeWorkspace?.id
                ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700'"
            >
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{{ ws.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ getTemplateName(ws.templateId) }}</div>
              </div>
              <div class="flex items-center gap-1">
                <UBadge v-if="ws.id === defaultWorkspaceId" color="green" variant="subtle" size="xs">default</UBadge>
                <UTooltip v-if="ws.id !== defaultWorkspaceId" text="Set as default">
                  <UButton icon="i-heroicons-star" size="xs" color="gray" variant="ghost" @click="setDefault(ws.id)" />
                </UTooltip>
                <UButton
                  v-if="ws.id !== activeWorkspace?.id"
                  size="xs" color="primary" variant="soft"
                  @click="handleSwitch(ws.id)"
                >
                  Switch
                </UButton>
                <UButton
                  v-if="workspaces.length > 1"
                  icon="i-heroicons-trash" size="xs" color="red" variant="ghost"
                  @click="handleDelete(ws.id, ws.name)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton color="gray" @click="isOpen = false">Done</UButton>
        </div>
      </template>
    </UCard>

    <!-- Inline create workspace -->
    <WorkspaceCreateModal v-model="showCreate" />
  </UModal>
</template>

<script setup lang="ts">
import type { Settings } from '~/types'
import { WORKSPACE_TEMPLATES } from '~/config/templates'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { settings, updateSettings, loadSettings, ITEM_LABEL_PRESETS, PRIMARY_FIELD_PRESETS, SECONDARY_FIELD_PRESETS, DEFAULT_SETTINGS } = useSettings()
const { workspaces, activeWorkspace, loadWorkspaces, renameWorkspace, switchWorkspace, deleteWorkspace } = useWorkspaces()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const localSettings = ref<Settings>({ ...DEFAULT_SETTINGS })
const workspaceName = ref('')
const showCreate = ref(false)
const defaultWorkspaceId = ref<string | null>(null)

const loadDefaultId = () => {
  if (import.meta.server) return
  defaultWorkspaceId.value = localStorage.getItem('app-tracker:default-workspace') || workspaces.value[0]?.id || null
}

const setDefault = (id: string) => {
  localStorage.setItem('app-tracker:default-workspace', id)
  defaultWorkspaceId.value = id
}

const getTemplateName = (templateId: string) => {
  return WORKSPACE_TEMPLATES.find(t => t.id === templateId)?.name || templateId
}

watch(isOpen, (open) => {
  if (open) {
    loadSettings()
    loadWorkspaces()
    localSettings.value = { ...settings.value }
    workspaceName.value = activeWorkspace.value?.name || ''
    loadDefaultId()
  }
})

const handleSaveSettings = () => {
  updateSettings(localSettings.value)
}

const handleRename = () => {
  const trimmed = workspaceName.value.trim()
  if (trimmed && activeWorkspace.value && trimmed !== activeWorkspace.value.name) {
    renameWorkspace(activeWorkspace.value.id, trimmed)
  }
}

const handleSwitch = (id: string) => {
  switchWorkspace(id)
}

const handleDelete = (id: string, name: string) => {
  if (confirm(`Delete workspace "${name}"? All its data will be lost.`)) {
    deleteWorkspace(id)
    if (defaultWorkspaceId.value === id) {
      localStorage.removeItem('app-tracker:default-workspace')
      loadDefaultId()
    }
    loadWorkspaces()
  }
}
</script>
