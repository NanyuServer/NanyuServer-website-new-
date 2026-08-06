<script setup>
import { ref, computed, onMounted } from 'vue'
import { submissionsApi, adminFeedbackApi, recruitmentsApi, recruitApplicantsApi, authApi, withdrawalsApi, cocreationApi } from '@/services/api'
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
const recruitEditId = ref('')
const recruitApply = ref('')

const withdrawalRecords = ref([])
const cocreationRecords = ref([])
const cocreationEditVisible = ref(false)
const cocreationEditId = ref(null)
const cocreationEditPeople = ref(1)
const cocreationEditMedia = ref('')
const cocreationEditRoles = ref('')
const cocreationEditAccounts = ref('')

const accountOldPass = ref('')
const accountNewPass = ref('')
const accountNewPassConfirm = ref('')

const replyModalVisible = ref(false)
const replyContent = ref('')
const currentReplyId = ref(null)

/* ① 高级视图（全表可编辑） */
const advancedView = ref(false)
const editingRows = ref({})
const savingAll = ref(false)
const advTableRef = ref(null)
const colWidths = ref([60, 180, 150, 0, 70])

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
  if (!iso) return ''
  /* 直接从字符串解析，避免 new Date() 的 UTC 偏移 */
  const s = String(iso).replace('T', ' ')
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})[\sT](\d{2}):(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`
  return s.slice(0, 16)
}

/* ① 解析 YYMMDD / YYYY-MM-DD HH:MM 等多种格式 */
function parseTime(raw) {
  if (!raw || !String(raw).trim()) return ''
  const s = String(raw).trim()

  /* YYMMDD 六位纯数字 */
  if (/^\d{6}$/.test(s)) {
    const yy = parseInt(s.slice(0, 2))
    const mm = parseInt(s.slice(2, 4))
    const dd = parseInt(s.slice(4, 6))
    const y = yy < 50 ? 2000 + yy : 1900 + yy
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return s
    return `${y}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')} 12:00`
  }

  /* 已经是 YYYY-MM-DD HH:MM 格式 */
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s

  /* YYYYMMDD 八位纯数字 */
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} 12:00`
  }

  return s
}

function parseApplicantGrade(note) {
  if (!note) return '—'
  const m = note.match(/年级[：:]\s*([^|]+)/)
  return m ? m[1].trim() : '—'
}

function parseApplicantSkills(note) {
  if (!note) return ''
  const m = note.match(/技能[：:]\s*(.+)/)
  return m ? m[1].trim() : ''
}

const tabTitles = {
  add: { title: '添加稿件', sub: '填写信息后提交至数据库' },
  list: { title: '稿件列表', sub: '查看和管理所有已录入稿件' },
  feedback: { title: '反馈管理', sub: '审核有求必应提交内容并回复用户' },
  recruit: { title: '招贤纳士管理', sub: '管理岗位和报名数据' },
  withdrawal: { title: '撤稿管理', sub: '查看和撤销当事人撤稿记录' },
  cocreation: { title: '共创审核', sub: '查看和管理共创计划申请' },
  account: { title: '账户设置', sub: '修改密码和管理账户' }
}

function showTab(tab) {
  currentTab.value = tab
  if (tab === 'list') loadAllData()
  if (tab === 'feedback') loadFeedbackData()
  if (tab === 'recruit') { loadRecruitData(); loadRecruitApplicants() }
  if (tab === 'withdrawal') loadWithdrawals()
  if (tab === 'cocreation') loadCocreations()
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

/* ① 高级视图：进入时自动填充所有行为可编辑态 + 保存原始数据快照 */
const originalDataSnapshot = ref({})

function enterAdvancedView() {
  advancedView.value = true
  const rows = {}
  const snapshot = {}
  DB.value.forEach(r => {
    const row = {
      created_at: r.created_at ? r.created_at.replace('T', ' ').slice(0, 16) : '',
      type: r.type,
      content: r.content
    }
    rows[r.id] = { ...row }
    snapshot[r.id] = { ...row }
  })
  editingRows.value = rows
  originalDataSnapshot.value = snapshot
}
function exitAdvancedView() {
  advancedView.value = false
  editingRows.value = {}
  originalDataSnapshot.value = {}
}

/* ① 列宽拖拽 */
function startResize(colIndex, e) {
  e.preventDefault()
  const table = advTableRef.value
  if (!table) return
  const th = table.querySelectorAll('thead th')[colIndex]
  if (!th) return
  const startX = e.clientX
  const startW = th.offsetWidth

  function onMove(ev) {
    const delta = ev.clientX - startX
    const newW = Math.max(50, startW + delta)
    colWidths.value[colIndex] = newW
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

/* ① 批量保存：只保存被修改过的行 */
async function saveAllRows() {
  savingAll.value = true
  let successCount = 0
  let failCount = 0
  let skipCount = 0

  const ids = Object.keys(editingRows.value)

  for (const id of ids) {
    const row = editingRows.value[id]
    const original = originalDataSnapshot.value[id]
    if (!row || !original) continue

    /* 比对原始数据，找出变更的字段 */
    const patched = {}
    const parsedTime = parseTime(row.created_at)
    if (parsedTime !== original.created_at && row.created_at !== original.created_at) {
      patched.created_at = parsedTime
    }
    if (row.type !== original.type) patched.type = row.type
    if (row.content !== original.content) patched.content = row.content

    /* 没有变更则跳过 */
    if (Object.keys(patched).length === 0) {
      skipCount++
      continue
    }

    try {
      const res = await fetch(`/api/submissions?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': ADMIN_SECRET.value
        },
        body: JSON.stringify(patched)
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const updated = await res.json()
      const idx = DB.value.findIndex(r => r.id === parseInt(id))
      if (idx !== -1 && updated.data) {
        DB.value[idx] = { ...DB.value[idx], ...updated.data }
      }
      successCount++
    } catch (e) {
      failCount++
    }
  }

  filterTable()
  savingAll.value = false
  if (failCount === 0) {
    showToast(`保存成功 ${successCount} 条` + (skipCount > 0 ? `，${skipCount} 条无变更已跳过` : ''), 'success')
  } else {
    showToast(`${successCount} 条成功，${failCount} 条失败` + (skipCount > 0 ? `，${skipCount} 条跳过` : ''), 'error')
  }
}

function clearForm() {
  fieldContent.value = ''
  fieldType.value = ''
  fieldEditId.value = ''
  initNow()
}

function downloadTemplate() {
  const header = '投稿时间,投稿类型,稿件内容\n'
  const example = '260620,扩列,这是一条示例稿件内容\n'
  const typesNote = '# 投稿时间支持格式: 260620 (YYMMDD) 或 2026-06-20 12:00:00\n'
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
          created_at: timeIdx >= 0 ? parseTime(cols[timeIdx]) : '',
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
          created_at: timeIdx >= 0 ? parseTime(String(row[timeIdx] || '')) : '',
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
        created_at: fieldTime.value,
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
  /* 直接从字符串截取，避免 UTC 偏移 */
  const s = String(r.created_at || '').replace('T', ' ').slice(0, 16)
  fieldTime.value = s
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

/* ── 撤稿管理 ── */
async function loadWithdrawals() {
  try {
    const json = await withdrawalsApi.getAll()
    withdrawalRecords.value = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : [])
  } catch (e) {
    showToast('撤稿数据加载失败：' + e.message, 'error')
  }
}

async function cancelWithdrawal(id) {
  if (!confirm('确认撤销该撤稿记录？稿件将恢复正常显示。')) return
  try {
    await withdrawalsApi.cancel(id)
    withdrawalRecords.value = withdrawalRecords.value.filter(w => w.id !== id)
    showToast('撤稿已撤销，稿件恢复正常显示', 'success')
  } catch (e) {
    showToast('撤销失败：' + e.message, 'error')
  }
}

async function loadCocreations() {
  try {
    const json = await cocreationApi.getAll()
    cocreationRecords.value = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : [])
  } catch (e) {
    showToast('共创数据加载失败：' + e.message, 'error')
  }
}

function openCocreationEdit(r) {
  cocreationEditVisible.value = true
  cocreationEditId.value = r.id
  cocreationEditPeople.value = r.people_count
  cocreationEditMedia.value = r.media_type
  cocreationEditRoles.value = JSON.stringify(r.roles, null, 2)
  cocreationEditAccounts.value = JSON.stringify(r.accounts, null, 2)
}

async function saveCocreationEdit() {
  try {
    let roles, accounts
    try { roles = JSON.parse(cocreationEditRoles.value) } catch (e) { showToast('角色数据不是有效的 JSON', 'error'); return }
    try { accounts = JSON.parse(cocreationEditAccounts.value) } catch (e) { showToast('抖音号数据不是有效的 JSON', 'error'); return }
    await cocreationApi.update(cocreationEditId.value, {
      people_count: parseInt(cocreationEditPeople.value),
      media_type: cocreationEditMedia.value,
      roles,
      accounts
    })
    showToast('共创申请已更新', 'success')
    cocreationEditVisible.value = false
    loadCocreations()
  } catch (e) {
    showToast('更新失败：' + e.message, 'error')
  }
}

async function deleteCocreation(id) {
  if (!confirm('确认删除该共创申请？')) return
  try {
    await cocreationApi.remove(id)
    cocreationRecords.value = cocreationRecords.value.filter(r => r.id !== id)
    showToast('共创申请已删除', 'success')
  } catch (e) {
    showToast('删除失败：' + e.message, 'error')
  }
}

async function toggleCocreationPublished(r) {
  try {
    await cocreationApi.update(r.id, { published: !r.published })
    r.published = !r.published
    showToast(r.published ? '已标记为已发布' : '已取消发布标记', 'success')
  } catch (e) {
    showToast('操作失败：' + e.message, 'error')
  }
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
          <span>招贤纳士</span>
        </button>
        <button class="sidebar-link" :class="{ active: currentTab === 'withdrawal' }" @click="showTab('withdrawal')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
          <span>撤稿管理</span>
        </button>
        <button class="sidebar-link" :class="{ active: currentTab === 'cocreation' }" @click="showTab('cocreation')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span>共创审核</span>
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
            </div><!-- adv-resize-wrap -->
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
            <div class="table-toolbar-title">
              稿件数据列表
              <button v-if="!advancedView" class="adv-toggle adv-only-desktop" @click="enterAdvancedView" type="button">高级视图</button>
              <template v-else>
                <button class="adv-toggle adv-only-desktop active" @click="exitAdvancedView" type="button">退出高级视图</button>
                <button class="adv-toggle adv-only-desktop adv-save" @click="saveAllRows" :disabled="savingAll" type="button">
                  {{ savingAll ? '保存中…' : '保存全部' }}
                </button>
              </template>
            </div>
            <div class="table-search">
              <input type="text" class="glass-input table-search-input" v-model="tableSearch" @input="filterTable" placeholder="搜索稿件内容…" />
              <div style="min-width: 140px;">
                <GlassSelect v-model="tableTypeFilter" :options="[{ value: '', label: '全部类型' }, ...types.map(t => ({ value: t, label: t }))]" placeholder="全部类型" @update:modelValue="filterTable" />
              </div>
            </div>
          </div>
          <!-- 普通视图 -->
          <div v-if="!advancedView" style="overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 60px;">ID</th>
                  <th style="width: 150px;">投稿时间</th>
                  <th style="width: 120px;">投稿类型</th>
                  <th>稿件内容</th>
                  <th style="width: 100px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="pageData.length">
                  <tr v-for="r in pageData" :key="r.id">
                    <td style="color: var(--accent-dark); font-size: 0.75rem">#{{ r.id }}</td>
                    <td style="white-space: nowrap; font-size: 0.78rem">{{ formatDT(r.created_at) }}</td>
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
          <!-- 高级视图：全宽可编辑 -->
          <div v-else class="adv-wrap">
            <table ref="advTableRef" class="data-table data-table-adv">
              <colgroup>
                <col :style="{ width: colWidths[0] + 'px' }" />
                <col :style="{ width: colWidths[1] + 'px' }" />
                <col :style="{ width: colWidths[2] + 'px' }" />
                <col />
                <col :style="{ width: colWidths[4] + 'px' }" />
              </colgroup>
              <thead>
                <tr>
                  <th class="resizable-th" v-for="(label, ci) in ['ID', '投稿时间（YYMMDD）', '投稿类型', '稿件内容', '删除']" :key="ci">
                    {{ label }}
                    <span class="resize-handle" @mousedown="startResize(ci, $event)"></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-if="DB.length">
                  <tr v-for="r in DB" :key="r.id">
                    <td style="color: var(--accent-dark); font-size: 0.75rem">#{{ r.id }}</td>
                    <td>
                      <input v-if="editingRows[r.id]" type="text" class="edit-input" v-model="editingRows[r.id].created_at" />
                    </td>
                    <td>
                      <GlassSelect v-if="editingRows[r.id]" v-model="editingRows[r.id].type" :options="types.map(t => ({ value: t, label: typeEmojiMap[t] + ' ' + t }))" placeholder="类型" />
                    </td>
                    <td>
                      <input v-if="editingRows[r.id]" type="text" class="edit-input edit-wide" v-model="editingRows[r.id].content" />
                    </td>
                    <td>
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
          <!-- 普通视图才显示分页 -->
          <div v-if="!advancedView" class="table-footer">
            <div class="table-count">共 {{ tableFiltered.length }} 条</div>
            <div class="table-pagination">
              <button v-if="tablePage > 1" class="tpage-btn" @click="tGoPage(tablePage - 1)">‹</button>
              <button v-for="i in totalPages" :key="i" class="tpage-btn" :class="{ active: i === tablePage }" @click="tGoPage(i)">{{ i }}</button>
              <button v-if="tablePage < totalPages" class="tpage-btn" @click="tGoPage(tablePage + 1)">›</button>
            </div>
          </div>
          <!-- 高级视图底部统计 -->
          <div v-else class="table-footer">
            <div class="table-count">共 {{ DB.length }} 条（全部可编辑）</div>
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
              <thead><tr><th>ID</th><th>报名时间</th><th>姓名</th><th>年级</th><th>意向岗位</th><th>联系方式</th><th>技能</th></tr></thead>
              <tbody>
                <template v-if="recruitApplicants.length">
                  <tr v-for="a in recruitApplicants" :key="a.id">
                    <td style="color: #7b55d4; font-size: 0.75rem">#{{ a.id }}</td>
                    <td style="white-space: nowrap; font-size: 0.78rem">{{ formatDT(a.created_at) }}</td>
                    <td>{{ a.name }}</td>
                    <td>{{ parseApplicantGrade(a.note) }}</td>
                    <td>{{ a.position_title }}</td>
                    <td>{{ a.qq }}</td>
                    <td class="content-cell" :title="parseApplicantSkills(a.note)">{{ parseApplicantSkills(a.note) || '—' }}</td>
                  </tr>
                </template>
                <template v-else>
                  <tr><td colspan="7" class="empty-table">暂无报名数据</td></tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="table-footer"><div class="table-count">共 {{ recruitApplicants.length }} 条</div></div>
        </div>
      </div>

      <!-- Withdrawal Tab -->
      <div v-show="currentTab === 'withdrawal'">
        <div class="table-card glass-card">
          <div class="table-toolbar">
            <div class="table-toolbar-title">撤稿记录管理</div>
          </div>
          <div style="overflow-x: auto;">
            <table class="data-table" style="table-layout: auto;">
              <thead>
                <tr>
                  <th style="width: 60px;">ID</th>
                  <th style="width: 80px;">稿件ID</th>
                  <th>撤稿稿件内容</th>
                  <th style="width: 120px;">撤稿人QQ</th>
                  <th style="width: 180px;">撤稿时间</th>
                  <th style="width: 80px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="withdrawalRecords.length">
                  <tr v-for="w in withdrawalRecords" :key="w.id">
                    <td style="color: var(--accent-dark); font-size: 0.75rem;">#{{ w.id }}</td>
                    <td style="font-size: 0.78rem;">#{{ w.submission_id }}</td>
                    <td class="content-cell" :title="w.submission_content">{{ w.submission_content }}</td>
                    <td style="font-size: 0.82rem;">{{ w.qq_number }}</td>
                    <td style="white-space: nowrap; font-size: 0.78rem;">{{ formatDT(w.created_at) }}</td>
                    <td>
                      <button class="action-btn action-edit" @click="cancelWithdrawal(w.id)">撤销</button>
                    </td>
                  </tr>
                </template>
                <template v-else>
                  <tr><td colspan="6" class="empty-table">暂无撤稿记录</td></tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="table-footer">
            <div class="table-count">共 {{ withdrawalRecords.length }} 条撤稿记录</div>
          </div>
        </div>
      </div>

      <!-- Cocreation Tab -->
      <div v-show="currentTab === 'cocreation'">
        <div class="table-card glass-card">
          <div class="table-toolbar">
            <div class="table-toolbar-title">共创审核</div>
          </div>
          <div style="overflow-x: auto; max-height: 70vh; overflow-y: auto;">
            <table class="data-table" style="table-layout: auto;">
              <thead>
                <tr>
                  <th style="width: 50px;">ID</th>
                  <th style="width: 70px;">人数</th>
                  <th style="width: 90px;">媒体类型</th>
                  <th>角色分配</th>
                  <th>抖音号</th>
                  <th style="width: 90px;">验证码</th>
                  <th style="width: 90px;">状态</th>
                  <th style="width: 160px;">提交时间</th>
                  <th style="width: 220px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="cocreationRecords.length">
                  <tr v-for="r in cocreationRecords" :key="r.id">
                    <td style="color: var(--accent-dark); font-size: 0.75rem;">#{{ r.id }}</td>
                    <td style="font-size: 0.82rem;">{{ r.people_count }}人</td>
                    <td style="font-size: 0.82rem;">{{ r.media_type }}</td>
                    <td style="font-size: 0.82rem;">
                      <template v-if="r.roles">
                        <span v-for="(v, k) in r.roles" :key="k" v-show="v > 0" class="type-badge" style="margin-right: 4px;">{{ k }}×{{ v }}</span>
                      </template>
                    </td>
                    <td style="font-size: 0.82rem;">
                      <template v-if="r.accounts">
                        <div v-for="(accs, k) in r.accounts" :key="k" v-show="accs && accs.length > 0">
                          <span style="color: var(--text-muted); font-size: 0.72rem;">{{ k }}:</span>
                          <span v-for="(a, i) in accs" :key="i">{{ a }}{{ i < accs.length - 1 ? ', ' : '' }}</span>
                        </div>
                      </template>
                    </td>
                    <td>
                      <span class="type-badge type-扩列" style="font-weight: 700; font-size: 0.85rem; letter-spacing: 0.1em;">{{ r.verification_code }}</span>
                    </td>
                    <td>
                      <span class="type-badge" :class="r.published ? 'type-扩列' : 'fb-pending'">{{ r.published ? '已发布' : '待发布' }}</span>
                    </td>
                    <td style="white-space: nowrap; font-size: 0.78rem;">{{ formatDT(r.created_at) }}</td>
                    <td style="white-space: nowrap;">
                      <button class="action-btn action-edit" @click="openCocreationEdit(r)">编辑</button>
                      <button class="action-btn action-transfer" @click="toggleCocreationPublished(r)">{{ r.published ? '取消发布' : '标记发布' }}</button>
                      <button class="action-btn action-delete" @click="deleteCocreation(r.id)">删除</button>
                    </td>
                  </tr>
                </template>
                <template v-else>
                  <tr><td colspan="9" class="empty-table">暂无共创申请</td></tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="table-footer">
            <div class="table-count">共 {{ cocreationRecords.length }} 条共创申请</div>
          </div>
        </div>
      </div>

      <!-- Cocreation Edit Modal -->
      <div v-if="cocreationEditVisible" class="reply-overlay" @click.self="cocreationEditVisible = false">
        <div class="reply-card glass-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="font-weight: 700; color: var(--text-primary);">编辑共创申请 #{{ cocreationEditId }}</div>
            <button class="close-btn" @click="cocreationEditVisible = false">✕</button>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">共创人数</label>
            <input type="number" class="glass-input" v-model.number="cocreationEditPeople" min="1" max="5" />
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">媒体类型</label>
            <GlassSelect v-model="cocreationEditMedia" :options="[{value:'视频',label:'视频'},{value:'全为静图',label:'全为静图'},{value:'动图+静图',label:'动图+静图'},{value:'全为动图',label:'全为动图'}]" placeholder="选择类型" />
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">角色分配 (JSON)</label>
            <textarea class="glass-textarea" v-model="cocreationEditRoles" style="min-height: 100px; font-family: monospace; font-size: 0.75rem;"></textarea>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">抖音号 (JSON)</label>
            <textarea class="glass-textarea" v-model="cocreationEditAccounts" style="min-height: 100px; font-family: monospace; font-size: 0.75rem;"></textarea>
          </div>
          <div class="form-actions">
            <button class="glass-btn glass-btn-ghost glass-btn-sm" @click="cocreationEditVisible = false">取消</button>
            <button class="glass-btn glass-btn-primary glass-btn-sm" @click="saveCocreationEdit">保存</button>
          </div>
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

    <!-- 手机端底部导航栏（仅移动端显示） -->
    <nav class="mobile-nav">
      <button class="mobile-nav-item" :class="{ active: currentTab === 'add' }" @click="showTab('add')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        <span>添加</span>
      </button>
      <button class="mobile-nav-item" :class="{ active: currentTab === 'list' }" @click="showTab('list')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /></svg>
        <span>稿件</span>
      </button>
      <button class="mobile-nav-item" :class="{ active: currentTab === 'feedback' }" @click="showTab('feedback')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 4.97-4.03 9-9 9a9 9 0 0 1-4-17.18" /><path d="M9 8h6" /><path d="M9 12h4" /></svg>
        <span>反馈</span>
      </button>
      <button class="mobile-nav-item" :class="{ active: currentTab === 'recruit' }" @click="showTab('recruit')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18" /><path d="M3 12h18" /></svg>
        <span>招贤</span>
      </button>
      <button class="mobile-nav-item" :class="{ active: currentTab === 'withdrawal' }" @click="showTab('withdrawal')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
        <span>撤稿</span>
      </button>
      <button class="mobile-nav-item" :class="{ active: currentTab === 'cocreation' }" @click="showTab('cocreation')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span>共创</span>
      </button>
      <button class="mobile-nav-item" :class="{ active: currentTab === 'account' }" @click="showTab('account')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        <span>账户</span>
      </button>
    </nav>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="replyModalVisible" class="reply-overlay" @click.self="replyModalVisible = false">
        <div class="reply-card glass-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-weight: 700; color: var(--text-primary);">回复反馈</div>
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
/* ═══ Login ═══ */
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
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
  background: linear-gradient(90deg, #7E57C2, #B39DDB, #E86FA3);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
.login-logo {
  text-align: center;
  margin-bottom: 2rem;
}
.login-logo-icon {
  width: 56px; height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #7E57C2, #B39DDB);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 0.75rem;
  box-shadow: 0 8px 24px rgba(126, 87, 194, 0.3);
}
.login-logo-title {
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}
.login-logo-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 3px;
}
.login-field {
  margin-bottom: 1.1rem;
}
.login-label {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: var(--accent-dark);
  margin-bottom: 0.4rem;
  display: block;
}
.login-err {
  color: var(--color-error);
  font-size: 0.78rem;
  margin-top: 0.75rem;
  text-align: center;
}

/* ═══ Admin Layout ═══ */
.admin-layout {
  display: flex;
  min-height: 100vh;
}

/* ═══ Sidebar ═══ */
.sidebar {
  position: fixed;
  left: 0; top: 0; bottom: 0;
  width: 220px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-right: 1px solid rgba(179, 157, 219, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 100;
}
.sidebar-logo {
  padding: 1.5rem 1.4rem;
  border-bottom: 1px solid rgba(179, 157, 219, 0.1);
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.sidebar-logo-icon {
  width: 36px; height: 36px;
  border-radius: 9px;
  background: linear-gradient(135deg, #7E57C2, #B39DDB);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.sidebar-logo-text {
  font-family: var(--font-title);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}
.sidebar-logo-sub {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 1px;
}
.sidebar-nav {
  padding: 1.2rem 0.8rem;
  flex: 1;
  overflow-y: auto;
}
.sidebar-section-label {
  font-size: 0.62rem;
  letter-spacing: 0.15em;
  color: var(--text-muted);
  padding: 0 0.6rem;
  margin-bottom: 0.4rem;
  margin-top: 1rem;
}
.sidebar-section-label:first-child {
  margin-top: 0;
}
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.65rem 0.8rem;
  border-radius: 8px;
  color: var(--text-secondary);
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
  background: rgba(179, 157, 219, 0.1);
  color: var(--text-primary);
}
.sidebar-link.active {
  background: rgba(179, 157, 219, 0.15);
  color: var(--accent-dark);
  font-weight: 600;
}
.sidebar-link svg {
  width: 16px; height: 16px;
  flex-shrink: 0;
}
.sidebar-footer {
  padding: 1rem 1.2rem;
  border-top: 1px solid rgba(179, 157, 219, 0.1);
}
.sidebar-logout {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text-muted);
  font-size: 0.8rem;
  cursor: pointer;
  transition: color 0.3s;
  border: none;
  background: none;
  padding: 0.4rem 0;
}
.sidebar-logout:hover {
  color: var(--color-error);
}

/* Mobile nav default: hidden on desktop */
.mobile-nav {
  display: none;
}

/* ═══ Main Content ═══ */
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
  border-bottom: 1px solid rgba(179, 157, 219, 0.12);
}
.admin-topbar-title {
  font-family: var(--font-title);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
}
.admin-topbar-sub {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 2px;
}
.admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.9rem;
  border-radius: 100px;
  background: rgba(102, 187, 106, 0.1);
  border: 1px solid rgba(102, 187, 106, 0.2);
  color: #2e7d32;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
}
.admin-badge::before {
  content: '';
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #66BB6A;
  animation: blink 2s ease infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

/* ═══ Stats ═══ */
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
  color: var(--accent-dark);
  margin-bottom: 0.3rem;
}
.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ═══ Forms ═══ */
.form-card {
  padding: 2rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}
.form-card-title {
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.form-card-title svg { color: var(--text-muted); }
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
  color: var(--accent-dark);
}
.form-actions {
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
}

/* ═══ Bulk Import ═══ */
.bulk-actions {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}
.bulk-preview {
  margin-top: 1.2rem;
  padding-top: 1.2rem;
  border-top: 1px solid rgba(179, 157, 219, 0.12);
}
.bulk-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
  font-size: 0.82rem;
  color: var(--text-secondary);
}
.bulk-result {
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  background: rgba(102, 187, 106, 0.08);
  border: 1px solid rgba(102, 187, 106, 0.2);
  font-size: 0.85rem;
}

/* ═══ Tables ═══ */
.table-card {
  overflow: hidden;
}
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid rgba(179, 157, 219, 0.12);
  gap: 1rem;
  flex-wrap: wrap;
}
.table-toolbar-title {
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
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

.data-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.data-table th {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: var(--accent-dark);
  padding: 0.8rem 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(179, 157, 219, 0.15);
  background: rgba(179, 157, 219, 0.06);
  white-space: nowrap;
}
.data-table td {
  font-size: 0.83rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgba(179, 157, 219, 0.08);
  color: var(--text-secondary);
  vertical-align: middle;
  word-break: break-word;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: rgba(179, 157, 219, 0.05); }
.content-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ═══ Type Badges ═══ */
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
.type-寻物启事 { color: #00897B; border-color: rgba(0,137,123,0.25); background: rgba(0,137,123,0.08); }
.type-表白 { color: #C2185B; border-color: rgba(194,24,91,0.25); background: rgba(194,24,91,0.08); }
.type-挂人 { color: #D32F2F; border-color: rgba(211,47,47,0.25); background: rgba(211,47,47,0.08); }
.type-扩列 { color: #7E57C2; border-color: rgba(126,87,194,0.25); background: rgba(126,87,194,0.08); }
.type-吐槽 { color: #F57F17; border-color: rgba(245,127,23,0.25); background: rgba(245,127,23,0.08); }
.type-交易 { color: #2E7D32; border-color: rgba(46,125,50,0.25); background: rgba(46,125,50,0.08); }
.type-捞人、物 { color: #1565C0; border-color: rgba(21,101,192,0.25); background: rgba(21,101,192,0.08); }
.type-打听资讯 { color: #F9A825; border-color: rgba(249,168,37,0.25); background: rgba(249,168,37,0.08); }
.type-寻找搭子 { color: #AD1457; border-color: rgba(173,20,87,0.25); background: rgba(173,20,87,0.08); }
.type-有啥说啥 { color: #6A1B9A; border-color: rgba(106,27,154,0.25); background: rgba(106,27,154,0.08); }

/* ═══ Action Buttons ═══ */
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
.action-edit { color: #00897B; border-color: rgba(0,137,123,0.3); }
.action-edit:hover { background: rgba(0,137,123,0.1); }
.action-delete { color: #D32F2F; border-color: rgba(211,47,47,0.25); }
.action-delete:hover { background: rgba(211,47,47,0.1); }
.action-transfer { color: #E65100; border-color: rgba(230,81,0,0.25); }
.action-transfer:hover { background: rgba(230,81,0,0.1); }
.action-reply { color: #1565C0; border-color: rgba(21,101,192,0.3); }
.action-reply:hover { background: rgba(21,101,192,0.1); }

/* ═══ Pagination ═══ */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.5rem;
  border-top: 1px solid rgba(179, 157, 219, 0.12);
}
.table-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.table-pagination {
  display: flex;
  gap: 0.4rem;
}
.tpage-btn {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px;
  border: 1px solid rgba(179, 157, 219, 0.2);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.78rem;
  transition: all 0.2s;
}
.tpage-btn:hover { background: rgba(179, 157, 219, 0.1); }
.tpage-btn.active {
  background: var(--accent-dark);
  border-color: transparent;
  color: white;
}

.empty-table {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

/* 高级视图按钮 */
.adv-toggle {
  display: inline-flex;
  align-items: center;
  margin-left: 0.8rem;
  padding: 0.3rem 0.8rem;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  font-weight: 500;
  border: 1px solid rgba(179, 157, 219, 0.2);
  background: rgba(179, 157, 219, 0.06);
  color: var(--text-secondary);
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s;
}
.adv-toggle:hover {
  background: rgba(179, 157, 219, 0.12);
  border-color: rgba(179, 157, 219, 0.3);
}
.adv-toggle.active {
  background: var(--accent-dark);
  color: white;
  border-color: transparent;
}
.adv-save {
  background: #2e7d32;
  color: white;
  border-color: transparent;
}
.adv-save:hover {
  background: #1b5e20;
}
.adv-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
/* 仅电脑端显示高级视图按钮 */
.adv-only-desktop {
  display: inline-flex;
}

/* 高级视图全宽容器 */
.adv-wrap {
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

/* 高级视图可编辑表格 */
.data-table-adv {
  min-width: 800px;
  width: 100%;
  table-layout: fixed;
}
.data-table-adv td {
  padding: 0.5rem 0.8rem;
}
.data-table-adv .edit-input {
  width: 100%;
  font-family: var(--font-ui);
  font-size: 0.8rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid rgba(179, 157, 219, 0.2);
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s;
}
.data-table-adv .edit-input:focus {
  border-color: var(--accent-dark);
  box-shadow: 0 0 0 2px rgba(179, 157, 219, 0.1);
}
.data-table-adv .edit-wide {
  min-width: 100%;
}
.data-table-adv .action-delete {
  font-size: 0.68rem;
  padding: 0.25rem 0.5rem;
}

/* ③ 表头列拖拽手柄 */
.resizable-th {
  position: relative;
  user-select: none;
}
.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.2s;
}
.resize-handle:hover {
  background: rgba(179, 157, 219, 0.25);
}

/* ═══ Feedback Status ═══ */
.fb-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.28rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
}
.fb-pending { background: rgba(179,157,219,0.12); color: var(--accent-dark); }
.fb-approved { background: rgba(102,187,106,0.1); color: #2e7d32; }
.fb-rejected { background: rgba(211,47,47,0.1); color: #c62828; }
.fb-transferred { background: rgba(230,81,0,0.1); color: #e65100; }
.fb-replied { background: rgba(21,101,192,0.1); color: #1565C0; }

/* ═══ Reply Modal ═══ */
.reply-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 240, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
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
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.1rem;
}

.modal-enter-active { transition: opacity 0.3s var(--ease-out); }
.modal-leave-active { transition: opacity 0.2s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

/* ═══ Desktop Sidebar Collapse ═══ */
@media (max-width: 900px) {
  .sidebar { width: 60px; }
  .sidebar-logo-text, .sidebar-logo-sub, .sidebar-link span,
  .sidebar-section-label, .sidebar-logout span { display: none; }
  .sidebar-logo { padding: 1rem; justify-content: center; }
  .sidebar-link { justify-content: center; padding: 0.7rem; }
  .admin-main { margin-left: 60px; padding: 1.5rem; }
  .form-grid-3 { grid-template-columns: 1fr 1fr; }
}

/* ═══ Mobile Bottom Nav ═══ */
@media (max-width: 600px) {
  .sidebar { display: none; }
  .admin-main {
    margin-left: 0;
    padding: 1.25rem;
    padding-bottom: 80px;
    overflow-x: hidden;
  }
  .form-grid-3 { grid-template-columns: 1fr; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .table-toolbar { flex-direction: column; align-items: flex-start; }
  .table-search { flex-wrap: wrap; width: 100%; }
  .table-search-input { width: 100%; }

  .table-card {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .data-table {
    min-width: 600px;
  }

  /* 手机端隐藏高级视图按钮 */
  .adv-only-desktop {
    display: none !important;
  }

  .mobile-nav {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 64px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border-top: 1px solid rgba(179, 157, 219, 0.12);
    display: flex;
    align-items: center;
    justify-content: space-around;
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .mobile-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
    border: none;
    background: none;
    cursor: pointer;
    transition: all 0.25s;
    min-width: 56px;
  }
  .mobile-nav-item svg {
    width: 20px; height: 20px;
    color: var(--text-muted);
    transition: color 0.25s;
  }
  .mobile-nav-item span {
    font-size: 0.6rem;
    color: var(--text-muted);
    transition: color 0.25s;
  }
  .mobile-nav-item.active svg { color: var(--accent-dark); }
  .mobile-nav-item.active span { color: var(--accent-dark); font-weight: 600; }
}
</style>
