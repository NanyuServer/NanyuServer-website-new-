<script setup>
import { ref, computed, onMounted } from 'vue'
import { submissionsApi } from '@/services/api'
import GlassSelect from '@/components/common/GlassSelect.vue'
import GlassDateTime from '@/components/common/GlassDateTime.vue'

const allData = ref([])
const filteredData = ref([])
const loading = ref(true)
const loadError = ref('')
const currentPage = ref(1)
const sortOrder = ref('desc')
const PAGE_SIZE = 10

const dateStart = ref('')
const dateEnd = ref('')
const typeFilter = ref('')
const keywordFilter = ref('')

const types = ['寻物启事', '表白', '挂人', '扩列', '吐槽', '交易', '捞人、物', '打听资讯', '寻找搭子', '有啥说啥']
const typeOptions = [{ value: '', label: '全部类型' }, ...types.map(t => ({ value: t, label: t }))]

const typeEmojiMap = {
  '寻物启事': '🔍', '表白': '💌', '挂人': '⚠️', '扩列': '🤝',
  '吐槽': '💬', '交易': '💰', '捞人、物': '🎣', '打听资讯': '❓', '寻找搭子': '👫', '有啥说啥': '🗣️'
}

const totalPages = computed(() => Math.ceil(filteredData.value.length / PAGE_SIZE))
const pageData = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredData.value.slice(start, start + PAGE_SIZE)
})
const resultsText = computed(() => {
  if (loading.value) return '正在加载…'
  return `共 ${filteredData.value.length} 条稿件`
})

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function sortData() {
  filteredData.value.sort((a, b) => {
    const da = new Date(a.created_at), db = new Date(b.created_at)
    return sortOrder.value === 'desc' ? db - da : da - db
  })
}

function applyFilter() {
  filteredData.value = allData.value.filter(item => {
    const d = new Date(item.created_at)
    if (dateStart.value && d < new Date(dateStart.value)) return false
    if (dateEnd.value && d > new Date(dateEnd.value + 'T23:59:59')) return false
    if (typeFilter.value && item.type !== typeFilter.value) return false
    if (keywordFilter.value && !item.content.toLowerCase().includes(keywordFilter.value.toLowerCase())) return false
    return true
  })
  sortData()
  currentPage.value = 1
}

function resetFilter() {
  dateStart.value = ''
  dateEnd.value = ''
  typeFilter.value = ''
  keywordFilter.value = ''
  filteredData.value = [...allData.value]
  sortData()
  currentPage.value = 1
}

function setSort(order) {
  sortOrder.value = order
  sortData()
  currentPage.value = 1
}

function goPage(n) {
  currentPage.value = n
  window.scrollTo({ top: document.querySelector('.results-section')?.offsetTop - 80, behavior: 'smooth' })
}

onMounted(async () => {
  try {
    const json = await submissionsApi.getAll()
    const data = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : [])
    allData.value = data
    filteredData.value = [...data]
    sortData()
    if (!data.length) loadError.value = ''
  } catch (e) {
    console.warn('加载失败:', e)
    loadError.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-hero">
    <div class="page-orb" />
    <div class="page-hero-content">
      <div class="page-label">投稿记录</div>
      <h1 class="page-title">稿件查询</h1>
      <p class="page-sub">查找已审核发布的投稿内容，支持按时间与类型筛选</p>
    </div>
  </div>

  <div class="filter-section">
    <div class="filter-bar">
      <div class="filter-group">
        <div class="filter-label">开始时间</div>
        <GlassDateTime v-model="dateStart" placeholder="选择开始日期" date-only />
      </div>
      <div class="filter-group">
        <div class="filter-label">结束时间</div>
        <GlassDateTime v-model="dateEnd" placeholder="选择结束日期" date-only />
      </div>
      <div class="filter-group">
        <div class="filter-label">投稿类型</div>
        <GlassSelect v-model="typeFilter" :options="typeOptions" placeholder="全部类型" />
      </div>
      <div class="filter-group">
        <div class="filter-label">内容关键词</div>
        <input type="text" class="glass-input" v-model="keywordFilter" placeholder="输入关键词搜索" />
      </div>
      <button class="glass-btn glass-btn-primary glass-btn-sm" @click="applyFilter">搜索</button>
      <button class="glass-btn glass-btn-ghost glass-btn-sm" @click="resetFilter">重置</button>
    </div>
  </div>

  <div class="results-section">
    <div class="results-meta">
      <div class="results-count">{{ resultsText }}</div>
      <div class="results-sort">
        <button
          class="sort-btn"
          :class="{ active: sortOrder === 'desc' }"
          @click="setSort('desc')"
        >最新优先</button>
        <button
          class="sort-btn"
          :class="{ active: sortOrder === 'asc' }"
          @click="setSort('asc')"
        >最早优先</button>
      </div>
    </div>

    <div class="cards-grid">
      <template v-if="loading">
        <div class="state-box">
          <div class="spinner" />
          <div class="state-title">正在加载稿件</div>
          <div class="state-sub">请稍候…</div>
        </div>
      </template>
      <template v-else-if="pageData.length">
        <div
          v-for="(item, i) in pageData"
          :key="item.id"
          class="submission-card"
          :style="{ animationDelay: (i * 60) + 'ms' }"
        >
          <div class="card-header">
            <span class="card-type-badge" :class="'type-' + item.type">
              {{ typeEmojiMap[item.type] || '📄' }} {{ item.type }}
            </span>
            <span class="card-time">{{ formatDate(item.created_at) }}</span>
          </div>
          <div class="card-content">{{ item.content }}</div>
        </div>
      </template>
      <template v-else>
        <div class="state-box">
          <div class="state-icon">🔍</div>
          <div class="state-title">暂无符合条件的稿件</div>
          <div class="state-sub">请尝试调整筛选条件</div>
        </div>
      </template>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button v-if="currentPage > 1" class="page-btn" @click="goPage(currentPage - 1)">‹</button>
      <template v-for="i in totalPages" :key="i">
        <button
          v-if="i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1"
          class="page-btn"
          :class="{ active: i === currentPage }"
          @click="goPage(i)"
        >{{ i }}</button>
        <span v-else-if="Math.abs(i - currentPage) === 2" class="page-ellipsis">…</span>
      </template>
      <button v-if="currentPage < totalPages" class="page-btn" @click="goPage(currentPage + 1)">›</button>
    </div>
  </div>
</template>

<style scoped>
.filter-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 2rem 1rem;
  overflow: visible;
  position: relative;
  z-index: 10;
}
.filter-bar {
  padding: 1.6rem 2rem;
  display: flex;
  gap: 1.2rem;
  align-items: flex-end;
  flex-wrap: wrap;
  overflow: visible;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(179, 157, 219, 0.2);
  border-radius: var(--radius-lg, 24px);
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1;
  min-width: 160px;
}
.filter-label {
  font-family: var(--font-ui);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  color: var(--accent-dark);
}

.results-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem 5rem;
  position: relative;
  z-index: 1;
}
.results-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}
.results-count {
  font-family: var(--font-ui);
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.results-sort {
  display: flex;
  gap: 0.5rem;
}
.sort-btn {
  font-family: var(--font-ui);
  font-size: 0.75rem;
  padding: 0.4rem 0.9rem;
  border-radius: var(--radius-pill, 100px);
  border: 1px solid rgba(179, 157, 219, 0.3);
  background: rgba(255, 255, 255, 0.5);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast, 0.2s cubic-bezier(0.16, 1, 0.3, 1));
}
.sort-btn.active, .sort-btn:hover {
  background: rgba(179, 157, 219, 0.2);
  border-color: rgba(126, 87, 194, 0.4);
  color: var(--accent-dark);
}

.cards-grid {
  display: grid;
  gap: 1rem;
}
.submission-card {
  padding: 1.6rem 1.8rem;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px) saturate(200%);
  -webkit-backdrop-filter: blur(20px) saturate(200%);
  border: 1px solid rgba(179, 157, 219, 0.18);
  border-radius: var(--radius-lg, 24px);
  animation: cardIn 0.5s var(--ease-out) forwards;
  opacity: 0;
  transform: translateY(16px);
  transition: border-color var(--transition-fast, 0.2s), box-shadow var(--transition-fast, 0.2s);
}
.submission-card:hover {
  border-color: rgba(179, 157, 219, 0.35);
  box-shadow: 0 4px 16px rgba(81, 45, 168, 0.08);
}
@keyframes cardIn {
  to { opacity: 1; transform: none; }
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.9rem;
  gap: 1rem;
}
.card-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-ui);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-pill, 100px);
  border: 1px solid;
  white-space: nowrap;
}
.type-寻物启事 { color: #26a69a; border-color: rgba(38, 166, 154, 0.35); background: rgba(38, 166, 154, 0.08); }
.type-表白 { color: #d81b60; border-color: rgba(216, 27, 96, 0.25); background: rgba(216, 27, 96, 0.06); }
.type-挂人 { color: #e53935; border-color: rgba(229, 57, 53, 0.25); background: rgba(229, 57, 53, 0.06); }
.type-扩列 { color: #7E57C2; border-color: rgba(126, 87, 194, 0.3); background: rgba(126, 87, 194, 0.06); }
.type-吐槽 { color: #f9a825; border-color: rgba(249, 168, 37, 0.3); background: rgba(249, 168, 37, 0.06); }
.type-交易 { color: #43a047; border-color: rgba(67, 160, 71, 0.3); background: rgba(67, 160, 71, 0.06); }
.type-捞人、物 { color: #1e88e5; border-color: rgba(30, 136, 229, 0.3); background: rgba(30, 136, 229, 0.06); }
.type-打听资讯 { color: #f57f17; border-color: rgba(245, 127, 23, 0.3); background: rgba(245, 127, 23, 0.06); }
.type-寻找搭子 { color: #c2185b; border-color: rgba(194, 24, 91, 0.25); background: rgba(194, 24, 91, 0.06); }
.type-有啥说啥 { color: #5C4B8A; border-color: rgba(92, 75, 138, 0.3); background: rgba(92, 75, 138, 0.06); }
.card-time {
  font-family: var(--font-ui);
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
}
.card-content {
  font-family: var(--font-body);
  font-size: 0.93rem;
  line-height: 2;
  color: var(--text-primary);
}

.state-box {
  text-align: center;
  padding: 5rem 2rem;
  border: 1px dashed rgba(179, 157, 219, 0.3);
  background: rgba(255, 255, 255, 0.35);
  border-radius: var(--radius-lg, 24px);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.state-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
.state-title { font-family: var(--font-title); font-size: 1.1rem; color: var(--text-primary); margin-bottom: 0.5rem; }
.state-sub { font-family: var(--font-body); font-size: 0.85rem; color: var(--text-muted); }

.spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(179, 157, 219, 0.2);
  border-top-color: var(--accent-dark, #7E57C2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1.5rem;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2.5rem;
}
.page-btn {
  font-family: var(--font-ui);
  font-size: 0.8rem;
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-pill, 100px);
  border: 1px solid rgba(179, 157, 219, 0.3);
  background: rgba(255, 255, 255, 0.5);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast, 0.2s cubic-bezier(0.16, 1, 0.3, 1));
}
.page-btn:hover, .page-btn.active {
  background: rgba(179, 157, 219, 0.2);
  border-color: rgba(126, 87, 194, 0.4);
  color: var(--accent-dark);
}
.page-btn.active {
  background: linear-gradient(135deg, rgba(126, 87, 194, 0.7), rgba(81, 45, 168, 0.6));
  border-color: transparent;
  color: white;
  box-shadow: 0 2px 10px rgba(126, 87, 194, 0.3);
}
.page-ellipsis {
  display: flex;
  align-items: center;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .filter-bar { flex-direction: column; gap: 1rem; padding: 1.2rem; }
  .filter-group { min-width: 100%; }
  .results-meta { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .card-header { flex-direction: column; gap: 0.4rem; }
}
</style>
