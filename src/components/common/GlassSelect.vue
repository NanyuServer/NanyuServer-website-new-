<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' }
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const dropdownRef = ref(null)
const selectedLabel = computed(() => {
  const found = props.options.find(o => (o.value ?? o) === props.modelValue)
  return found ? (found.label ?? found) : ''
})

function select(val) {
  emit('update:modelValue', val)
  open.value = false
}

function toggle() { open.value = !open.value }

function onClickOutside(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div class="gs-wrap" ref="dropdownRef">
    <button class="gs-trigger" :class="{ open, placeholder: !selectedLabel }" @click="toggle" type="button">
      <span>{{ selectedLabel || placeholder }}</span>
      <svg class="gs-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
    </button>
    <Transition name="gs-drop">
      <div v-if="open" class="gs-dropdown">
        <button
          v-for="opt in options"
          :key="opt.value ?? opt"
          class="gs-option"
          :class="{ active: (opt.value ?? opt) === modelValue }"
          @click="select(opt.value ?? opt)"
          type="button"
        >
          {{ opt.label ?? opt }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.gs-wrap {
  position: relative;
  width: 100%;
}

.gs-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-family: var(--font-ui);
  font-size: 0.85rem;
  color: var(--text-primary);
  background: rgba(15, 10, 26, 0.6);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  border: 1px solid rgba(123, 85, 212, 0.3);
  padding: 0.7rem 1rem;
  cursor: pointer;
  transition: border-color 0.3s, box-shadow 0.3s;
  outline: none;
  text-align: left;
  -webkit-appearance: none;
  appearance: none;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='2' y='2' width='96' height='96' rx='22' ry='22' fill='white'/%3E%3C/svg%3E");
  mask-size: 100% 100%;
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='2' y='2' width='96' height='96' rx='22' ry='22' fill='white'/%3E%3C/svg%3E");
  -webkit-mask-size: 100% 100%;
}

.gs-trigger.placeholder {
  color: var(--text-muted);
  opacity: 0.6;
}

.gs-trigger:focus, .gs-trigger.open {
  border-color: var(--accent-light);
  box-shadow: 0 0 0 3px rgba(179, 136, 255, 0.15), 0 0 20px rgba(179, 136, 255, 0.08);
}

.gs-arrow {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.25s var(--ease-out);
}
.gs-trigger.open .gs-arrow {
  transform: rotate(180deg);
}

.gs-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 9000;
  background: rgba(20, 12, 40, 0.95);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(179, 136, 255, 0.25);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5), 0 0 24px rgba(179, 136, 255, 0.08);
  padding: 0.35rem;
  max-height: 260px;
  overflow-y: auto;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='1' y='1' width='98' height='98' rx='20' ry='20' fill='white'/%3E%3C/svg%3E");
  mask-size: 100% 100%;
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='1' y='1' width='98' height='98' rx='20' ry='20' fill='white'/%3E%3C/svg%3E");
  -webkit-mask-size: 100% 100%;
}

.gs-option {
  display: block;
  width: 100%;
  text-align: left;
  font-family: var(--font-ui);
  font-size: 0.85rem;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
  border-radius: 12px;
}
.gs-option:hover {
  color: var(--text-primary);
  background: rgba(179, 136, 255, 0.12);
}
.gs-option.active {
  color: var(--accent-gold);
  background: rgba(179, 136, 255, 0.18);
}

.gs-drop-enter-active { transition: opacity 0.2s var(--ease-out), transform 0.2s var(--ease-out); }
.gs-drop-leave-active { transition: opacity 0.15s ease-in, transform 0.15s ease-in; }
.gs-drop-enter-from, .gs-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

.gs-dropdown::-webkit-scrollbar { width: 4px; }
.gs-dropdown::-webkit-scrollbar-track { background: transparent; }
.gs-dropdown::-webkit-scrollbar-thumb { background: rgba(123, 85, 212, 0.3); border-radius: 100px; }
</style>
