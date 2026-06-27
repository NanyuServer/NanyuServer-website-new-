<script setup>
import { ref, onMounted } from 'vue'
import { feedbackApi } from '@/services/api'
import { useToast } from '@/composables/useToast'
import GlassSelect from '@/components/common/GlassSelect.vue'
import BorderGlow from '@/components/common/BorderGlow.vue'

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
    <!-- Form -->
    <BorderGlow :border-radius="24">
      <div class="form-card" style="border:none; box-shadow:none; background:transparent">
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
    </BorderGlow>

    <!-- Feedback list -->
    <div class="feedback-list">
      <h2 class="list-title">📋 已审核内容</h2>
      <div class="cards-grid">
        <template v-if="feedbacks.length">
          <BorderGlow v-for="f in feedbacks" :key="f.id" :border-radius="24" :glow-radius="36">
            <div class="submission-card" style="border:none;box-shadow:none;background:transparent">
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
          </BorderGlow>
        </template>
        <template v-else>
          <BorderGlow :border-radius="24">
            <div class="state-box" style="border:none;box-shadow:none;background:transparent">
            <div class="state-title">暂无已审核内容</div>
            <div class="state-sub">已审核的反馈将显示在此</div>
          </div>
          </BorderGlow>
        </template>
      </div>
    </div>
  </div>

  <!-- Success modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showSuccess" class="success-overlay">
        <BorderGlow :border-radius="24">
          <div class="success-card" style="border:none;box-shadow:none;background:transparent">
            <div class="success-icon">✓</div>
            <div class="success-title">反馈提交成功！</div>
            <div class="success-msg">感谢您的建议，我们会认真审核您的反馈，并尽快给予回复。</div>
            <div class="progress-bar">
              <div class="progress-fill" />
            </div>
          </div>
        </BorderGlow>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.content-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 2rem 5rem;
}

.form-card {
  padding: 2rem;
  margin-bottom: 3rem;
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
  color: #f0e6ff;
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
  color: var(--accent-gold);
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
  color: #f0e6ff;
  margin-bottom: 1.5rem;
}
.cards-grid {
  display: grid;
  gap: 1rem;
}
.submission-card {
  padding: 1.6rem 1.8rem;
  transition: border-color 0.3s, transform 0.3s var(--ease-out), box-shadow 0.3s;
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
  letter-spacing: 0.08em;
  padding: 0.3rem 0.8rem;
  border-radius: 100px;
  border: 1px solid rgba(251, 191, 36, 0.35);
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.08);
}
.card-time {
  font-family: var(--font-ui);
  font-size: 0.72rem;
  color: #7b55d4;
  white-space: nowrap;
}
.card-content {
  font-family: var(--font-body);
  font-size: 0.93rem;
  line-height: 1.8;
  color: var(--text-secondary);
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
  padding: 0.3rem 0.7rem;
  border-radius: 100px;
  border: 1px solid;
}
.status-approved { color: #34d399; border-color: rgba(52, 211, 153, 0.35); background: rgba(52, 211, 153, 0.08); }
.status-transferred { color: #f59e0b; border-color: rgba(245, 158, 11, 0.35); background: rgba(245, 158, 11, 0.08); }
.status-replied { color: #60a5fa; border-color: rgba(96, 165, 250, 0.35); background: rgba(96, 165, 250, 0.08); }

.card-reply {
  margin-top: 0.8rem;
  padding: 0.8rem;
  border-left: 3px solid rgba(96, 165, 250, 0.25);
  background: rgba(96, 165, 250, 0.03);
  border-radius: 6px;
  font-size: 0.85rem;
  line-height: 1.6;
}
.reply-title { font-weight: 600; color: var(--accent-light); margin-bottom: 0.4rem; }
.reply-content { color: var(--text-secondary); }

.state-box {
  text-align: center;
  padding: 3rem 2rem;
  border: 1px dashed rgba(123, 85, 212, 0.2);
}
.state-title { font-family: var(--font-title); font-size: 1rem; color: var(--accent-light); margin-bottom: 0.5rem; }
.state-sub { font-family: var(--font-body); font-size: 0.85rem; color: #7b55d4; }

/* Success overlay */
.success-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(1, 2, 6, 0.7);
  z-index: 20000;
}
.success-card {
  padding: 2.5rem;
  width: min(420px, 96%);
  text-align: center;
  animation: successBounce 0.5s var(--ease-out);
}
@keyframes successBounce {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.success-icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  color: #34d399;
}
.success-title {
  font-family: var(--font-title);
  font-size: 1.3rem;
  font-weight: 700;
  color: #34d399;
  margin-bottom: 0.5rem;
}
.success-msg {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--accent-light);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}
.progress-bar {
  width: 100%;
  height: 3px;
  background: rgba(52, 211, 153, 0.2);
  border-radius: 100px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #34d399, #10b981);
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
