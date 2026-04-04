<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-md' }">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">Settings</h2>
          <UButton 
            icon="i-heroicons-x-mark" 
            color="gray" 
            variant="ghost"
            @click="closeModal"
          />
        </div>
      </template>

      <div class="space-y-6">
        <p class="text-sm text-gray-500">
          Customize the labels used throughout the app to match your use case.
        </p>

        <UFormGroup label="Item Label" :help="`The name for individual items (default: 'Application')`">
          <USelect
            v-model="localSettings.itemLabel"
            :options="ITEM_LABEL_PRESETS"
            @change="handleSave"
          />
        </UFormGroup>

        <UFormGroup label="Primary Field Label" :help="`Label for the main name field (default: 'Company')`">
          <USelect
            v-model="localSettings.primaryFieldLabel"
            :options="PRIMARY_FIELD_PRESETS"
            @change="handleSave"
          />
        </UFormGroup>

      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton color="gray" @click="closeModal">Done</UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { Settings } from '~/types'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { settings, updateSettings, loadSettings, ITEM_LABEL_PRESETS, PRIMARY_FIELD_PRESETS } = useSettings()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const localSettings = ref<Settings>({
  itemLabel: 'Application',
  primaryFieldLabel: 'Company',
})

onMounted(() => {
  loadSettings()
  localSettings.value = { ...settings.value }
})

watch(() => props.modelValue, (open) => {
  if (open) {
    loadSettings()
    localSettings.value = { ...settings.value }
  }
})

const handleSave = () => {
  updateSettings(localSettings.value)
}

const closeModal = () => {
  isOpen.value = false
}
</script>
