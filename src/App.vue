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
  <!-- 浮动气泡装饰层 -->
  <div class="bubble-layer">
    <div class="bubble bubble-1" />
    <div class="bubble bubble-2" />
    <div class="bubble bubble-3" />
    <div class="bubble bubble-4" />
    <div class="bubble bubble-5" />
    <div class="bubble bubble-6" />
  </div>
  <div class="ring-deco ring-1" />
  <div class="ring-deco ring-2" />
  <AppNavbar v-if="!isAdmin" />
  <router-view />
  <AppFooter v-if="!isAdmin" />
  <ToastContainer />
</template>
