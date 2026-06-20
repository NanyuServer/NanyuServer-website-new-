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
  <router-view />
  <AppFooter v-if="!isAdmin" />
  <ToastContainer />
</template>
