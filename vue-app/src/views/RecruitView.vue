<script setup>
import { ref, onMounted } from 'vue'
import { recruitmentsApi, recruitApplicantsApi } from '@/services/api'
import { useToast } from '@/composables/useToast'

const { show: showToast } = useToast()

const positions = ref([])
const selectedId = ref(null)

const name = ref('')
const positionId = ref('')
const qq = ref('')
const note = ref('')
const formNote = ref('我们会尽快联系你，请保证联系方式正确。')
const formNoteColor = ref('')
const submitting = ref(false)

function setFormNote(msg, color = '') {
  formNote.value = msg
  formNoteColor.value = color
}

function selectPosition(id) {
  selectedId.value = id
  positionId.value = String(id)
  const pos = positions.value.find(p => String(p.id) === String(id))
  if (pos) {
    setFormNote(`已选择岗位：${pos.title}，请完成报名信息后提交。`, '#a0f0c0')
  }
}

async function submitApplication() {
  if (!name.value.trim()) { setFormNote('请输入姓名', '#ffb3b3'); return }
  if (!positionId.value) { setFormNote('请选择意向岗位', '#ffb3b3'); return }
  if (!qq.value.trim()) { setFormNote('请输入QQ联系方式', '#ffb3b3'); return }

  const pos = positions.value.find(p => String(p.id) === positionId.value)
  if (!pos) { setFormNote('请选择有效的意向岗位', '#ffb3b3'); return }

  submitting.value = true
  setFormNote('正在提交，请稍候…', '')

  try {
    await recruitApplicantsApi.submit({
      name: name.value.trim(),
      position_id: pos.id,
      position_title: pos.title,
      qq: qq.value.trim(),
      note: note.value.trim()
    })
    name.value = ''
    positionId.value = ''
    qq.value = ''
    note.value = ''
    selectedId.value = null
    setFormNote('报名提交成功，我们会尽快与你联系', '#a0f0c0')
  } catch (e) {
    setFormNote('提交失败：' + (e.message || '请稍后重试'), '#ffb3b3')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const json = await recruitmentsApi.getAll()
    positions.value = Array.isArray(json.data) ? json.data : []
  } catch (e) {
    console.warn('加载招聘岗位失败:', e)
  }
})
</script>

<template>
  <div class="page-hero">
    <div class="page-orb" />
    <div class="page-hero-content">
      <div class="page-label">加入我们</div>
      <h1 class="page-title">招贤纳士</h1>
      <p class="page-sub">诚邀优秀的学生加入运营团队，共同为校园服务</p>
    </div>
  </div>

  <div class="content-section">
    <div class="info-card glass-card">
      <div class="info-title">📋 关于本岗位</div>
      <div class="info-text">南渝万能墙是一个致力于为学生服务的校园平台，我们诚邀热心、有想法、有执行力的同学加入我们的运营团队。通过参与平台的日常运营，你将获得宝贵的团队协作、项目管理和沟通能力。</div>
    </div>

    <div style="margin-bottom: 2rem;">
      <h2 class="section-heading">🎯 招聘岗位</h2>
      <div class="positions-grid">
        <template v-if="positions.length">
          <div
            v-for="pos in positions"
            :key="pos.id"
            class="position-card glass-card"
            :class="{ selected: String(selectedId) === String(pos.id) }"
            @click="selectPosition(pos.id)"
          >
            <div class="position-title">{{ pos.title }}</div>
            <div class="position-desc">{{ pos.description }}</div>
            <template v-if="pos.tags">
              <span v-for="tag in pos.tags.split(',')" :key="tag" class="position-tag">{{ tag.trim() }}</span>
            </template>
            <a v-if="pos.apply_url" :href="pos.apply_url" target="_blank" class="position-link glass-btn glass-btn-primary glass-btn-sm" @click.stop>立即报名</a>
          </div>
        </template>
        <template v-else>
          <div class="empty-card glass-card">招聘岗位加载中，请稍候。</div>
        </template>
      </div>
    </div>

    <div class="form-card glass-card">
      <div class="form-card-top" />
      <div class="form-card-title">📝 岗位报名</div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">姓名</label>
          <input type="text" class="glass-input" v-model="name" placeholder="请输入姓名" />
        </div>
        <div class="form-group">
          <label class="form-label">意向岗位</label>
          <select class="glass-select" v-model="positionId">
            <option value="">请选择意向岗位</option>
            <option v-for="pos in positions" :key="pos.id" :value="String(pos.id)">{{ pos.title }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">联系方式（QQ）</label>
          <input type="text" class="glass-input" v-model="qq" placeholder="请输入QQ号" />
        </div>
        <div class="form-group full">
          <label class="form-label">备注（选填）</label>
          <textarea class="glass-textarea" v-model="note" placeholder="如有特殊时间、技能或期望可以填写" rows="4" />
        </div>
      </div>
      <div class="form-actions">
        <button class="glass-btn glass-btn-primary" @click="submitApplication" :disabled="submitting">
          {{ submitting ? '提交中…' : '提交报名' }}
        </button>
      </div>
      <div class="form-note" :style="{ color: formNoteColor || '#7b55d4' }">{{ formNote }}</div>
    </div>
  </div>
</template>

<style scoped>
.content-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 2rem;
}
.info-card {
  padding: 2rem;
  margin-bottom: 2rem;
}
.info-title {
  font-family: var(--font-title);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--accent-gold);
  margin-bottom: 1rem;
}
.info-text {
  font-family: var(--font-body);
  font-size: 0.95rem;
  line-height: 1.8;
  color: var(--text-secondary);
}
.section-heading {
  font-family: var(--font-title);
  font-size: 1.3rem;
  color: var(--accent-gold);
  margin-bottom: 1.5rem;
}
.positions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
.position-card {
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s var(--ease-out);
  border: 1px solid rgba(123, 85, 212, 0.25);
}
.position-card.selected {
  border-color: #a0f0c0;
  box-shadow: 0 0 0 2px rgba(160, 240, 192, 0.18);
}
.position-title {
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent-gold);
  margin-bottom: 0.5rem;
}
.position-desc {
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--accent-light);
  line-height: 1.6;
  margin-bottom: 1rem;
}
.position-tag {
  display: inline-block;
  padding: 0.3rem 0.7rem;
  background: rgba(123, 85, 212, 0.2);
  border-radius: 4px;
  font-size: 0.75rem;
  color: white;
  font-weight: 500;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}
.position-link {
  margin-top: 0.75rem;
  text-decoration: none;
}
.empty-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  padding: 1.5rem;
  color: var(--accent-light);
  border: 1px dashed rgba(123, 85, 212, 0.4);
  grid-column: 1 / -1;
}

.form-card {
  padding: 2rem;
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
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent-gold);
  margin-bottom: 1.25rem;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.form-group.full {
  grid-column: 1 / -1;
}
.form-label {
  color: var(--accent-light);
  font-size: 0.9rem;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.9rem;
  margin-top: 1.2rem;
}
.form-note {
  margin-top: 0.85rem;
  font-size: 0.9rem;
  transition: color 0.3s;
}

@media (max-width: 768px) {
  .content-section { padding: 2rem 1.25rem; }
  .positions-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
