<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' }
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const wrapRef = ref(null)
const triggerRef = ref(null)
const dropStyle = ref({})
const selectedLabel = computed(() => {
  const found = props.options.find(o => (o.value ?? o) === props.modelValue)
  return found ? (found.label ?? found) : ''
})

function select(val) {
  emit('update:modelValue', val)
  open.value = false
}

function toggle() {
  open.value = !open.value
  if (open.value) nextTick(updateDropPosition)
}

function updateDropPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const dropHeight = Math.min(props.options.length * 38 + 12, 260)
  const openUp = spaceBelow < dropHeight + 8 && rect.top > dropHeight

  dropStyle.value = {
    position: 'fixed',
    left: rect.left + 'px',
    width: rect.width + 'px',
    zIndex: 20000,
    ...(openUp
      ? { bottom: (window.innerHeight - rect.top + 6) + 'px' }
      : { top: (rect.bottom + 6) + 'px' }
    )
  }
}

function onClickOutside(e) {
  if (wrapRef.value && !wrapRef.value.contains(e.target)) {
    open.value = false
  }
}

function onScroll() {
  if (open.value) updateDropPosition()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onScroll)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <div class="gs-wrap" ref="wrapRef">
    <button ref="triggerRef" class="gs-trigger" :class="{ open, placeholder: !selectedLabel }" @click="toggle" type="button">
      <span>{{ selectedLabel || placeholder }}</span>
      <svg class="gs-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9" /></svg>
    </button>
    <Teleport to="body">
      <Transition name="gs-drop">
        <div v-if="open" class="gs-dropdown" :style="dropStyle">
          <button
            v-for="opt in options"
            :key="opt.value ?? opt"
            class="gs-option"
            :class="{ active: (opt.value ?? opt) === modelValue }"
            @click.stop="select(opt.value ?? opt)"
            type="button"
          >
            {{ opt.label ?? opt }}
          </button>
        </div>
      </Transition>
    </Teleport>
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
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  border: 1px solid rgba(179, 157, 219, 0.2);
  padding: 0.7rem 1rem;
  cursor: pointer;
  transition: border-color var(--transition-fast, 0.2s), box-shadow var(--transition-fast, 0.2s);
  outline: none;
  text-align: left;
  -webkit-appearance: none;
  appearance: none;
  border-radius: var(--radius-pill, 100px);
}

.gs-trigger.placeholder {
  color: var(--text-muted);
  opacity: 0.6;
}

.gs-trigger:focus, .gs-trigger.open {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(179, 157, 219, 0.12), 0 4px 12px rgba(179, 157, 219, 0.08);
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
</style>

<style>
.gs-dropdown {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 12px 40px rgba(179, 157, 219, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.06);
  padding: 0.35rem;
  max-height: 260px;
  overflow-y: auto;
  border-radius: var(--radius-md, 16px);
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
  transition: color var(--transition-fast, 0.2s), background var(--transition-fast, 0.2s);
  border-radius: 10px;
}
.gs-option:hover {
  color: var(--text-primary);
  background: rgba(179, 157, 219, 0.08);
}
.gs-option.active {
  color: var(--accent-dark);
  background: rgba(179, 157, 219, 0.12);
  font-weight: 600;
}

.gs-drop-enter-active { transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.gs-drop-leave-active { transition: opacity 0.15s ease-in, transform 0.15s ease-in; }
.gs-drop-enter-from, .gs-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

.gs-dropdown::-webkit-scrollbar { width: 4px; }
.gs-dropdown::-webkit-scrollbar-track { background: transparent; }
.gs-dropdown::-webkit-scrollbar-thumb { background: rgba(179, 157, 219, 0.25); border-radius: 100px; }
</style>
