<template>
  <UModal 
    v-model="isOpen" 
    :ui="{ width: 'sm:max-w-md lg:max-w-lg' }"
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
                <div v-if="(formImages.length > 0) || pendingCount > 0" class="grid grid-cols-4 gap-2">
                  <div
                    v-for="(img, index) in formImages"
                    :key="'img-' + index"
                    class="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                  >
                    <img :src="img" class="w-full h-full object-cover" />
                    <button
                      type="button"
                      class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                      aria-label="Remove image"
                      @click="removeImage(index)"
                    >
                      ×
                    </button>
                  </div>
                  <div
                    v-for="(pending, index) in pendingList"
                    :key="'pending-' + index"
                    class="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                  >
                    <div class="image-skeleton"></div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <UButton
                    type="button"
                    icon="i-heroicons-plus"
                    size="sm"
                    variant="outline"
                    @click="triggerFileInput"
                  >
                    Add Image
                  </UButton>
                </div>

                <div class="flex items-center gap-2">
                  <UInput
                    v-model="imageUrl"
                    placeholder="Paste image URL..."
                    size="sm"
                    class="flex-1"
                    @keydown.enter.prevent="addImageFromUrl"
                  />
                  <UButton
                    type="button"
                    icon="i-heroicons-link"
                    size="sm"
                    variant="outline"
                    :loading="fetchingUrl"
                    :disabled="!imageUrl.trim()"
                    @click="addImageFromUrl"
                  >
                    Fetch
                  </UButton>
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
  // Images are passed separately so the parent can save them after obtaining the item ID
  submit: [data: ItemCreate, images: string[]]
}>()

const toast = useToast()
const { settings } = useSettings()
const { handlePaste: extractPasteImages, handleDrop: extractDropImages, processFiles } = useImageUpload()
const { getImages } = useImageStore()

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
const imageUrl = ref('')
const fetchingUrl = ref(false)
let lastPasteTime = 0

const stageOptions = computed(() => props.stages.map(stage => ({
  label: stage.label,
  value: stage.key
})))

const defaultStage = computed(() => props.stages[0]?.key || '')

const pendingCount = ref(0)
const pendingList = computed(() => Array(pendingCount.value).fill(null))

const formData = ref<ItemCreate>({
  name: '',
  secondaryField: '',
  stage: '',
  notes: '',
})

// In-memory images for preview during editing; only written to IndexedDB on submit
const formImages = ref<string[]>([])

watch(() => props.item, async (item) => {
  if (item) {
    formData.value = {
      name: item.name,
      secondaryField: item.secondaryField || '',
      stage: item.stage,
      notes: item.notes || '',
    }
    // Load existing images from IndexedDB for the edit form
    try {
      formImages.value = await getImages(item.id)
    } catch {
      formImages.value = []
    }
  } else {
    formData.value = {
      name: '',
      secondaryField: '',
      stage: defaultStage.value,
      notes: '',
    }
    formImages.value = []
  }
}, { immediate: true })

watch(defaultStage, (val) => {
  if (!props.item && !formData.value.stage) {
    formData.value.stage = val
  }
}, { immediate: true })

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
  try {
    const existingImages = new Set(formImages.value)
    pendingCount.value = files.length

    const base64Images = await processFiles(files)
    const newImages = base64Images.filter(img => !existingImages.has(img))

    pendingCount.value = 0

    if (newImages.length > 0) {
      formImages.value.push(...newImages)
      toast.add({ title: `${newImages.length} image(s) added`, color: 'green' })
    }
  } catch (error) {
    pendingCount.value = 0
    toast.add({ title: 'Failed to process images', color: 'red' })
  }
}

const removeImage = (index: number) => {
  formImages.value.splice(index, 1)
}

const addImageFromUrl = async () => {
  const url = imageUrl.value.trim()
  if (!url) return
  fetchingUrl.value = true
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      toast.add({ title: 'URL is not an image', color: 'red' })
      return
    }
    const blob = await response.blob()
    const file = new File([blob], 'url-image', { type: blob.type })
    await addImages([file])
    imageUrl.value = ''
  } catch {
    toast.add({ title: 'Could not fetch image from URL', color: 'red' })
  } finally {
    fetchingUrl.value = false
  }
}

const handlePaste = async (event: ClipboardEvent) => {
  if (!settings.value.enableImages) return
  const files = extractPasteImages(event)
  if (files.length > 0) {
    if (event.timeStamp === lastPasteTime) return
    lastPasteTime = event.timeStamp
    event.preventDefault()
    event.stopPropagation()
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
    // Pass images separately; parent saves them to IndexedDB after obtaining the item ID
    emit('submit', formData.value, formImages.value)
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  isOpen.value = false
}
</script>

<style scoped>
.image-skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgb(229, 231, 235) 0%,
    rgb(243, 244, 246) 50%,
    rgb(229, 231, 235) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.dark .image-skeleton {
  background: linear-gradient(
    90deg,
    rgb(55, 65, 81) 0%,
    rgb(75, 85, 99) 50%,
    rgb(55, 65, 81) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 640px) {
  :deep(.space-y-4 > *) {
    margin-bottom: 0.75rem;
  }
}
</style>
