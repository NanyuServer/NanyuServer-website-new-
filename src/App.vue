<script setup>
import { useRoute } from 'vue-router'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import CustomCursor from '@/components/common/CustomCursor.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const route = useRoute()
const isAdminRoute = () => route.path === '/admin'
</script>

<template>
  <CustomCursor />
  <AppNavbar v-if="!isAdminRoute()" />
  <main :class="{ 'admin-main': isAdminRoute() }">
    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
  <AppFooter v-if="!isAdminRoute()" />
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
