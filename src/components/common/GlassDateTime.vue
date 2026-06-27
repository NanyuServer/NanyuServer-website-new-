<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '选择日期时间' },
  dateOnly: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())
const selectedDay = ref('')
const hour = ref('12')
const minute = ref('00')

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
const WEEKDAYS = ['一','二','三','四','五','六','日']

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1)
  let start = firstDay.getDay() - 1
  if (start < 0) start = 6
  const days = []
  const prevMonth = new Date(viewYear.value, viewMonth.value, 0)
  for (let i = start - 1; i >= 0; i--) {
    days.push({ day: prevMonth.getDate() - i, current: false, date: '' })
  }
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ day: d, current: true, date: ds })
  }
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    days.push({ day: d, current: false, date: '' })
  }
  return days
})

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  return props.modelValue
})

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}
function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

function pickDay(date) {
  if (!date) return
  selectedDay.value = date
  if (props.dateOnly) {
    emit('update:modelValue', date)
    open.value = false
  }
}

function confirmTime() {
  if (!selectedDay.value) return
  const val = `${selectedDay.value} ${hour.value}:${minute.value}`
  emit('update:modelValue', val)
  open.value = false
}

function clear() {
  emit('update:modelValue', '')
  selectedDay.value = ''
  open.value = false
}

function toggle() {
  open.value = !open.value
  if (open.value && props.modelValue) {
    const parts = props.modelValue.split(' ')
    if (parts[0]) {
      const [y, m, d] = parts[0].split('-')
      viewYear.value = parseInt(y)
      viewMonth.value = parseInt(m) - 1
      selectedDay.value = parts[0]
    }
    if (parts[1] && !props.dateOnly) {
      const [h, mi] = parts[1].split(':')
      hour.value = h
      minute.value = mi
    }
  }
}

function onClickOutside(e) {
  if (!e.target.closest('.gdt-wrap')) open.value = false
}

watch(open, (v) => {
  if (v) document.addEventListener('click', onClickOutside, { once: true })
})
</script>

<template>
  <div class="gdt-wrap">
    <button class="gdt-trigger" :class="{ open, placeholder: !displayValue }" @click.stop="toggle" type="button">
      <span>{{ displayValue || placeholder }}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
    </button>

    <Transition name="gdt-drop">
      <div v-if="open" class="gdt-panel" @click.stop>
        <div class="gdt-header">
          <button class="gdt-nav" @click="prevMonth" type="button">‹</button>
          <span class="gdt-title">{{ viewYear }}年 {{ MONTHS[viewMonth] }}</span>
          <button class="gdt-nav" @click="nextMonth" type="button">›</button>
        </div>

        <div class="gdt-weekdays">
          <span v-for="w in WEEKDAYS" :key="w">{{ w }}</span>
        </div>

        <div class="gdt-grid">
          <button
            v-for="(d, i) in calendarDays" :key="i"
            class="gdt-day"
            :class="{ other: !d.current, selected: d.date === selectedDay, today: d.date === new Date().toISOString().slice(0, 10) }"
            @click="pickDay(d.date)"
            :disabled="!d.current"
            type="button"
          >{{ d.day }}</button>
        </div>

        <div v-if="!dateOnly" class="gdt-time">
          <div class="gdt-time-label">时间</div>
          <div class="gdt-time-cols">
            <div class="gdt-time-col">
              <button v-for="h in hours" :key="h" class="gdt-time-btn" :class="{ active: h === hour }" @click="hour = h" type="button">{{ h }}</button>
            </div>
            <span class="gdt-time-sep">:</span>
            <div class="gdt-time-col">
              <button v-for="m in minutes" :key="m" class="gdt-time-btn" :class="{ active: m === minute }" @click="minute = m" type="button">{{ m }}</button>
            </div>
          </div>
        </div>

        <div class="gdt-actions">
          <button class="gdt-btn" @click="clear" type="button">清除</button>
          <button v-if="!dateOnly" class="gdt-btn primary" @click="confirmTime" type="button">确定</button>
          <button v-else class="gdt-btn primary" @click="open = false" type="button">确定</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.gdt-wrap {
  position: relative;
  width: 100%;
}

.gdt-trigger {
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
  border-radius: var(--radius-sm, 8px);
}
.gdt-trigger.placeholder { color: var(--text-muted); opacity: 0.6; }
.gdt-trigger:focus, .gdt-trigger.open {
  border-color: var(--accent-light);
  box-shadow: 0 0 0 3px rgba(179, 136, 255, 0.15), 0 0 20px rgba(179, 136, 255, 0.08);
}
.gdt-trigger svg { color: var(--text-muted); flex-shrink: 0; }

.gdt-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 9000;
  width: min(320px, calc(100vw - 2rem));
  background: rgba(20, 12, 40, 0.97);
  backdrop-filter: blur(28px) saturate(200%);
  -webkit-backdrop-filter: blur(28px) saturate(200%);
  border: 1px solid rgba(179, 136, 255, 0.25);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(179, 136, 255, 0.08);
  padding: 1rem;
  border-radius: var(--radius-lg, 24px);
}

.gdt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}
.gdt-title {
  font-family: var(--font-title);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}
.gdt-nav {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(123, 85, 212, 0.2);
  background: transparent;
  color: var(--text-secondary);
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: var(--radius-sm, 8px);
}
.gdt-nav:hover { border-color: var(--accent-light); color: var(--text-primary); }

.gdt-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 0.4rem;
}
.gdt-weekdays span {
  text-align: center;
  font-size: 0.68rem;
  color: var(--text-muted);
  padding: 0.3rem 0;
}

.gdt-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.gdt-day {
  aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-ui);
  font-size: 0.8rem;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 50%;
}
.gdt-day.other {
  color: rgba(158, 139, 191, 0.3);
  background: transparent;
  cursor: default;
  border-radius: 50%;
}
.gdt-day:hover:not(.other) { background: rgba(179, 136, 255, 0.15); color: var(--text-primary); }
.gdt-day.selected {
  background: linear-gradient(135deg, rgba(75, 47, 163, 0.7), rgba(168, 127, 232, 0.5));
  color: white;
  font-weight: 600;
}
.gdt-day.today:not(.selected) {
  border: 1px solid rgba(179, 136, 255, 0.4);
  color: var(--accent-light);
}

.gdt-time {
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid rgba(123, 85, 212, 0.15);
}
.gdt-time-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}
.gdt-time-cols {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}
.gdt-time-col {
  flex: 1;
  max-height: 120px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.gdt-time-sep {
  font-size: 1.2rem;
  color: var(--text-muted);
  padding-top: 0.3rem;
}
.gdt-time-btn {
  font-family: var(--font-ui);
  font-size: 0.8rem;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  border-radius: 8px;
}
.gdt-time-btn:hover { background: rgba(179, 136, 255, 0.12); color: var(--text-primary); }
.gdt-time-btn.active {
  background: rgba(75, 47, 163, 0.5);
  color: white;
  font-weight: 600;
}

.gdt-time-col::-webkit-scrollbar { width: 3px; }
.gdt-time-col::-webkit-scrollbar-track { background: transparent; }
.gdt-time-col::-webkit-scrollbar-thumb { background: rgba(123, 85, 212, 0.3); border-radius: 100px; }

.gdt-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid rgba(123, 85, 212, 0.15);
}
.gdt-btn {
  font-family: var(--font-ui);
  font-size: 0.78rem;
  padding: 0.45rem 1rem;
  border: 1px solid rgba(123, 85, 212, 0.25);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 8px;
}
.gdt-btn:hover { border-color: var(--accent-light); color: var(--text-primary); }
.gdt-btn.primary {
  background: rgba(75, 47, 163, 0.5);
  border-color: rgba(179, 136, 255, 0.3);
  color: white;
}

.gdt-drop-enter-active { transition: opacity 0.25s var(--ease-out), transform 0.25s var(--ease-out); }
.gdt-drop-leave-active { transition: opacity 0.15s ease-in, transform 0.15s ease-in; }
.gdt-drop-enter-from, .gdt-drop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}
</style>
