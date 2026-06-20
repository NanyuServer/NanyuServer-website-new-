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
  border-radius: 12px;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.toast-success {
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(16, 185, 129, 0.15));
  border: 1px solid rgba(52, 211, 153, 0.4);
  color: var(--color-success);
}

.toast-error {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.2), rgba(239, 68, 68, 0.15));
  border: 1px solid rgba(248, 113, 113, 0.4);
  color: var(--color-error);
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
