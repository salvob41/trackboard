<template>
  <div class="kanban-board">
    <div 
      v-for="stage in stages" 
      :key="stage.key" 
      class="kanban-column"
      @dragover.prevent
      @drop="(e) => onNativeDrop(e, stage.key)"
    >
      <div class="column-header">
        <h2 class="text-xl font-bold">{{ stage.label }}</h2>
        <UBadge :color="stage.color" variant="subtle">
          {{ (columns[stage.key] || []).length }}
        </UBadge>
      </div>

      <div class="column-body relative flex-1 min-h-0">
        <div 
          v-if="(columns[stage.key] || []).length === 0" 
          class="empty-state absolute inset-0 flex items-center justify-center text-sm text-gray-400 pointer-events-none"
        >
          No {{ itemLabelPlural.toLowerCase() }}
        </div>

        <VueDraggable
          v-if="columns[stage.key]"
          v-model="columns[stage.key]"
          :group="{ name: 'items' }"
          :animation="200"
          ghost-class="ghost-card"
          filter=".action-btn"
          :prevent-on-filter="false"
          class="column-content h-full overflow-y-auto"
          @change="(event) => onColumnChange(event, stage.key)"
        >
          <div
            v-for="item in columns[stage.key]"
            :key="item.id"
            class="mb-3"
          >
            <ItemCard 
              :item="item"
              @edit="handleEdit"
              @delete="handleDelete"
              @click="handleClick"
            />
          </div>
        </VueDraggable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { Item, Stage } from '~/types'

const props = defineProps<{
  items: Item[]
  stages: Stage[]
}>()

const emit = defineEmits<{
  updateStage: [id: number | string, toStage: string, fromStage: string]
  edit: [item: Item]
  delete: [id: number | string]
  click: [item: Item]
}>()

import { pluralize } from '~/utils/pluralize'

const { settings } = useSettings()
const itemLabelPlural = computed(() => pluralize(settings.value.itemLabel))

const columns = ref<Record<string, Item[]>>({})

watch(() => [props.items, props.stages], () => {
  const currentItemMap = new Map(props.items.map(item => [item.id, item]))
  
  props.stages.forEach(stage => {
    if (!columns.value[stage.key]) {
      columns.value[stage.key] = []
    }
  })

  const stageKeys = new Set(props.stages.map(s => s.key))
  Object.keys(columns.value).forEach(key => {
    if (!stageKeys.has(key)) {
      delete columns.value[key]
    }
  })

  props.stages.forEach(stage => {
    const itemsInStage = props.items.filter(item => item.stage === stage.key)
    const currentColumn = columns.value[stage.key]

    const idsMatch = currentColumn.length === itemsInStage.length && 
                   currentColumn.every((item, i) => item.id === itemsInStage[i].id)
    
    const dataChanged = currentColumn.some(item => {
      const live = currentItemMap.get(item.id)
      return live && (
        live.name !== item.name ||
        live.notes !== item.notes ||
        live.stage !== item.stage ||
        live.last_event_preview !== item.last_event_preview
      )
    })

    if (!idsMatch || dataChanged) {
      columns.value[stage.key] = itemsInStage
    }
  })
}, { immediate: true, deep: true })

const DRAG_DATA_KEY = 'application-tracker/item-id'

const onNativeDrop = (e: DragEvent, stageKey: string) => {
  const idStr = e.dataTransfer?.getData(DRAG_DATA_KEY)
  if (!idStr) return
  const id = idStr
  if (!id) return
  const item = props.items.find(a => String(a.id) === id)
  if (item && item.stage !== stageKey) {
    emit('updateStage', id, stageKey, item.stage)
  }
}

const onColumnChange = (event: any, stageKey: string) => {
  if (event.added) {
    const newIndex = event.added.newIndex as number
    const column = columns.value[stageKey]
    const item = column?.[newIndex] as Item | undefined
    if (item && item.stage !== stageKey) {
      emit('updateStage', item.id, stageKey, item.stage)
    }
  }
}

const handleEdit = (item: Item) => {
  emit('edit', item)
}

const handleDelete = (id: number | string) => {
  emit('delete', id)
}

const handleClick = (item: Item) => {
  emit('click', item)
}
</script>

<style scoped>
.kanban-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
  height: calc(100vh - 120px);
}

.kanban-column {
  display: flex;
  flex-direction: column;
  background: rgb(var(--color-gray-50));
  border-radius: 0.75rem;
  padding: 0;
  min-height: 0;
  overflow: hidden;
}

.dark .kanban-column {
  background: rgb(var(--color-gray-900));
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 2px solid rgb(var(--color-gray-200));
}

.dark .column-header {
  border-bottom-color: rgb(var(--color-gray-800));
}

.column-content {
  min-height: 100%;
  padding: 1rem;
}

.column-content::-webkit-scrollbar {
  width: 4px;
}

.column-content::-webkit-scrollbar-track {
  background: transparent;
}

.column-content::-webkit-scrollbar-thumb {
  background-color: rgb(var(--color-gray-300));
  border-radius: 20px;
}

.dark .column-content::-webkit-scrollbar-thumb {
  background-color: rgb(var(--color-gray-700));
}

.ghost-card {
  opacity: 0.5;
  background: rgb(var(--color-gray-100));
  border: 2px dashed rgb(var(--color-gray-300));
}

.dark .ghost-card {
  background: rgb(var(--color-gray-800));
  border-color: rgb(var(--color-gray-600));
}

.sortable-drag {
  cursor: grabbing;
}

@media (max-width: 768px) {
  .kanban-board {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .column-content {
    max-height: 400px;
  }
}
</style>
