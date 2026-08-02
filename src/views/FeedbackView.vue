<script setup>
import { ref, onMounted } from 'vue'
import { feedbackApi } from '@/services/api'
import { useToast } from '@/composables/useToast'
import GlassSelect from '@/components/common/GlassSelect.vue'

const { show: showToast } = useToast()

const category = ref('')
const categoryOptions = [
  { value: '', label: '请选择反馈类型' },
  { value: '校园资讯', label: '校园资讯' },
  { value: '问题反馈', label: '问题反馈' }
]
const content = ref('')
const submitting = ref(false)
const feedbacks = ref([])
const showSuccess = ref(false)

const statusMap = {
  approved: '已审核',
  transferred: '转接中',
  replied: '已回复'
}

async function loadFeedback() {
  try {
    const data = await feedbackApi.getApproved()
    feedbacks.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.warn('加载反馈失败:', e)
  }
}

async function submitForm(e) {
  e.preventDefault()
  if (!category.value) { showToast('请选择反馈类型', 'error'); return }
  if (!content.value.trim()) { showToast('请输入反馈内容', 'error'); return }

  submitting.value = true
  try {
    await feedbackApi.submit({ type: category.value, message: content.value.trim() })
    showSuccess.value = true
    category.value = ''
    content.value = ''
    setTimeout(() => { showSuccess.value = false }, 3000)
    setTimeout(() => loadFeedback(), 500)
  } catch (e) {
    showToast('提交失败: ' + e.message, 'error')
  } finally {
    submitting.value = false
  }
}

onMounted(loadFeedback)
</script>

<template>
  <div class="page-hero">
    <div class="page-orb" />
    <div class="page-hero-content">
      <div class="page-label">意见反馈</div>
      <h1 class="page-title">有求必应</h1>
      <p class="page-sub">提交您的宝贵意见和建议，帮助我们不断改进和完善</p>
    </div>
  </div>

  <div class="content-section">
    <div class="form-card">
      <div class="form-card-title">📝 提交反馈</div>
      <form @submit="submitForm">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">反馈类型 *</label>
            <GlassSelect v-model="category" :options="categoryOptions" placeholder="请选择反馈类型" />
          </div>
          <div class="form-group full">
            <label class="form-label">反馈内容 *</label>
            <textarea class="glass-textarea" v-model="content" placeholder="请输入您的反馈内容..." required />
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="glass-btn glass-btn-primary" :disabled="submitting">
            {{ submitting ? '提交中…' : '提交反馈' }}
          </button>
        </div>
      </form>
    </div>

    <div class="feedback-list">
      <h2 class="list-title">📋 已审核内容</h2>
      <div class="cards-grid">
        <template v-if="feedbacks.length">
          <div v-for="f in feedbacks" :key="f.id" class="submission-card">
            <div class="card-header">
              <span class="card-type-badge">{{ f.type }}</span>
              <span class="card-time">{{ new Date(f.createdAt).toLocaleString('zh-CN') }}</span>
            </div>
            <div class="card-content">{{ f.message }}</div>
            <div class="card-status">
              <span class="status-badge" :class="'status-' + f.status">● {{ statusMap[f.status] || f.status }}</span>
            </div>
            <div v-if="f.reply" class="card-reply">
              <div class="reply-title">💬 万能墙回复：</div>
              <div class="reply-content">{{ f.reply }}</div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="state-box">
            <div class="state-title">暂无已审核内容</div>
            <div class="state-sub">已审核的反馈将显示在此</div>
          </div>
        </template>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-card">
          <div class="success-icon">✓</div>
          <div class="success-title">反馈提交成功！</div>
          <div class="success-msg">感谢您的建议，我们会认真审核您的反馈，并尽快给予回复。</div>
          <div class="progress-bar">
            <div class="progress-fill" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.content-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 2rem 5rem;
  position: relative;
  z-index: 1;
}

.form-card {
  padding: 2rem;
  margin-bottom: 3rem;
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(179, 157, 219, 0.2);
  border-radius: var(--radius-lg, 24px);
}
.form-card-top {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, #7E57C2, #B39DDB, #D1C4E9);
}
.form-card-title {
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
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
  justify-content: flex-end;
}

.feedback-list {
  margin-top: 3rem;
}
.list-title {
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}
.cards-grid {
  display: grid;
  gap: 1rem;
}
.submission-card {
  padding: 1.6rem 1.8rem;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(179, 157, 219, 0.18);
  border-radius: var(--radius-lg, 24px);
  transition: border-color var(--transition-fast, 0.2s), transform var(--transition-normal, 0.35s), box-shadow var(--transition-fast, 0.2s);
}
.submission-card:hover {
  border-color: rgba(179, 157, 219, 0.35);
  box-shadow: 0 4px 16px rgba(81, 45, 168, 0.08);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.9rem;
  gap: 1rem;
  flex-wrap: wrap;
}
.card-type-badge {
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-pill, 100px);
  border: 1px solid rgba(126, 87, 194, 0.3);
  color: var(--accent-dark);
  background: rgba(126, 87, 194, 0.06);
}
.card-time {
  font-family: var(--font-ui);
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
}
.card-content {
  font-family: var(--font-body);
  font-size: 0.93rem;
  line-height: 1.8;
  color: var(--text-primary);
  margin: 0.8rem 0;
}
.card-status {
  display: flex;
  gap: 0.8rem;
  margin-top: 0.8rem;
}
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--font-ui);
  font-size: 0.7rem;
  padding: 0.3rem 0.65rem;
  border-radius: var(--radius-pill, 100px);
  border: 1px solid;
}
.status-approved { color: #43a047; border-color: rgba(67, 160, 71, 0.35); background: rgba(67, 160, 71, 0.08); }
.status-transferred { color: #ef6c00; border-color: rgba(239, 108, 0, 0.35); background: rgba(239, 108, 0, 0.08); }
.status-replied { color: #1e88e5; border-color: rgba(30, 136, 229, 0.35); background: rgba(30, 136, 229, 0.08); }

.card-reply {
  margin-top: 0.8rem;
  padding: 0.8rem;
  border-left: 3px solid rgba(30, 136, 229, 0.25);
  background: rgba(30, 136, 229, 0.04);
  border-radius: 6px;
  font-size: 0.85rem;
  line-height: 1.6;
}
.reply-title { font-weight: 600; color: var(--accent-dark); margin-bottom: 0.4rem; }
.reply-content { color: var(--text-primary); }

.state-box {
  text-align: center;
  padding: 3rem 2rem;
  border: 1px dashed rgba(179, 157, 219, 0.3);
  background: rgba(255, 255, 255, 0.35);
  border-radius: var(--radius-lg, 24px);
}
.state-title { font-family: var(--font-title); font-size: 1rem; color: var(--text-primary); margin-bottom: 0.5rem; }
.state-sub { font-family: var(--font-body); font-size: 0.85rem; color: var(--text-muted); }

.success-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 240, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 20000;
}
.success-card {
  padding: 2.5rem;
  width: min(420px, 96%);
  text-align: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(179, 157, 219, 0.25);
  border-radius: var(--radius-lg, 24px);
  animation: successBounce 0.5s var(--ease-out);
}
@keyframes successBounce {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.success-icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  color: #43a047;
}
.success-title {
  font-family: var(--font-title);
  font-size: 1.3rem;
  font-weight: 700;
  color: #43a047;
  margin-bottom: 0.5rem;
}
.success-msg {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}
.progress-bar {
  width: 100%;
  height: 3px;
  background: rgba(67, 160, 71, 0.2);
  border-radius: 100px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #43a047, #66bb6a);
  width: 100%;
  animation: progressShrink 3s linear forwards;
}
@keyframes progressShrink {
  from { width: 100%; }
  to { width: 0%; }
}

.modal-enter-active { transition: opacity 0.3s var(--ease-out); }
.modal-leave-active { transition: opacity 0.3s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .content-section { padding: 1.5rem; }
  .form-grid { grid-template-columns: 1fr; }
  .submission-card { padding: 1.2rem; }
}
</style>
