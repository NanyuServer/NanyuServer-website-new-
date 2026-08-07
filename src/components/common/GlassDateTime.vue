<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '选择日期时间' },
  dateOnly: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'open'])

const open = ref(false)
const wrapRef = ref(null)
const triggerRef = ref(null)
const panelStyle = ref({})
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())
const selectedDay = ref('')
const hour = ref('12')
const minute = ref('00')

const openYearDrop = ref(false)
const openMonthDrop = ref(false)

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
const WEEKDAYS = ['一','二','三','四','五','六','日']

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

const yearList = computed(() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 9 }, (_, i) => y - 4 + i)
})

const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1)
  let start = firstDay.getDay() - 1
  if (start < 0) start = 6
  const days = []
  const prevMonthDays = new Date(viewYear.value, viewMonth.value, 0).getDate()
  for (let i = start - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, current: false, date: '' })
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

const todayStr = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
})

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}
function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

function selectYear(y) {
  viewYear.value = y
  openYearDrop.value = false
}
function selectMonth(m) {
  viewMonth.value = m
  openMonthDrop.value = false
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

function updatePanelPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const panelHeight = props.dateOnly ? 420 : 560
  const spaceBelow = window.innerHeight - rect.bottom
  const openUp = spaceBelow < panelHeight + 8 && rect.top > panelHeight

  panelStyle.value = {
    position: 'fixed',
    left: rect.left + 'px',
    width: Math.min(320, window.innerWidth - 32) + 'px',
    zIndex: 20000,
    ...(openUp
      ? { bottom: (window.innerHeight - rect.top + 8) + 'px' }
      : { top: (rect.bottom + 8) + 'px' }
    )
  }
}

function toggle() {
  open.value = !open.value
  openYearDrop.value = false
  openMonthDrop.value = false
  if (open.value) emit('open')
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
  if (open.value) nextTick(updatePanelPosition)
}

function onClickOutside(e) {
  if (!e.target.closest('.gdt-wrap')) {
    open.value = false
    openYearDrop.value = false
    openMonthDrop.value = false
  }
}

function onScroll() {
  if (open.value) updatePanelPosition()
}

watch(open, (v) => {
  if (v) document.addEventListener('click', onClickOutside, { once: true })
})

onMounted(() => {
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onScroll)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onScroll)
})

defineExpose({
  close() {
    open.value = false
    openYearDrop.value = false
    openMonthDrop.value = false
  }
})
</script>

<template>
  <div class="gdt-wrap" ref="wrapRef">
    <button ref="triggerRef" class="gdt-trigger" :class="{ open, placeholder: !displayValue }" @click.stop="toggle" type="button">
      <span>{{ displayValue || placeholder }}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
    </button>

    <Teleport to="body">
      <Transition name="gdt-drop">
        <div v-if="open" class="gdt-panel" :style="panelStyle" @click.stop>

          <!-- 年月自定义下拉 -->
          <div class="gdt-selectors">
            <!-- 年份选择器 -->
            <div class="gdt-sel-wrap">
              <button class="gdt-sel-trigger" @click.stop="openYearDrop = !openYearDrop; openMonthDrop = false" type="button">
                <span>{{ viewYear }}年</span>
                <svg class="gdt-sel-arrow" :class="{ open: openYearDrop }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <Transition name="gdt-drop-sm">
                <div v-if="openYearDrop" class="gdt-sel-dropdown" @click.stop>
                  <button
                    v-for="y in yearList" :key="y"
                    class="gdt-sel-option" :class="{ active: y === viewYear }"
                    @click.stop="selectYear(y)" type="button"
                  >{{ y }}年</button>
                </div>
              </Transition>
            </div>

            <!-- 月份选择器 -->
            <div class="gdt-sel-wrap">
              <button class="gdt-sel-trigger" @click.stop="openMonthDrop = !openMonthDrop; openYearDrop = false" type="button">
                <span>{{ MONTHS[viewMonth] }}</span>
                <svg class="gdt-sel-arrow" :class="{ open: openMonthDrop }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <Transition name="gdt-drop-sm">
                <div v-if="openMonthDrop" class="gdt-sel-dropdown" @click.stop>
                  <button
                    v-for="(m, i) in MONTHS" :key="i"
                    class="gdt-sel-option" :class="{ active: i === viewMonth }"
                    @click.stop="selectMonth(i)" type="button"
                  >{{ m }}</button>
                </div>
              </Transition>
            </div>
          </div>

          <!-- 翻页箭头 -->
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
              :class="{
                'other-month': !d.current,
                'selected': d.current && d.date === selectedDay,
                'today': d.date === todayStr && d.current
              }"
              @click="pickDay(d.date)"
              :disabled="!d.current"
              type="button"
            >{{ d.day }}</button>
          </div>

          <div v-if="!dateOnly" class="gdt-time">
            <div class="gdt-time-label">时间（24小时制）</div>
            <div class="gdt-time-inputs">
              <input
                type="number"
                class="gdt-time-input"
                min="0" max="23"
                :value="parseInt(hour)"
                @input="hour = String(Math.min(23, Math.max(0, parseInt($event.target.value) || 0))).padStart(2, '0')"
                placeholder="时"
              />
              <span class="gdt-time-sep">:</span>
              <input
                type="number"
                class="gdt-time-input"
                min="0" max="59"
                :value="parseInt(minute)"
                @input="minute = String(Math.min(59, Math.max(0, parseInt($event.target.value) || 0))).padStart(2, '0')"
                placeholder="分"
              />
            </div>
          </div>

          <div class="gdt-actions">
            <button class="gdt-btn" @click="clear" type="button">清除</button>
            <button v-if="!dateOnly" class="gdt-btn primary" @click="confirmTime" type="button">确定</button>
            <button v-else class="gdt-btn primary" @click="open = false" type="button">确定</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.gdt-wrap { position: relative; width: 100%; }

.gdt-trigger {
  width: 100%;
  display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
  font-family: var(--font-ui); font-size: 0.85rem;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  border: 1px solid rgba(179, 157, 219, 0.2);
  padding: 0.7rem 1rem;
  cursor: pointer; outline: none; text-align: left;
  -webkit-appearance: none; appearance: none;
  border-radius: var(--radius-pill, 100px);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.gdt-trigger.placeholder { color: var(--text-muted); opacity: 0.6; }
.gdt-trigger:focus, .gdt-trigger.open {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(179, 157, 219, 0.12), 0 4px 12px rgba(179, 157, 219, 0.08);
}
.gdt-trigger svg { color: var(--text-muted); flex-shrink: 0; }
</style>

<style>
.gdt-panel {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 16px 48px rgba(179, 157, 219, 0.15), 0 4px 12px rgba(0, 0, 0, 0.06);
  padding: 1rem;
  border-radius: var(--radius-lg, 24px);
}

/* ① 自定义下拉选择器 */
.gdt-selectors {
  display: flex; gap: 0.5rem;
  margin-bottom: 0.7rem;
}
.gdt-sel-wrap {
  flex: 1; position: relative;
}
.gdt-sel-trigger {
  width: 100%;
  display: flex; align-items: center; justify-content: space-between; gap: 0.4rem;
  font-family: var(--font-ui); font-size: 0.82rem;
  color: var(--text-primary);
  background: rgba(179, 157, 219, 0.06);
  border: 1px solid rgba(179, 157, 219, 0.15);
  padding: 0.5rem 0.7rem;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.gdt-sel-trigger:hover {
  background: rgba(179, 157, 219, 0.1);
  border-color: rgba(179, 157, 219, 0.3);
}
.gdt-sel-arrow {
  width: 14px; height: 14px; flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.gdt-sel-arrow.open { transform: rotate(180deg); }

.gdt-sel-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  max-height: 200px; overflow-y: auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(179, 157, 219, 0.12);
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(179, 157, 219, 0.12), 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 0.35rem;
  z-index: 20001;
}

.gdt-sel-dropdown::-webkit-scrollbar { width: 4px; }
.gdt-sel-dropdown::-webkit-scrollbar-track { background: transparent; }
.gdt-sel-dropdown::-webkit-scrollbar-thumb { background: rgba(179, 157, 219, 0.25); border-radius: 100px; }

.gdt-sel-option {
  display: block; width: 100%;
  text-align: left;
  font-family: var(--font-ui); font-size: 0.82rem;
  color: var(--text-secondary);
  background: transparent; border: none;
  padding: 0.55rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.gdt-sel-option:hover {
  background: rgba(179, 157, 219, 0.08);
  color: var(--text-primary);
}
.gdt-sel-option.active {
  background: var(--accent-dark);
  color: white;
  font-weight: 600;
}

/* 下拉动画 */
.gdt-drop-sm-enter-active { transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.gdt-drop-sm-leave-active { transition: opacity 0.12s ease-in, transform 0.12s ease-in; }
.gdt-drop-sm-enter-from, .gdt-drop-sm-leave-to {
  opacity: 0; transform: translateY(-4px) scale(0.97);
}

/* 头部 */
.gdt-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem;
}
.gdt-title {
  font-family: var(--font-title); font-size: 0.9rem; font-weight: 600; color: var(--text-primary);
}
.gdt-nav {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(179, 157, 219, 0.2);
  background: rgba(255, 255, 255, 0.5);
  color: var(--text-secondary); font-size: 1.1rem;
  cursor: pointer; transition: all 0.2s; border-radius: var(--radius-pill, 100px);
}
.gdt-nav:hover { border-color: rgba(179, 157, 219, 0.4); color: var(--text-primary); background: rgba(255, 255, 255, 0.8); }

.gdt-weekdays {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 0.4rem;
}
.gdt-weekdays span {
  text-align: center; font-size: 0.68rem; color: var(--text-muted); padding: 0.3rem 0;
}

.gdt-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.gdt-day {
  aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-ui); font-size: 0.8rem;
  color: var(--text-secondary);
  background: transparent; border: none; cursor: pointer;
  transition: all 0.2s; border-radius: 50%;
}
.gdt-day.other-month {
  color: rgba(149, 117, 205, 0.25) !important;
  background: transparent !important;
  cursor: default; pointer-events: none;
}
.gdt-day:not(.other-month):hover { background: rgba(179, 157, 219, 0.1); color: var(--text-primary); }
.gdt-day.selected:not(.other-month) {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent-primary));
  color: white !important; font-weight: 600;
}
.gdt-day.today:not(.selected):not(.other-month) {
  border: 1.5px solid rgba(179, 157, 219, 0.4); color: var(--accent-dark);
}

.gdt-time { margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px solid rgba(179, 157, 219, 0.12); }
.gdt-time-label { font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.5rem; }
.gdt-time-inputs {
  display: flex; align-items: center; gap: 0.3rem;
}
.gdt-time-input {
  width: 72px;
  font-family: var(--font-ui);
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  color: var(--text-primary);
  background: rgba(179, 157, 219, 0.06);
  border: 1px solid rgba(179, 157, 219, 0.15);
  padding: 0.5rem;
  border-radius: 10px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  -moz-appearance: textfield;
}
.gdt-time-input::-webkit-outer-spin-button,
.gdt-time-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.gdt-time-input:focus {
  border-color: var(--accent-dark);
  box-shadow: 0 0 0 3px rgba(179, 157, 219, 0.1);
}
.gdt-time-sep { font-size: 1.2rem; font-weight: 700; color: var(--text-muted); }

.gdt-actions {
  display: flex; justify-content: flex-end; gap: 0.5rem;
  margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px solid rgba(179, 157, 219, 0.1);
}
.gdt-btn {
  font-family: var(--font-ui); font-size: 0.78rem; padding: 0.45rem 1rem;
  border: 1px solid rgba(179, 157, 219, 0.2);
  background: rgba(255, 255, 255, 0.5); color: var(--text-secondary);
  cursor: pointer; transition: all 0.2s; border-radius: var(--radius-pill, 100px);
}
.gdt-btn:hover { border-color: rgba(179, 157, 219, 0.4); color: var(--text-primary); background: rgba(255, 255, 255, 0.8); }
.gdt-btn.primary { background: var(--accent-dark); border-color: transparent; color: white; }
.gdt-btn.primary:hover { background: var(--accent-deep); }

.gdt-drop-enter-active { transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.gdt-drop-leave-active { transition: opacity 0.15s ease-in, transform 0.15s ease-in; }
.gdt-drop-enter-from, .gdt-drop-leave-to { opacity: 0; transform: translateY(-8px) scale(0.96); }
</style>
