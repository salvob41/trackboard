<template>
  <UModal 
    v-model="isOpen" 
    :ui="{ width: 'sm:max-w-md' }"
    @paste="handlePaste"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">
            {{ isEdit ? 'Edit ' + itemLabel : 'New ' + itemLabel }}
          </h3>
          <UButton 
            icon="i-heroicons-x-mark" 
            color="gray" 
            variant="ghost"
            @click="closeModal"
          />
        </div>
      </template>

      <div class="relative">
        <div 
          v-if="isDragging && settings.enableImages"
          class="absolute inset-0 z-10 bg-primary/10 dark:bg-primary/20 border-2 border-dashed border-primary rounded-lg flex items-center justify-center"
        >
          <span class="text-primary font-medium">Drop images here</span>
        </div>

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

          <template v-if="settings.enableImages">
            <UFormGroup :label="'Images'" name="images">
              <div class="space-y-3">
                <div v-if="formData.images && formData.images.length > 0" class="grid grid-cols-4 gap-2">
                  <div 
                    v-for="(img, index) in formData.images" 
                    :key="index"
                    class="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                  >
                    <img :src="img" class="w-full h-full object-cover" />
                    <button
                      type="button"
                      class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                      @click="removeImage(index)"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <UButton
                    type="button"
                    icon="i-heroicons-plus"
                    size="sm"
                    variant="outline"
                    @click="triggerFileInput"
                    :disabled="(formData.images?.length || 0) >= (settings.maxImagesPerItem || 10)"
                  >
                    Add Image
                  </UButton>
                  <span class="text-xs text-gray-500">
                    {{ (formData.images?.length || 0) }}/{{ settings.maxImagesPerItem || 10 }}
                  </span>
                </div>

                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="handleFileSelect"
                />
              </div>
            </UFormGroup>
          </template>

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
      </div>
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

const toast = useToast()
const { settings } = useSettings()
const { handlePaste: extractPasteImages, handleDrop: extractDropImages, processFiles } = useImageUpload()

const itemLabel = computed(() => settings.value.itemLabel)
const primaryFieldLabel = computed(() => settings.value.primaryFieldLabel)
const secondaryFieldLabel = computed(() => settings.value.secondaryFieldLabel)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.item)
const loading = ref(false)
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const stageOptions = computed(() => props.stages.map(stage => ({
  label: stage.label,
  value: stage.key
})))

const defaultStage = computed(() => props.stages[0]?.key || '')

const formData = ref<ItemCreate & { images?: string[] }>({
  name: '',
  secondaryField: '',
  stage: '',
  notes: '',
  images: []
})

watch(() => props.item, (item) => {
  if (item) {
    formData.value = {
      name: item.name,
      secondaryField: item.secondaryField || '',
      stage: item.stage,
      notes: item.notes || '',
      images: item.images || []
    }
  } else {
    formData.value = {
      name: '',
      secondaryField: '',
      stage: defaultStage.value,
      notes: '',
      images: []
    }
  }
}, { immediate: true })

watch(defaultStage, (val) => {
  if (!props.item && !formData.value.stage) {
    formData.value.stage = val
  }
}, { immediate: true })

const removeImage = (index: number) => {
  if (formData.value.images) {
    formData.value.images.splice(index, 1)
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  await addImages(files)
  input.value = ''
}

const addImages = async (files: File[]) => {
  const maxImages = settings.value.maxImagesPerItem || 10
  const currentCount = formData.value.images?.length || 0
  
  if (currentCount >= maxImages) {
    toast.add({ title: `Maximum ${maxImages} images allowed`, color: 'amber' })
    return
  }
  
  const filesToProcess = files.slice(0, maxImages - currentCount)
  
  try {
    const base64Images = await processFiles(filesToProcess)
    if (!formData.value.images) {
      formData.value.images = []
    }
    formData.value.images.push(...base64Images)
    toast.add({ title: `${base64Images.length} image(s) added`, color: 'green' })
  } catch (error) {
    toast.add({ title: 'Failed to process images', color: 'red' })
  }
}

const handlePaste = async (event: ClipboardEvent) => {
  if (!settings.value.enableImages) return
  
  const files = extractPasteImages(event)
  if (files.length > 0) {
    await addImages(files)
  }
}

const onDragOver = (event: DragEvent) => {
  if (settings.value.enableImages && event.dataTransfer?.types.includes('Files')) {
    isDragging.value = true
  }
}

const onDragLeave = () => {
  isDragging.value = false
}

const onDrop = async (event: DragEvent) => {
  isDragging.value = false
  if (!settings.value.enableImages) return
  
  const files = extractDropImages(event)
  if (files.length > 0) {
    await addImages(files)
  }
}

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
