<template>
  <div>
    <NuxtPage />
    <UNotifications />
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Trackboard',
  meta: [
    { name: 'description', content: 'Local-first kanban board for tracking anything — jobs, leads, properties, projects' }
  ]
})
</script>
