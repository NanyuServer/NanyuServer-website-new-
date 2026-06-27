<script setup>
import { ref, computed, onMounted } from 'vue'
import { submissionsApi, adminFeedbackApi, recruitmentsApi, recruitApplicantsApi, authApi } from '@/services/api'
import { useToast } from '@/composables/useToast'
import GlassSelect from '@/components/common/GlassSelect.vue'
import GlassDateTime from '@/components/common/GlassDateTime.vue'

const { show: showToast } = useToast()

const isLoggedIn = ref(false)
const loginUser = ref('')
const loginPass = ref('')
const loginErr = ref('')
const currentTab = ref('add')
const ADMIN_SECRET = ref(localStorage.getItem('adminToken') || '')
const username = ref(localStorage.getItem('adminUsername') || '')

const DB = ref([])
const tableFiltered = ref([])
const tablePage = ref(1)
const TABLE_PAGE_SIZE = 8
const tableSearch = ref('')
const tableTypeFilter = ref('')

const fieldTime = ref('')
const fieldType = ref('')
const fieldContent = ref('')
const fieldEditId = ref('')

const bulkFile = ref(null)
const bulkPreview = ref([])
const bulkImporting = ref(false)
const bulkResult = ref(null)

const feedbackRecords = ref([])
const feedbackSearch = ref('')

const recruitData = ref([])
const recruitApplicants = ref([])
const recruitTitle = ref('')
const recruitDesc = ref('')
const recruitTags = ref('')
const recruitApply = ref('')
const recruitEditId = ref('')

const accountOldPass = ref('')
const accountNewPass = ref('')
const accountNewPassConfirm = ref('')

const replyModalVisible = ref(false)
const replyContent = ref('')
const currentReplyId = ref(null)

const types = ['寻物启事', '表白', '挂人', '扩列', '吐槽', '交易', '捞人、物', '打听资讯', '寻找搭子', '有啥说啥']

const typeEmojiMap = {
  '寻物启事': '🔍', '表白': '💌', '挂人': '⚠️', '扩列': '🤝',
  '吐槽': '💬', '交易': '💰', '捞人、物': '🎣', '打听资讯': '❓', '寻找搭子': '👫', '有啥说啥': '🗣️'
}

const statTotal = computed(() => DB.value.length)
const statToday = computed(() => {
  const today = new Date().toDateString()
  return DB.value.filter(r => new Date(r.created_at).toDateString() === today).length
})

const totalPages = computed(() => Math.ceil(tableFiltered.value.length / TABLE_PAGE_SIZE))
const pageData = computed(() => {
  const start = (tablePage.value - 1) * TABLE_PAGE_SIZE
  return tableFiltered.value.slice(start, start + TABLE_PAGE_SIZE)
})

const feedbackFiltered = computed(() => {
  const q = feedbackSearch.value.toLowerCase()
  if (!q) return feedbackRecords.value
  return feedbackRecords.value.filter(f =>
    f.type.toLowerCase().includes(q) || f.message.toLowerCase().includes(q) || (f.reply || '').toLowerCase().includes(q)
  )
})

function formatDT(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const tabTitles = {
  add: { title: '添加稿件', sub: '填写信息后提交至数据库' },
  list: { title: '稿件列表', sub: '查看和管理所有已录入稿件' },
  feedback: { title: '反馈管理', sub: '审核有求必应提交内容并回复用户' },
  recruit: { title: '招贤纳士管理', sub: '管理岗位和报名数据' },
  account: { title: '账户设置', sub: '修改密码和管理账户' }
}

function showTab(tab) {
  currentTab.value = tab
  if (tab === 'list') loadAllData()
  if (tab === 'feedback') loadFeedbackData()
  if (tab === 'recruit') { loadRecruitData(); loadRecruitApplicants() }
  if (tab === 'account') { /* no-op */ }
}

function initNow() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const h = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  fieldTime.value = `${y}-${m}-${d} ${h}:${mi}`
}

async function doLogin() {
  if (!loginUser.value || !loginPass.value) {
    loginErr.value = '请输入用户名和密码'
    return
  }
  loginErr.value = ''
  try {
    const json = await authApi.login(loginUser.value, loginPass.value)
    ADMIN_SECRET.value = json.token
    localStorage.setItem('adminToken', json.token)
    localStorage.setItem('adminUsername', json.username)
    username.value = json.username
    isLoggedIn.value = true
    loginPass.value = ''
    initNow()
    loadAllData()
  } catch (e) {
    loginErr.value = e.message
  }
}

function doLogout() {
  localStorage.removeItem('adminToken')
  localStorage.removeItem('adminUsername')
  ADMIN_SECRET.value = ''
  isLoggedIn.value = false
  loginUser.value = ''
  loginPass.value = ''
}

async function verifyToken() {
  const token = localStorage.getItem('adminToken')
  if (!token) return
  try {
    await authApi.verify(token)
    ADMIN_SECRET.value = token
    isLoggedIn.value = true
    initNow()
    loadAllData()
  } catch (e) {
    localStorage.removeItem('adminToken')
    ADMIN_SECRET.value = ''
  }
}

async function loadAllData() {
  try {
    const json = await submissionsApi.getAll()
    DB.value = Array.isArray(json.data) ? json.data : json
    filterTable()
  } catch (e) {
    showToast('数据库连接失败：' + e.message, 'error')
  }
}

function filterTable() {
  const q = tableSearch.value.toLowerCase()
  const t = tableTypeFilter.value
  tableFiltered.value = DB.value.filter(r => {
    if (t && r.type !== t) return false
    if (q && !r.content.toLowerCase().includes(q)) return false
    return true
  })
  tablePage.value = 1
}

function clearForm() {
  fieldContent.value = ''
  fieldType.value = ''
  fieldEditId.value = ''
  initNow()
}

function downloadTemplate() {
  const header = '投稿时间,投稿类型,稿件内容\n'
  const example = '2026-06-20 12:00:00,扩列,这是一条示例稿件内容\n'
  const typesNote = '# 可用类型: 寻物启事, 表白, 挂人, 扩列, 吐槽, 交易, 捞人、物, 打听资讯, 寻找搭子, 有啥说啥\n'
  const bom = '\uFEFF'
  const blob = new Blob([bom + header + example + typesNote], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '稿件批量导入模板.csv'
  a.click()
  URL.revokeObjectURL(url)
}

async function parseBulkFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  bulkResult.value = null

  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'csv') {
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'))
    if (lines.length < 2) { showToast('CSV 文件无数据行', 'error'); return }
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const contentIdx = header.findIndex(h => h.includes('内容'))
    const typeIdx = header.findIndex(h => h.includes('类型'))
    const timeIdx = header.findIndex(h => h.includes('时间'))

    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i])
      rows.push({
        created_at: timeIdx >= 0 ? cols[timeIdx] : '',
        type: typeIdx >= 0 ? cols[typeIdx] : '',
        content: contentIdx >= 0 ? cols[contentIdx] : cols.join(',')
      })
    }
    bulkPreview.value = rows
  } else if (ext === 'xlsx' || ext === 'xls') {
    try {
      const XLSX = await loadXlsx()
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 })
      if (json.length < 2) { showToast('Excel 文件无数据行', 'error'); return }
      const header = json[0].map(h => String(h || '').trim())
      const contentIdx = header.findIndex(h => h.includes('内容'))
      const typeIdx = header.findIndex(h => h.includes('类型'))
      const timeIdx = header.findIndex(h => h.includes('时间'))

      const rows = []
      for (let i = 1; i < json.length; i++) {
        const row = json[i]
        if (!row || row.every(c => !c)) continue
        rows.push({
          created_at: timeIdx >= 0 ? String(row[timeIdx] || '') : '',
          type: typeIdx >= 0 ? String(row[typeIdx] || '') : '',
          content: contentIdx >= 0 ? String(row[contentIdx] || '') : row.map(c => String(c || '')).join(',')
        })
      }
      bulkPreview.value = rows
    } catch (err) {
      showToast('Excel 解析失败: ' + err.message, 'error')
    }
  } else {
    showToast('请上传 .csv 或 .xlsx 文件', 'error')
  }
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = '' }
    else { current += ch }
  }
  result.push(current.trim())
  return result
}

async function loadXlsx() {
  if (window.XLSX) return window.XLSX
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
  return window.XLSX
}

async function submitBulkImport() {
  if (bulkPreview.value.length === 0) { showToast('无数据可导入', 'error'); return }
  bulkImporting.value = true
  bulkResult.value = null

  try {
    const res = await fetch('/api/submissions-bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': ADMIN_SECRET.value
      },
      body: JSON.stringify({ rows: bulkPreview.value })
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
    bulkResult.value = json
    bulkPreview.value = []
    if (json.imported > 0) {
      showToast(`成功导入 ${json.imported} 条稿件`, 'success')
      loadAllData()
    }
  } catch (e) {
    showToast('导入失败: ' + e.message, 'error')
  } finally {
    bulkImporting.value = false
  }
}

function clearBulk() {
  bulkPreview.value = []
  bulkResult.value = null
  bulkFile.value = null
}

async function submitEntry() {
  if (!fieldTime.value) { showToast('请选择投稿时间', 'error'); return }
  if (!fieldType.value) { showToast('请选择投稿类型', 'error'); return }
  if (!fieldContent.value.trim()) { showToast('请输入稿件内容', 'error'); return }
  if (fieldContent.value.trim().length < 5) { showToast('稿件内容过短，至少5个字符', 'error'); return }

  try {
    if (fieldEditId.value) {
      const json = await submissionsApi.update(fieldEditId.value, { content: fieldContent.value.trim(), type: fieldType.value })
      DB.value = DB.value.map(r => r.id === json.data.id ? json.data : r)
      showToast('✓ 稿件已成功更新', 'success')
    } else {
      const json = await submissionsApi.create({
        created_at: new Date(fieldTime.value).toISOString(),
        content: fieldContent.value.trim(),
        type: fieldType.value
      })
      DB.value.unshift(json.data)
      showToast('✓ 稿件已成功写入数据库', 'success')
    }
    clearForm()
    filterTable()
  } catch (e) {
    showToast((fieldEditId.value ? '更新失败：' : '提交失败：') + e.message, 'error')
  }
}

function enterEditMode(id) {
  const r = DB.value.find(r => r.id === id)
  if (!r) return showToast('未找到该稿件', 'error')
  fieldEditId.value = r.id
  const d = new Date(r.created_at)
  const pad = n => String(n).padStart(2, '0')
  fieldTime.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  fieldType.value = r.type
  fieldContent.value = r.content
  showTab('add')
}

async function deleteEntry(id) {
  if (!confirm('确认删除该稿件？此操作不可撤销。')) return
  try {
    await submissionsApi.remove(id)
    DB.value = DB.value.filter(r => r.id !== id)
    tableFiltered.value = tableFiltered.value.filter(r => r.id !== id)
    showToast('稿件已从数据库删除', 'success')
  } catch (e) {
    showToast('删除失败：' + e.message, 'error')
  }
}

function tGoPage(n) { tablePage.value = n }

async function loadFeedbackData() {
  try {
    feedbackRecords.value = await adminFeedbackApi.getAll()
  } catch (e) {
    showToast('反馈数据加载失败：' + e.message, 'error')
  }
}

const feedbackStatusMap = {
  pending: { label: '待审核', cls: 'fb-pending' },
  approved: { label: '已审核', cls: 'fb-approved' },
  rejected: { label: '不通过', cls: 'fb-rejected' },
  transferred: { label: '转接中', cls: 'fb-transferred' },
  replied: { label: '已答复', cls: 'fb-replied' }
}

async function handleFeedbackAction(id, action) {
  if (action === 'reply') {
    currentReplyId.value = id
    replyContent.value = ''
    replyModalVisible.value = true
    return
  }
  try {
    await adminFeedbackUpdate({ id, action })
    showToast('操作已保存', 'success')
    loadFeedbackData()
  } catch (e) {
    showToast('保存失败：' + e.message, 'error')
  }
}

async function adminFeedbackUpdate(payload) {
  const res = await fetch('/api/admin-feedback', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET.value },
    body: JSON.stringify(payload)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

async function sendReply() {
  if (!replyContent.value.trim()) { showToast('回复内容不能为空', 'error'); return }
  try {
    await adminFeedbackUpdate({ id: currentReplyId.value, action: 'reply', reply: replyContent.value.trim() })
    showToast('回复已发送', 'success')
    replyModalVisible.value = false
    loadFeedbackData()
  } catch (e) {
    showToast('发送失败：' + e.message, 'error')
  }
}

async function loadRecruitData() {
  try {
    const json = await recruitmentsApi.getAll()
    recruitData.value = Array.isArray(json.data) ? json.data : []
  } catch (e) {
    showToast('招聘数据加载失败：' + e.message, 'error')
  }
}

async function loadRecruitApplicants() {
  try {
    const json = await recruitApplicantsApi.getAll()
    recruitApplicants.value = Array.isArray(json.data) ? json.data : []
  } catch (e) {
    showToast('报名数据加载失败：' + e.message, 'error')
  }
}

function clearRecruitForm() {
  recruitTitle.value = ''
  recruitDesc.value = ''
  recruitTags.value = ''
  recruitApply.value = ''
  recruitEditId.value = ''
}

async function submitRecruitEntry() {
  if (!recruitTitle.value.trim()) { showToast('请输入岗位名称', 'error'); return }
  if (!recruitDesc.value.trim()) { showToast('请输入岗位描述', 'error'); return }

  try {
    if (recruitEditId.value) {
      const json = await recruitmentsApi.update(recruitEditId.value, {
        title: recruitTitle.value.trim(),
        description: recruitDesc.value.trim(),
        tags: recruitTags.value.trim(),
        apply_url: recruitApply.value.trim()
      })
      recruitData.value = recruitData.value.map(r => r.id === json.data.id ? json.data : r)
      showToast('岗位已更新', 'success')
    } else {
      const json = await recruitmentsApi.create({
        title: recruitTitle.value.trim(),
        description: recruitDesc.value.trim(),
        tags: recruitTags.value.trim(),
        apply_url: recruitApply.value.trim()
      })
      recruitData.value.unshift(json.data)
      showToast('岗位已添加', 'success')
    }
    clearRecruitForm()
  } catch (e) {
    showToast('岗位保存失败：' + e.message, 'error')
  }
}

function enterRecruitEditMode(id) {
  const r = recruitData.value.find(r => r.id === id)
  if (!r) return showToast('未找到该岗位', 'error')
  recruitEditId.value = r.id
  recruitTitle.value = r.title
  recruitDesc.value = r.description
  recruitTags.value = r.tags || ''
  recruitApply.value = r.apply_url || ''
  showTab('recruit')
}

async function deleteRecruitEntry(id) {
  if (!confirm('确认删除该岗位？此操作不可撤销。')) return
  try {
    await recruitmentsApi.remove(id)
    recruitData.value = recruitData.value.filter(r => r.id !== id)
    showToast('岗位已删除', 'success')
  } catch (e) {
    showToast('删除失败：' + e.message, 'error')
  }
}

async function submitChangePassword() {
  if (!accountOldPass.value) { showToast('请输入旧密码', 'error'); return }
  if (!accountNewPass.value) { showToast('请输入新密码', 'error'); return }
  if (accountNewPass.value.length < 6) { showToast('新密码至少6个字符', 'error'); return }
  if (accountNewPass.value !== accountNewPassConfirm.value) { showToast('两次输入的密码不一致', 'error'); return }

  try {
    await authApi.changePassword(username.value, accountOldPass.value, accountNewPass.value)
    showToast('✓ 密码已成功修改，请重新登录', 'success')
    accountOldPass.value = ''
    accountNewPass.value = ''
    accountNewPassConfirm.value = ''
    setTimeout(() => doLogout(), 2000)
  } catch (e) {
    showToast('修改失败：' + e.message, 'error')
  }
}

onMounted(() => {
  verifyToken()
})
</script>

<template>
  <!-- Login Screen -->
  <div v-if="!isLoggedIn" class="login-screen">
    <div class="login-card glass-card">
      <div class="login-card-top" />
      <div class="login-logo">
        <div class="login-logo-icon"><img src="/logomini.webp" alt="管理后台" style="width:36px;height:36px;border-radius:8px;" /></div>
        <div class="login-logo-title">南渝万能墙</div>
        <div class="login-logo-sub">运营管理后台</div>
      </div>
      <div class="login-field">
        <label class="login-label">管理员账号</label>
        <input type="text" class="glass-input" v-model="loginUser" placeholder="请输入账号" autocomplete="username" />
      </div>
      <div class="login-field">
        <label class="login-label">访问密码</label>
        <input type="password" class="glass-input" v-model="loginPass" placeholder="请输入密码" autocomplete="current-password" @keydown.enter="doLogin" />
      </div>
      <button class="glass-btn glass-btn-primary" style="width: 100%; margin-top: 0.5rem;" @click="doLogin">登 录</button>
      <div v-if="loginErr" class="login-err">{{ loginErr }}</div>
    </div>
  </div>

  <!-- Admin Dashboard -->
  <div v-else class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon"><img src="/logomini.webp" alt="管理后台" style="width:28px;height:28px;border-radius:6px;" /></div>
        <div>
          <div class="sidebar-logo-text">南渝万能墙</div>
          <div class="sidebar-logo-sub">运营后台</div>
        </div>
      </div>
      <div class="sidebar-nav">
        <div class="sidebar-section-label">内容管理</div>
        <button class="sidebar-link" :class="{ active: currentTab === 'add' }" @click="showTab('add')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          <span>添加稿件</span>
        </button>
        <button class="sidebar-link" :class="{ active: currentTab === 'list' }" @click="showTab('list')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /></svg>
          <span>稿件列表</span>
        </button>
        <button class="sidebar-link" :class="{ active: currentTab === 'feedback' }" @click="showTab('feedback')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 4.97-4.03 9-9 9a9 9 0 0 1-4-17.18" /><path d="M9 8h6" /><path d="M9 12h4" /></svg>
          <span>反馈管理</span>
        </button>
        <button class="sidebar-link" :class="{ active: currentTab === 'recruit' }" @click="showTab('recruit')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18" /><path d="M3 12h18" /></svg>
          <span>招贤纳士管理</span>
        </button>
        <button class="sidebar-link" :class="{ active: currentTab === 'account' }" @click="showTab('account')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          <span>账户管理</span>
        </button>
        <div class="sidebar-section-label">导航</div>
        <router-link class="sidebar-link" to="/">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
          <span>返回主页</span>
        </router-link>
        <router-link class="sidebar-link" to="/query">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <span>稿件查询</span>
        </router-link>
      </div>
      <div class="sidebar-footer">
        <button class="sidebar-logout" @click="doLogout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          <span>退出登录</span>
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="admin-main">
      <div class="admin-topbar">
        <div>
          <div class="admin-topbar-title">{{ tabTitles[currentTab]?.title }}</div>
          <div class="admin-topbar-sub">{{ tabTitles[currentTab]?.sub }}</div>
        </div>
        <div class="admin-badge">● 系统运行正常</div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card glass-card">
          <div class="stat-num">{{ statTotal }}</div>
          <div class="stat-label">总稿件数</div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-num">{{ statToday }}</div>
          <div class="stat-label">今日新增</div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-num">9</div>
          <div class="stat-label">稿件类型</div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-num">100%</div>
          <div class="stat-label">系统可用率</div>
        </div>
      </div>

      <!-- Add Submission Tab -->
      <div v-show="currentTab === 'add'">
        <div class="form-card glass-card">

          <div class="form-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            {{ fieldEditId ? '编辑稿件' : '新建稿件' }}
          </div>
          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label">投稿时间</label>
              <GlassDateTime v-model="fieldTime" placeholder="选择投稿时间" />
            </div>
            <div class="form-group">
              <label class="form-label">投稿类型</label>
              <GlassSelect v-model="fieldType" :options="[{ value: '', label: '请选择类型' }, ...types.map(t => ({ value: t, label: typeEmojiMap[t] + ' ' + t }))]" placeholder="请选择类型" />
            </div>
            <div class="form-group">
              <label class="form-label">稿件 ID</label>
              <input type="text" class="glass-input" :value="fieldEditId ? '#' + fieldEditId : '提交后自动分配'" disabled style="opacity: 0.5" />
            </div>
            <div class="form-group full">
              <label class="form-label">稿件内容</label>
              <textarea class="glass-textarea" v-model="fieldContent" placeholder="请输入稿件正文内容…" rows="5" />
            </div>
          </div>
          <div class="form-actions">
            <button class="glass-btn glass-btn-ghost glass-btn-sm" @click="clearForm">清 空</button>
            <button v-if="fieldEditId" class="glass-btn glass-btn-ghost glass-btn-sm" @click="clearForm(); showTab('add')">取消编辑</button>
            <button class="glass-btn glass-btn-primary glass-btn-sm" @click="submitEntry">
              {{ fieldEditId ? '保存修改' : '提交至数据库' }}
            </button>
          </div>
        </div>

        <div class="form-card glass-card" style="margin-top: 1.5rem;">

          <div class="form-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
            批量导入稿件
          </div>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">
            上传 CSV 或 Excel 文件，表头须包含「投稿类型」和「稿件内容」列，「投稿时间」为可选列（不填则使用当前时间）。
          </p>
          <div class="bulk-actions">
            <button class="glass-btn glass-btn-ghost glass-btn-sm" @click="downloadTemplate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              下载 CSV 模板
            </button>
            <label class="glass-btn glass-btn-ghost glass-btn-sm" style="cursor: pointer;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              选择文件
              <input type="file" accept=".csv,.xlsx,.xls" style="display:none" @change="parseBulkFile" />
            </label>
          </div>

          <div v-if="bulkPreview.length" class="bulk-preview">
            <div class="bulk-preview-header">
              <span>已解析 {{ bulkPreview.length }} 条数据（预览前 5 条）</span>
              <button class="glass-btn glass-btn-ghost glass-btn-sm" @click="clearBulk">清空</button>
            </div>
            <div style="overflow-x: auto;">
              <table class="data-table">
                <thead><tr><th>时间</th><th>类型</th><th>内容</th></tr></thead>
                <tbody>
                  <tr v-for="(row, i) in bulkPreview.slice(0, 5)" :key="i">
                    <td style="white-space:nowrap;font-size:0.78rem;">{{ row.created_at || '当前时间' }}</td>
                    <td><span class="type-badge" :class="'type-' + row.type">{{ typeEmojiMap[row.type] }} {{ row.type }}</span></td>
                    <td class="content-cell" :title="row.content">{{ row.content }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="bulk-actions" style="margin-top: 1rem;">
              <button class="glass-btn glass-btn-primary glass-btn-sm" @click="submitBulkImport" :disabled="bulkImporting">
                {{ bulkImporting ? '导入中…' : '确认导入 ' + bulkPreview.length + ' 条' }}
              </button>
            </div>
          </div>

          <div v-if="bulkResult" class="bulk-result">
            <span style="color: var(--color-success);">✓ 成功导入 {{ bulkResult.imported }} 条</span>
            <span v-if="bulkResult.skipped" style="color: var(--color-warning); margin-left: 1rem;">跳过 {{ bulkResult.skipped }} 条</span>
          </div>
        </div>
      </div>

      <!-- List Tab -->
      <div v-show="currentTab === 'list'">
        <div class="table-card glass-card">
          <div class="table-toolbar">
            <div class="table-toolbar-title">稿件数据列表</div>
            <div class="table-search">
              <input type="text" class="glass-input table-search-input" v-model="tableSearch" @input="filterTable" placeholder="搜索稿件内容…" />
              <div style="min-width: 140px;">
                <GlassSelect v-model="tableTypeFilter" :options="[{ value: '', label: '全部类型' }, ...types.map(t => ({ value: t, label: t }))]" placeholder="全部类型" @update:modelValue="filterTable" />
              </div>
            </div>
          </div>
          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>投稿时间</th>
                  <th>投稿类型</th>
                  <th>稿件内容</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="pageData.length">
                  <tr v-for="r in pageData" :key="r.id">
                    <td style="color: #7b55d4; font-size: 0.75rem">#{{ r.id }}</td>
                    <td style="white-space: nowrap; color: var(--accent-light); font-size: 0.78rem">{{ formatDT(r.created_at) }}</td>
                    <td><span class="type-badge" :class="'type-' + r.type">{{ typeEmojiMap[r.type] }} {{ r.type }}</span></td>
                    <td class="content-cell" :title="r.content">{{ r.content }}</td>
                    <td>
                      <button class="action-btn action-edit" @click="enterEditMode(r.id)">编辑</button>
                      <button class="action-btn action-delete" @click="deleteEntry(r.id)">删除</button>
                    </td>
                  </tr>
                </template>
                <template v-else>
                  <tr><td colspan="5" class="empty-table">暂无数据</td></tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="table-footer">
            <div class="table-count">共 {{ tableFiltered.length }} 条</div>
            <div class="table-pagination">
              <button v-if="tablePage > 1" class="tpage-btn" @click="tGoPage(tablePage - 1)">‹</button>
              <button v-for="i in totalPages" :key="i" class="tpage-btn" :class="{ active: i === tablePage }" @click="tGoPage(i)">{{ i }}</button>
              <button v-if="tablePage < totalPages" class="tpage-btn" @click="tGoPage(tablePage + 1)">›</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Feedback Tab -->
      <div v-show="currentTab === 'feedback'">
        <div class="table-card glass-card">
          <div class="table-toolbar">
            <div class="table-toolbar-title">有求必应反馈审核</div>
            <input type="text" class="glass-input table-search-input" v-model="feedbackSearch" placeholder="搜索反馈内容…" />
          </div>
          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr><th>ID</th><th>类型</th><th>内容</th><th>状态</th><th>回复</th><th>操作</th></tr>
              </thead>
              <tbody>
                <template v-if="feedbackFiltered.length">
                  <tr v-for="f in feedbackFiltered" :key="f.id">
                    <td style="color: #7b55d4; font-size: 0.75rem">#{{ f.id }}</td>
                    <td>{{ f.type }}</td>
                    <td class="content-cell" :title="f.message">{{ f.message }}</td>
                    <td>
                      <span class="fb-status-badge" :class="feedbackStatusMap[f.status]?.cls">
                        {{ feedbackStatusMap[f.status]?.label || '未知' }}
                      </span>
                    </td>
                    <td>{{ f.reply || '—' }}</td>
                    <td>
                      <button class="action-btn action-edit" @click="handleFeedbackAction(f.id, 'approve')">通过</button>
                      <button class="action-btn action-delete" @click="handleFeedbackAction(f.id, 'reject')">不通过</button>
                      <button class="action-btn action-transfer" @click="handleFeedbackAction(f.id, 'transfer')">转接</button>
                      <button class="action-btn action-reply" @click="handleFeedbackAction(f.id, 'reply')">回复</button>
                    </td>
                  </tr>
                </template>
                <template v-else>
                  <tr><td colspan="6" class="empty-table">暂无反馈数据</td></tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="table-footer">
            <div class="table-count">共 {{ feedbackFiltered.length }} 条</div>
          </div>
        </div>
      </div>

      <!-- Recruit Tab -->
      <div v-show="currentTab === 'recruit'">
        <div class="form-card glass-card">

          <div class="form-card-title">招贤纳士岗位管理</div>
          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label">岗位名称</label>
              <input type="text" class="glass-input" v-model="recruitTitle" placeholder="例如：内容运营" />
            </div>
            <div class="form-group">
              <label class="form-label">岗位标签</label>
              <input type="text" class="glass-input" v-model="recruitTags" placeholder="例如：招2-3人, 周末兼职" />
            </div>
            <div class="form-group">
              <label class="form-label">报名链接</label>
              <input type="text" class="glass-input" v-model="recruitApply" placeholder="https://..." />
            </div>
            <div class="form-group full">
              <label class="form-label">岗位描述</label>
              <textarea class="glass-textarea" v-model="recruitDesc" placeholder="请输入岗位职责与要求…" rows="4" />
            </div>
          </div>
          <div class="form-actions">
            <button class="glass-btn glass-btn-ghost glass-btn-sm" @click="clearRecruitForm">清 空</button>
            <button v-if="recruitEditId" class="glass-btn glass-btn-ghost glass-btn-sm" @click="clearRecruitForm(); showTab('recruit')">取消编辑</button>
            <button class="glass-btn glass-btn-primary glass-btn-sm" @click="submitRecruitEntry">保存岗位</button>
          </div>
        </div>

        <div class="table-card glass-card" style="margin-top: 1.5rem;">
          <div class="table-toolbar"><div class="table-toolbar-title">岗位列表</div></div>
          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead><tr><th>ID</th><th>岗位名称</th><th>描述</th><th>标签</th><th>操作</th></tr></thead>
              <tbody>
                <template v-if="recruitData.length">
                  <tr v-for="r in recruitData" :key="r.id">
                    <td style="color: #7b55d4; font-size: 0.75rem">#{{ r.id }}</td>
                    <td>{{ r.title }}</td>
                    <td class="content-cell" :title="r.description">{{ r.description }}</td>
                    <td>{{ r.tags || '—' }}</td>
                    <td>
                      <button class="action-btn action-edit" @click="enterRecruitEditMode(r.id)">编辑</button>
                      <button class="action-btn action-delete" @click="deleteRecruitEntry(r.id)">删除</button>
                    </td>
                  </tr>
                </template>
                <template v-else>
                  <tr><td colspan="5" class="empty-table">暂无招聘岗位</td></tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="table-footer"><div class="table-count">共 {{ recruitData.length }} 条</div></div>
        </div>

        <div class="table-card glass-card" style="margin-top: 1.5rem;">
          <div class="table-toolbar"><div class="table-toolbar-title">岗位报名列表</div></div>
          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead><tr><th>ID</th><th>报名时间</th><th>姓名</th><th>意向岗位</th><th>QQ</th><th>备注</th></tr></thead>
              <tbody>
                <template v-if="recruitApplicants.length">
                  <tr v-for="a in recruitApplicants" :key="a.id">
                    <td style="color: #7b55d4; font-size: 0.75rem">#{{ a.id }}</td>
                    <td style="white-space: nowrap; font-size: 0.78rem">{{ formatDT(a.created_at) }}</td>
                    <td>{{ a.name }}</td>
                    <td>{{ a.position_title }}</td>
                    <td>{{ a.qq }}</td>
                    <td class="content-cell" :title="a.note">{{ a.note || '—' }}</td>
                  </tr>
                </template>
                <template v-else>
                  <tr><td colspan="6" class="empty-table">暂无报名数据</td></tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="table-footer"><div class="table-count">共 {{ recruitApplicants.length }} 条</div></div>
        </div>
      </div>

      <!-- Account Tab -->
      <div v-show="currentTab === 'account'">
        <div class="form-card glass-card">

          <div class="form-card-title">账户设置</div>
          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label">当前用户</label>
              <input type="text" class="glass-input" :value="username" disabled />
            </div>
            <div class="form-group">
              <label class="form-label">旧密码</label>
              <input type="password" class="glass-input" v-model="accountOldPass" placeholder="请输入当前密码" />
            </div>
            <div class="form-group">
              <label class="form-label">新密码</label>
              <input type="password" class="glass-input" v-model="accountNewPass" placeholder="至少6个字符" />
            </div>
            <div class="form-group">
              <label class="form-label">确认新密码</label>
              <input type="password" class="glass-input" v-model="accountNewPassConfirm" placeholder="确认新密码" />
            </div>
          </div>
          <div class="form-actions">
            <button class="glass-btn glass-btn-ghost glass-btn-sm" @click="accountOldPass=''; accountNewPass=''; accountNewPassConfirm=''">重 置</button>
            <button class="glass-btn glass-btn-primary glass-btn-sm" @click="submitChangePassword">修改密码</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Reply Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="replyModalVisible" class="reply-overlay" @click.self="replyModalVisible = false">
        <div class="reply-card glass-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-weight: 700; color: #f0e6ff;">回复反馈</div>
            <button class="close-btn" @click="replyModalVisible = false">✕</button>
          </div>
          <textarea class="glass-textarea" v-model="replyContent" placeholder="请输入回复内容" style="min-height: 120px;" />
          <div class="form-actions" style="margin-top: 0.8rem;">
            <button class="glass-btn glass-btn-ghost glass-btn-sm" @click="replyModalVisible = false">取消</button>
            <button class="glass-btn glass-btn-primary glass-btn-sm" @click="sendReply">发送回复</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Login */
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(75, 47, 163, 0.3) 0%, transparent 70%);
}
.login-card {
  width: 100%;
  max-width: 380px;
  padding: 2.5rem;
}
.login-card-top {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #4c2fa3, #a87fe8, #e86fa3);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
.login-logo {
  text-align: center;
  margin-bottom: 2rem;
}
.login-logo-icon {
  width: 56px; height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #4c2fa3, #e86fa3);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 0.75rem;
  font-size: 1.6rem;
  box-shadow: 0 8px 24px rgba(75, 47, 163, 0.4);
}
.login-logo-title {
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: 700;
  color: #f0e6ff;
}
.login-logo-sub {
  font-size: 0.75rem;
  color: var(--accent-light);
  margin-top: 3px;
}
.login-field {
  margin-bottom: 1.1rem;
}
.login-label {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: var(--accent-gold);
  margin-bottom: 0.4rem;
  display: block;
}
.login-err {
  color: var(--color-error);
  font-size: 0.78rem;
  margin-top: 0.75rem;
  text-align: center;
}

/* Admin Layout */
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  position: fixed;
  left: 0; top: 0; bottom: 0;
  width: 220px;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-right: 1px solid rgba(123, 85, 212, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 100;
}
.sidebar-logo {
  padding: 1.5rem 1.4rem;
  border-bottom: 1px solid rgba(123, 85, 212, 0.1);
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.sidebar-logo-icon {
  width: 36px; height: 36px;
  border-radius: 9px;
  background: linear-gradient(135deg, #4c2fa3, #e86fa3);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.sidebar-logo-text {
  font-family: var(--font-title);
  font-size: 0.85rem;
  font-weight: 700;
  color: #f0e6ff;
}
.sidebar-logo-sub {
  font-size: 0.65rem;
  color: var(--accent-light);
  margin-top: 1px;
}
.sidebar-nav {
  padding: 1.2rem 0.8rem;
  flex: 1;
}
.sidebar-section-label {
  font-size: 0.62rem;
  letter-spacing: 0.15em;
  color: #7b55d4;
  padding: 0 0.6rem;
  margin-bottom: 0.4rem;
  margin-top: 1rem;
}
.sidebar-nav > :first-child .sidebar-section-label,
.sidebar-section-label:first-child {
  margin-top: 0;
}
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.65rem 0.8rem;
  border-radius: 8px;
  color: var(--accent-light);
  text-decoration: none;
  font-size: 0.83rem;
  transition: all 0.25s;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}
.sidebar-link:hover {
  background: rgba(123, 85, 212, 0.15);
  color: var(--text-secondary);
}
.sidebar-link.active {
  background: linear-gradient(135deg, rgba(75, 47, 163, 0.4), rgba(168, 127, 232, 0.2));
  color: #f0e6ff;
  border: 1px solid rgba(123, 85, 212, 0.25);
}
.sidebar-link svg {
  width: 16px; height: 16px;
  flex-shrink: 0;
}
.sidebar-footer {
  padding: 1rem 1.2rem;
  border-top: 1px solid rgba(123, 85, 212, 0.1);
}
.sidebar-logout {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #7b55d4;
  font-size: 0.8rem;
  cursor: pointer;
  transition: color 0.3s;
  border: none;
  background: none;
  padding: 0.4rem 0;
}
.sidebar-logout:hover {
  color: var(--accent-rose);
}

.admin-main {
  margin-left: 220px;
  min-height: 100vh;
  padding: 2rem 2.5rem;
}

.admin-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid rgba(123, 85, 212, 0.15);
}
.admin-topbar-title {
  font-family: var(--font-title);
  font-size: 1.3rem;
  font-weight: 700;
  color: #f0e6ff;
}
.admin-topbar-sub {
  font-size: 0.78rem;
  color: var(--accent-light);
  margin-top: 2px;
}
.admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.9rem;
  border-radius: 100px;
  background: rgba(52, 211, 153, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.25);
  color: var(--color-success);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
}
.admin-badge::before {
  content: '';
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--color-success);
  animation: blink 2s ease infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
.stat-card {
  padding: 1.2rem 1.4rem;
}
.stat-num {
  font-family: var(--font-title);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(135deg, var(--accent-gold), var(--accent-gold2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.3rem;
}
.stat-label {
  font-size: 0.75rem;
  color: var(--accent-light);
}

/* Forms */
.form-card {
  padding: 2rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}
.form-card-top {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, #4c2fa3, #a87fe8, #e86fa3);
}
.form-card-title {
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 700;
  color: #f0e6ff;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.form-card-title svg { color: var(--accent-light); }
.form-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.2rem;
  margin-bottom: 1.2rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.form-group.full {
  grid-column: 1 / -1;
}
.form-label {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: var(--accent-gold);
}
.form-actions {
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
}

.bulk-actions {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}
.bulk-preview {
  margin-top: 1.2rem;
  padding-top: 1.2rem;
  border-top: 1px solid rgba(123, 85, 212, 0.15);
}
.bulk-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
  font-size: 0.82rem;
  color: var(--accent-light);
}
.bulk-result {
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  background: rgba(52, 211, 153, 0.08);
  border: 1px solid rgba(52, 211, 153, 0.2);
  font-size: 0.85rem;
}

/* Table */
.table-card {
  overflow: hidden;
}
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid rgba(75, 47, 163, 0.15);
  gap: 1rem;
  flex-wrap: wrap;
}
.table-toolbar-title {
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: 700;
  color: #f0e6ff;
}
.table-search {
  display: flex;
  gap: 0.6rem;
  align-items: center;
}
.table-search-input {
  width: 200px;
  font-size: 0.8rem;
  padding: 0.5rem 0.8rem;
}
.table-filter-select {
  font-size: 0.8rem;
  padding: 0.5rem 0.7rem;
  width: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: var(--accent-gold);
  padding: 0.8rem 1.2rem;
  text-align: left;
  border-bottom: 1px solid rgba(75, 47, 163, 0.2);
  background: rgba(15, 10, 26, 0.3);
  white-space: nowrap;
}
.data-table td {
  font-size: 0.83rem;
  padding: 0.9rem 1.2rem;
  border-bottom: 1px solid rgba(75, 47, 163, 0.1);
  color: var(--text-secondary);
  vertical-align: middle;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: rgba(75, 47, 163, 0.07); }
.content-cell {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  padding: 0.25rem 0.65rem;
  border-radius: 100px;
  border: 1px solid;
  white-space: nowrap;
}
.type-寻物启事 { color: #5de8d0; border-color: rgba(93, 232, 208, 0.3); background: rgba(93, 232, 208, 0.08); }
.type-表白 { color: #e86fa3; border-color: rgba(232, 111, 163, 0.3); background: rgba(232, 111, 163, 0.08); }
.type-挂人 { color: #f87171; border-color: rgba(248, 113, 113, 0.3); background: rgba(248, 113, 113, 0.08); }
.type-扩列 { color: #a87fe8; border-color: rgba(168, 127, 232, 0.3); background: rgba(168, 127, 232, 0.08); }
.type-吐槽 { color: #e8c97a; border-color: rgba(232, 201, 122, 0.3); background: rgba(232, 201, 122, 0.08); }
.type-交易 { color: #34d399; border-color: rgba(52, 211, 153, 0.3); background: rgba(52, 211, 153, 0.08); }
.type-捞人、物 { color: #60a5fa; border-color: rgba(96, 165, 250, 0.3); background: rgba(96, 165, 250, 0.08); }
.type-打听资讯 { color: #fbbf24; border-color: rgba(251, 191, 36, 0.3); background: rgba(251, 191, 36, 0.08); }
.type-寻找搭子 { color: #ec4899; border-color: rgba(236, 72, 153, 0.3); background: rgba(236, 72, 153, 0.08); }
.type-有啥说啥 { color: #c084fc; border-color: rgba(192, 132, 252, 0.3); background: rgba(192, 132, 252, 0.08); }

.action-btn {
  font-size: 0.72rem;
  padding: 0.3rem 0.7rem;
  border-radius: 5px;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  font-family: var(--font-ui);
  letter-spacing: 0.04em;
  margin-right: 4px;
}
.action-edit { color: #5de8d0; border-color: rgba(93, 232, 208, 0.35); }
.action-edit:hover { background: rgba(93, 232, 208, 0.15); }
.action-delete { color: var(--color-error); border-color: rgba(248, 113, 113, 0.3); }
.action-delete:hover { background: rgba(248, 113, 113, 0.15); }
.action-transfer { color: #f59e0b; border-color: rgba(249, 115, 22, 0.3); }
.action-transfer:hover { background: rgba(249, 115, 22, 0.15); }
.action-reply { color: #60a5fa; border-color: rgba(96, 165, 250, 0.35); }
.action-reply:hover { background: rgba(96, 165, 250, 0.15); }

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.5rem;
  border-top: 1px solid rgba(75, 47, 163, 0.15);
}
.table-count {
  font-size: 0.75rem;
  color: #7b55d4;
}
.table-pagination {
  display: flex;
  gap: 0.4rem;
}
.tpage-btn {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px;
  border: 1px solid rgba(123, 85, 212, 0.2);
  background: transparent;
  color: var(--accent-light);
  cursor: pointer;
  font-size: 0.78rem;
  transition: all 0.2s;
}
.tpage-btn:hover, .tpage-btn.active {
  background: rgba(123, 85, 212, 0.2);
  border-color: #7b55d4;
  color: var(--text-secondary);
}
.tpage-btn.active {
  background: linear-gradient(135deg, #4c2fa3, #7b55d4);
  border-color: transparent;
  color: white;
}

.empty-table {
  text-align: center;
  padding: 3rem;
  color: #7b55d4;
  font-size: 0.85rem;
}

/* Feedback status badges */
.fb-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.28rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
}
.fb-pending { background: rgba(123, 85, 212, 0.15); color: var(--accent-light); }
.fb-approved { background: rgba(52, 211, 153, 0.15); color: var(--color-success); }
.fb-rejected { background: rgba(248, 113, 113, 0.15); color: var(--color-error); }
.fb-transferred { background: rgba(249, 115, 22, 0.15); color: #f59e0b; }
.fb-replied { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }

/* Reply modal */
.reply-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(1, 2, 6, 0.6);
  z-index: 20000;
  padding: 1rem;
}
.reply-card {
  width: min(720px, 96%);
  padding: 1.5rem;
}
.close-btn {
  background: transparent;
  border: none;
  color: var(--accent-light);
  cursor: pointer;
  font-size: 1.1rem;
}

.modal-enter-active { transition: opacity 0.3s var(--ease-out); }
.modal-leave-active { transition: opacity 0.2s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@media (max-width: 900px) {
  .sidebar { width: 60px; }
  .sidebar-logo-text, .sidebar-logo-sub, .sidebar-link span, .sidebar-section-label, .sidebar-logout span { display: none; }
  .sidebar-logo { padding: 1rem; justify-content: center; }
  .sidebar-link { justify-content: center; padding: 0.7rem; }
  .admin-main { margin-left: 60px; padding: 1.5rem; }
  .form-grid-3 { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .admin-main { margin-left: 0; padding: 1.25rem; padding-bottom: 80px; }
  .sidebar { display: none; }
  .form-grid-3 { grid-template-columns: 1fr; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .table-toolbar { flex-direction: column; align-items: flex-start; }
  .table-search { flex-wrap: wrap; width: 100%; }
  .table-search-input { width: 100%; }
}
</style>
