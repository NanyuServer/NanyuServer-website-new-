<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import CustomCursor from '@/components/common/CustomCursor.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const route = useRoute()
const isAdmin = computed(() => route.path === '/admin')
</script>

<template>
  <CustomCursor />
  <AppNavbar v-if="!isAdmin" />
  <router-view v-slot="{ Component }">
    <transition name="page-fade" mode="out-in">
      <main :key="route.path" :class="{ 'admin-main': isAdmin }">
        <component :is="Component" />
      </main>
    </transition>
  </router-view>
  <AppFooter v-if="!isAdmin" />
  <ToastContainer />
</template>

<style scoped>
.admin-main {
  min-height: 100vh;
}

.page-fade-enter-active {
  transition: opacity 0.35s var(--ease-out), transform 0.35s var(--ease-out);
}
.page-fade-leave-active {
  transition: opacity 0.2s ease-in;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-fade-leave-to {
  opacity: 0;
}
</style>
