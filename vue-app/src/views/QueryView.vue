<script setup>
import { ref, computed, onMounted } from 'vue'
import { submissionsApi } from '@/services/api'

const allData = ref([])
const filteredData = ref([])
const loading = ref(true)
const currentPage = ref(1)
const sortOrder = ref('desc')
const PAGE_SIZE = 10

const dateStart = ref('')
const dateEnd = ref('')
const typeFilter = ref('')
const keywordFilter = ref('')

const types = ['寻物启事', '表白', '挂人', '扩列', '吐槽', '交易', '捞人、物', '打听资讯', '寻找搭子']

const typeEmojiMap = {
  '寻物启事': '🔍', '表白': '💌', '挂人': '⚠️', '扩列': '🤝',
  '吐槽': '💬', '交易': '💰', '捞人、物': '🎣', '打听资讯': '❓', '寻找搭子': '👫'
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
    allData.value = Array.isArray(json.data) ? json.data : json
    filteredData.value = [...allData.value]
    sortData()
  } catch (e) {
    console.warn('加载失败:', e)
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
    <div class="filter-bar glass-card">
      <div class="filter-group">
        <div class="filter-label">开始时间</div>
        <input type="date" class="glass-input" v-model="dateStart" />
      </div>
      <div class="filter-group">
        <div class="filter-label">结束时间</div>
        <input type="date" class="glass-input" v-model="dateEnd" />
      </div>
      <div class="filter-group">
        <div class="filter-label">投稿类型</div>
        <select class="glass-select" v-model="typeFilter">
          <option value="">全部类型</option>
          <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
        </select>
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
        <div class="state-box glass-card">
          <div class="spinner" />
          <div class="state-title">正在加载稿件</div>
          <div class="state-sub">请稍候…</div>
        </div>
      </template>
      <template v-else-if="pageData.length">
        <div
          v-for="(item, i) in pageData"
          :key="item.id"
          class="submission-card glass-card"
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
        <div class="state-box glass-card">
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
}
.filter-bar {
  padding: 1.6rem 2rem;
  display: flex;
  gap: 1.2rem;
  align-items: flex-end;
  flex-wrap: wrap;
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
  color: var(--accent-gold);
}

.results-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem 5rem;
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
  color: var(--accent-light);
}
.results-sort {
  display: flex;
  gap: 0.5rem;
}
.sort-btn {
  font-family: var(--font-ui);
  font-size: 0.75rem;
  padding: 0.35rem 0.85rem;
  border-radius: 100px;
  border: 1px solid rgba(123, 85, 212, 0.25);
  background: transparent;
  color: var(--accent-light);
  cursor: pointer;
  transition: all 0.3s;
}
.sort-btn.active, .sort-btn:hover {
  background: rgba(123, 85, 212, 0.2);
  border-color: #7b55d4;
  color: var(--text-secondary);
}

.cards-grid {
  display: grid;
  gap: 1rem;
}
.submission-card {
  padding: 1.6rem 1.8rem;
  animation: cardIn 0.5s var(--ease-out) forwards;
  opacity: 0;
  transform: translateY(16px);
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
  letter-spacing: 0.08em;
  padding: 0.3rem 0.8rem;
  border-radius: 100px;
  border: 1px solid;
  white-space: nowrap;
}
.type-寻物启事 { color: #5de8d0; border-color: rgba(93, 232, 208, 0.35); background: rgba(93, 232, 208, 0.08); }
.type-表白 { color: #e86fa3; border-color: rgba(232, 111, 163, 0.35); background: rgba(232, 111, 163, 0.08); }
.type-挂人 { color: #f87171; border-color: rgba(248, 113, 113, 0.35); background: rgba(248, 113, 113, 0.08); }
.type-扩列 { color: #a87fe8; border-color: rgba(168, 127, 232, 0.35); background: rgba(168, 127, 232, 0.08); }
.type-吐槽 { color: #e8c97a; border-color: rgba(232, 201, 122, 0.35); background: rgba(232, 201, 122, 0.08); }
.type-交易 { color: #34d399; border-color: rgba(52, 211, 153, 0.35); background: rgba(52, 211, 153, 0.08); }
.type-捞人、物 { color: #60a5fa; border-color: rgba(96, 165, 250, 0.35); background: rgba(96, 165, 250, 0.08); }
.type-打听资讯 { color: #fbbf24; border-color: rgba(251, 191, 36, 0.35); background: rgba(251, 191, 36, 0.08); }
.type-寻找搭子 { color: #ec4899; border-color: rgba(236, 72, 153, 0.35); background: rgba(236, 72, 153, 0.08); }
.card-time {
  font-family: var(--font-ui);
  font-size: 0.72rem;
  color: #7b55d4;
  white-space: nowrap;
}
.card-content {
  font-family: var(--font-body);
  font-size: 0.93rem;
  line-height: 2;
  color: var(--text-secondary);
}

.state-box {
  text-align: center;
  padding: 5rem 2rem;
  border: 1px dashed rgba(123, 85, 212, 0.2);
}
.state-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
.state-title { font-family: var(--font-title); font-size: 1.1rem; color: var(--accent-light); margin-bottom: 0.5rem; }
.state-sub { font-family: var(--font-body); font-size: 0.85rem; color: #7b55d4; }

.spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(123, 85, 212, 0.15);
  border-top-color: #7b55d4;
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
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(123, 85, 212, 0.25);
  background: transparent;
  color: var(--accent-light);
  cursor: pointer;
  transition: all 0.3s;
}
.page-btn:hover, .page-btn.active {
  background: rgba(123, 85, 212, 0.2);
  border-color: #7b55d4;
  color: var(--text-secondary);
}
.page-btn.active {
  background: linear-gradient(135deg, #4c2fa3, #7b55d4);
  border-color: transparent;
  color: white;
}
.page-ellipsis {
  display: flex;
  align-items: center;
  color: #7b55d4;
}

@media (max-width: 768px) {
  .filter-bar { flex-direction: column; gap: 1rem; padding: 1.2rem; }
  .filter-group { min-width: 100%; }
  .results-meta { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .card-header { flex-direction: column; gap: 0.4rem; }
}
</style>
