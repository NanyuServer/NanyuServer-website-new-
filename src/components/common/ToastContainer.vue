<script setup>
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item"
          :class="'toast-' + toast.type"
        >
          {{ toast.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toast-item {
  padding: 0.85rem 1.4rem;
  border-radius: 14px;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  box-shadow: 0 8px 24px rgba(179, 157, 219, 0.15), 0 2px 8px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.toast-success {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(102, 187, 106, 0.3);
  color: #2e7d32;
}

.toast-error {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(239, 83, 80, 0.3);
  color: #c62828;
}

.toast-enter-active {
  transition: all 0.35s var(--ease-out);
}
.toast-leave-active {
  transition: all 0.25s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(20px) translateX(10px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
