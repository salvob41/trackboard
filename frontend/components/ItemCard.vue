<template>
  <div 
    class="item-card"
    :class="`stage-${item.stage}`"
    role="article"
    :aria-label="item.name"
    draggable="true"
    @click="$emit('click', item)"
    @dragstart="onDragStart"
  >
    <div 
      class="card-accent"
      :style="{ background: getAccentGradient(item.stage) }"
    ></div>
    <div class="card-content">
      <div class="card-header">
        <div class="name-info">
          <div class="name-icon">
            <UIcon name="i-heroicons-building-office-2" class="text-lg" />
          </div>
          <div class="name-text">
            <h3 class="name-title">{{ item.name }}</h3>
            <p
              v-if="settings.showSecondaryOnCard && item.secondaryField"
              class="name-subtitle"
            >
              {{ item.secondaryField }}
            </p>
          </div>
        </div>
        <div class="card-actions">
          <UButton 
            icon="i-heroicons-pencil" 
            size="xs" 
            color="gray" 
            variant="ghost"
            @click.stop="$emit('edit', item)"
            class="action-btn"
          />
          <UButton 
            icon="i-heroicons-trash" 
            size="xs" 
            color="red" 
            variant="ghost"
            @click.stop="$emit('delete', item.id)"
            class="action-btn"
          />
        </div>
      </div>

      <div class="card-body">
        <div v-if="settings.enableImages && thumbnail" class="image-preview">
          <img :src="thumbnail" class="image-thumbnail" />
          <div v-if="imageCount > 1" class="image-count">
            +{{ imageCount - 1 }}
          </div>
        </div>
        <div v-if="item.last_event_preview" class="notes">
          <UIcon name="i-heroicons-bolt" class="notes-icon" />
          <p class="notes-text" v-html="linkify(item.last_event_preview)"></p>
        </div>
        <div v-if="item.last_comment_preview && item.last_comment_preview !== item.last_event_preview" class="notes">
          <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="notes-icon" />
          <p class="notes-text" v-html="linkify(item.last_comment_preview)"></p>
        </div>
        <div v-if="!item.last_event_preview && !item.last_comment_preview && item.notes" class="notes">
          <UIcon name="i-heroicons-document-text" class="notes-icon" />
          <p class="notes-text" v-html="linkify(item.notes)"></p>
        </div>
        <div v-if="!item.last_event_preview && !item.last_comment_preview && !item.notes" class="notes-empty">
          <UIcon name="i-heroicons-clock" class="notes-icon" />
          <p class="notes-text">No activity yet</p>
        </div>
      </div>

      <div class="card-footer">
        <div class="date-badge">
          <UIcon name="i-heroicons-calendar" class="date-icon" />
          <span class="date-text">{{ formatDate(item.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item } from '~/types'
import { linkify } from '~/utils/linkify'

const props = defineProps<{
  item: Item
}>()

const DRAG_DATA_KEY = 'application-tracker/item-id'

const onDragStart = (e: DragEvent) => {
  e.dataTransfer?.setData(DRAG_DATA_KEY, String(props.item.id))
  e.dataTransfer && (e.dataTransfer.effectAllowed = 'move')
}

defineEmits<{
  edit: [item: Item]
  delete: [id: number | string]
  click: [item: Item]
}>()

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const { stages } = useStages()
const { settings } = useSettings()
const { getImagePreview } = useImageStore()

const thumbnail = ref<string | null>(null)
const imageCount = ref(0)

// Load thumbnail and count in a single IndexedDB round trip whenever item ID changes
watch(() => props.item.id, async (id) => {
  if (!settings.value.enableImages) {
    thumbnail.value = null
    imageCount.value = 0
    return
  }
  try {
    const preview = await getImagePreview(id)
    thumbnail.value = preview.thumbnail
    imageCount.value = preview.count
  } catch {
    thumbnail.value = null
    imageCount.value = 0
  }
}, { immediate: true })

const getAccentGradient = (stageKey: string) => {
  const stage = stages.value.find(s => s.key === stageKey)
  const color = stage?.color || 'gray'
  
  const gradients: Record<string, string> = {
    gray: 'linear-gradient(90deg, rgb(156, 163, 175), rgb(209, 213, 219))',
    blue: 'linear-gradient(90deg, rgb(59, 130, 246), rgb(96, 165, 250))',
    yellow: 'linear-gradient(90deg, rgb(234, 179, 8), rgb(250, 204, 21))',
    red: 'linear-gradient(90deg, rgb(239, 68, 68), rgb(248, 113, 113))',
    green: 'linear-gradient(90deg, rgb(34, 197, 94), rgb(74, 222, 128))',
    purple: 'linear-gradient(90deg, rgb(168, 85, 247), rgb(192, 132, 252))',
    pink: 'linear-gradient(90deg, rgb(236, 72, 153), rgb(244, 114, 182))',
    orange: 'linear-gradient(90deg, rgb(249, 115, 22), rgb(251, 146, 60))',
    teal: 'linear-gradient(90deg, rgb(20, 184, 166), rgb(45, 212, 191))'
  }
  
  return gradients[color] || gradients['gray']
}
</script>

<style scoped>
.item-card {
  position: relative;
  background: white;
  border-radius: 12px;
  border: 2px solid rgb(229, 231, 235);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px -1px rgba(0, 0, 0, 0.1);
}

.dark .item-card {
  background: rgb(31, 41, 55);
  border-color: rgb(55, 65, 81);
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -4px rgba(0, 0, 0, 0.1),
    0 0 0 3px rgba(59, 130, 246, 0.1);
  border-color: rgb(59, 130, 246);
}

.item-card:active {
  cursor: grabbing;
  transform: translateY(-2px) scale(0.98);
}

.card-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, rgb(156, 163, 175), rgb(209, 213, 219));
}

.card-content {
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 8px;
}

.name-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.name-text {
  flex: 1;
  min-width: 0;
}

.name-subtitle {
  font-size: 0.8125rem;
  color: rgb(107, 114, 128);
  margin: 2px 0 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .name-subtitle {
  color: rgb(156, 163, 175);
}

.name-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgb(239, 246, 255), rgb(219, 234, 254));
  border-radius: 8px;
  color: rgb(59, 130, 246);
}

.dark .name-icon {
  background: linear-gradient(135deg, rgb(30, 58, 138), rgb(29, 78, 216));
  color: rgb(147, 197, 253);
}

.name-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(17, 24, 39);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .name-title {
  color: rgb(243, 244, 246);
}

.card-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.item-card:hover .action-btn {
  opacity: 1;
}

.card-body {
  margin-bottom: 12px;
}

.image-preview {
  position: relative;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
}

.image-thumbnail {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgb(229, 231, 235);
}

.dark .image-thumbnail {
  border-color: rgb(55, 65, 81);
}

.image-count {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.notes,
.notes-empty {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px;
  background: rgb(249, 250, 251);
  border-radius: 8px;
  border: 1px solid rgb(229, 231, 235);
}

.dark .notes,
.dark .notes-empty {
  background: rgb(17, 24, 39);
  border-color: rgb(55, 65, 81);
}

.notes-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: rgb(107, 114, 128);
}

.dark .notes-icon {
  color: rgb(156, 163, 175);
}

.notes-text {
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgb(55, 65, 81);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dark .notes-text {
  color: rgb(209, 213, 219);
}

.notes-empty .notes-text {
  color: rgb(156, 163, 175);
  font-style: italic;
}

.dark .notes-empty .notes-text {
  color: rgb(107, 114, 128);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgb(243, 244, 246);
  border-radius: 6px;
  border: 1px solid rgb(229, 231, 235);
}

.dark .date-badge {
  background: rgb(55, 65, 81);
  border-color: rgb(75, 85, 99);
}

.date-icon {
  font-size: 0.875rem;
  color: rgb(107, 114, 128);
}

.dark .date-icon {
  color: rgb(156, 163, 175);
}

.date-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(75, 85, 99);
  letter-spacing: 0.025em;
}

.dark .date-text {
  color: rgb(156, 163, 175);
}
</style>
