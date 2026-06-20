<script setup>
defineProps({
  show: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-content glass-card">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 4, 18, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 1rem;
}

.modal-content {
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 0;
  border-radius: var(--radius-lg);
  position: relative;
}

.modal-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #4c2fa3, #a87fe8, #e86fa3, #e8c97a);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.modal-enter-active {
  transition: opacity 0.35s var(--ease-out), transform 0.35s var(--ease-out);
}
.modal-leave-active {
  transition: opacity 0.25s ease-in, transform 0.25s ease-in;
}
.modal-enter-from {
  opacity: 0;
}
.modal-enter-from .modal-content {
  transform: translateY(20px) scale(0.96);
}
.modal-leave-to {
  opacity: 0;
}
.modal-leave-to .modal-content {
  transform: translateY(10px) scale(0.98);
}
</style>
