<template>
  <UModal v-model="isOpen" :prevent-close="required" :ui="{ width: 'sm:max-w-lg' }">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">{{ required ? 'Create Your First Board' : 'New Board' }}</h2>
          <UButton v-if="!required" icon="i-heroicons-x-mark" color="gray" variant="ghost" @click="isOpen = false" />
        </div>
        <p v-if="required" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Choose a template to get started. You can customize everything later.
        </p>
      </template>

      <div class="space-y-5">
        <UFormGroup label="Board Name" required>
          <UInput v-model="name" placeholder="e.g. Job Hunt 2026" autofocus />
        </UFormGroup>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Template
          </label>
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="template in WORKSPACE_TEMPLATES"
              :key="template.id"
              type="button"
              class="flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-colors"
              :class="selectedTemplate === template.id
                ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
              @click="selectTemplate(template.id)"
            >
              <UIcon :name="template.icon" class="text-xl mt-0.5 flex-shrink-0" />
              <div class="min-w-0">
                <div class="font-medium text-sm">{{ template.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ template.description }}</div>
                <div v-if="template.stages.length" class="flex flex-wrap gap-1 mt-1.5">
                  <UBadge
                    v-for="stage in template.stages"
                    :key="stage.key"
                    :color="stage.color"
                    variant="subtle"
                    size="xs"
                  >
                    {{ stage.label }}
                  </UBadge>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton v-if="!required" color="gray" @click="isOpen = false">Cancel</UButton>
          <UButton color="primary" :disabled="!name.trim()" @click="handleCreate">
            {{ required ? "Let's go!" : 'Create Board' }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { TemplateId } from '~/types'
import { WORKSPACE_TEMPLATES } from '~/config/templates'

const props = defineProps<{
  modelValue: boolean
  required?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { createWorkspace, switchWorkspace } = useWorkspaces()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const name = ref('')
const selectedTemplate = ref<TemplateId>('job-application')

const selectTemplate = (id: TemplateId) => {
  selectedTemplate.value = id
  if (!name.value.trim()) {
    const template = WORKSPACE_TEMPLATES.find(t => t.id === id)
    if (template) name.value = template.name
  }
}

const handleCreate = () => {
  if (!name.value.trim()) return
  const ws = createWorkspace(name.value.trim(), selectedTemplate.value)
  isOpen.value = false
  name.value = ''
  selectedTemplate.value = 'job-application'
  switchWorkspace(ws.id)
}

watch(isOpen, (open) => {
  if (open) {
    name.value = ''
    selectedTemplate.value = 'job-application'
  }
})
</script>
