<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-md' }">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">
          {{ isEdit ? 'Edit ' + itemLabel : 'New ' + itemLabel }}
        </h3>
      </template>

      <UForm :state="formData" @submit="handleSubmit" class="space-y-4">
        <UFormGroup :label="primaryFieldLabel" name="name" required>
          <UInput 
            v-model="formData.name" 
            :placeholder="`Enter ${primaryFieldLabel.toLowerCase()} name`"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup :label="secondaryFieldLabel" name="secondaryField">
          <UInput
            v-model="formData.secondaryField"
            :placeholder="`Enter ${secondaryFieldLabel.toLowerCase()}`"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Stage" name="stage" required>
          <USelect 
            v-model="formData.stage" 
            :options="stageOptions"
            :disabled="loading"
          />
        </UFormGroup>

        <UFormGroup label="Notes" name="notes">
          <UTextarea 
            v-model="formData.notes" 
            placeholder="Add notes..."
            :rows="3"
            :disabled="loading"
          />
        </UFormGroup>

        <div class="flex justify-end gap-2">
          <UButton 
            color="gray" 
            variant="ghost" 
            @click="closeModal"
            :disabled="loading"
          >
            Cancel
          </UButton>
          <UButton 
            type="submit"
            :loading="loading"
          >
            {{ isEdit ? 'Update' : 'Create' }}
          </UButton>
        </div>
      </UForm>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { Item, ItemCreate, Stage } from '~/types'

const props = defineProps<{
  modelValue: boolean
  item?: Item
  stages: Stage[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: ItemCreate]
}>()

const { settings } = useSettings()
const itemLabel = computed(() => settings.value.itemLabel)
const primaryFieldLabel = computed(() => settings.value.primaryFieldLabel)
const secondaryFieldLabel = computed(() => settings.value.secondaryFieldLabel)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.item)
const loading = ref(false)

const stageOptions = computed(() => props.stages.map(stage => ({
  label: stage.label,
  value: stage.key
})))

const formData = ref<ItemCreate>({
  name: '',
  secondaryField: '',
  stage: 'wishlist',
  notes: ''
})

watch(() => props.item, (item) => {
  if (item) {
    formData.value = {
      name: item.name,
      secondaryField: item.secondaryField || '',
      stage: item.stage,
      notes: item.notes || ''
    }
  } else {
    formData.value = {
      name: '',
      secondaryField: '',
      stage: 'wishlist',
      notes: ''
    }
  }
}, { immediate: true })

const handleSubmit = async () => {
  loading.value = true
  try {
    emit('submit', formData.value)
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  isOpen.value = false
}
</script>
