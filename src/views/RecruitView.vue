<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { recruitmentsApi, recruitApplicantsApi } from '@/services/api'
import { useToast } from '@/composables/useToast'

const { show: showToast } = useToast()

const positions = ref([])
const recruitingOpen = ref(true)
const selectedPositionId = ref('')
const selectedGrade = ref('')
const selectedContactType = ref('QQ')
const currentStep = ref(0)
const rotatingTextIndex = ref(0)
let rotatingTimer = null

const ROTATING_TEXTS = ['南渝万能墙', '北关鱼的驿站', 'BEIGUANYU驿站']

const STEPS = [
  { title: '感谢选择南渝万能墙', desc: '我们提供了旗下各平台的运营岗位。在这里，你可以磨练自己的能力、结识新好友，创造无限可能！' },
  { title: '选择你的意向岗位', desc: '你可以下滑看到我们目前提供的岗位，如感兴趣可以直接点击此岗位标签。' },
  { title: '欢迎加入南渝万能墙', desc: '你可以填写我们准备的意向表让我们联系你。' }
]

const GRADES = ['初2029届', '初2028届', '初2027届', '高2029届', '高2028届', '高2027届', '已毕业']
const CONTACT_TYPES = ['QQ', '微信', '抖音']

const formName = ref('')
const formContact = ref('')
const formSkills = ref('')
const formMsg = ref('')
const formMsgColor = ref('')
const submitting = ref(false)

function setFormMsg(msg, color = '') {
  formMsg.value = msg
  formMsgColor.value = color
}

function nextStep() {
  if (currentStep.value < 2) currentStep.value++
  else currentStep.value = 0
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

function selectPosition(pos) {
  selectedPositionId.value = String(pos.id)
  showToast('已选择：' + pos.title)
}

async function submitApplication() {
  if (!formName.value.trim()) { setFormMsg('请填写姓名', '#ffb3b3'); return }
  if (!selectedGrade.value) { setFormMsg('请选择年级', '#ffb3b3'); return }
  if (!selectedPositionId.value) { setFormMsg('请选择意向岗位', '#ffb3b3'); return }
  if (!formContact.value.trim()) { setFormMsg('请填写联系方式', '#ffb3b3'); return }

  const pos = positions.value.find(p => String(p.id) === selectedPositionId.value)
  submitting.value = true
  setFormMsg('', '')

  try {
    await recruitApplicantsApi.submit({
      name: formName.value.trim(),
      position_id: pos ? pos.id : selectedPositionId.value,
      position_title: pos ? pos.title : '',
      qq: selectedContactType.value + '：' + formContact.value.trim(),
      note: '年级：' + selectedGrade.value + (formSkills.value.trim() ? ' | 技能：' + formSkills.value.trim() : '')
    })
    formName.value = ''
    formContact.value = ''
    formSkills.value = ''
    selectedPositionId.value = ''
    selectedGrade.value = ''
    showToast('报名提交成功，我们会尽快与你联系')
    setFormMsg('提交成功', '#a0f0c0')
  } catch (e) {
    setFormMsg('提交失败：' + (e.message || '请稍后重试'), '#ffb3b3')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const json = await recruitmentsApi.getAll()
    positions.value = Array.isArray(json.data) ? json.data : []
    recruitingOpen.value = json.recruiting_open !== false
  } catch (e) {
    console.warn('加载招聘岗位失败:', e)
  }

  rotatingTimer = setInterval(() => {
    rotatingTextIndex.value = (rotatingTextIndex.value + 1) % ROTATING_TEXTS.length
  }, 2000)
})

onBeforeUnmount(() => {
  if (rotatingTimer) clearInterval(rotatingTimer)
})
</script>

<template>
  <div class="recruit-page">
    <!-- 招募开启：显示完整页面 -->
    <template v-if="recruitingOpen">
      <div class="page-hero">
        <div class="page-orb" />
        <div class="page-hero-content">
          <h1 class="page-title">
            欢迎加入
            <span class="tr-wrap">
              <TransitionGroup name="tr">
                <span :key="rotatingTextIndex" class="tr-text">{{ ROTATING_TEXTS[rotatingTextIndex] }}</span>
              </TransitionGroup>
            </span>
          </h1>
          <p class="page-sub">加入南渝万能墙运营团队</p>
        </div>
      </div>

      <div class="content-section">
        <div class="stepper-container">
        <div class="step-indicator-row">
          <div class="step-indicator">
            <div class="step-indicator-inner" :class="currentStep === 0 ? 'active' : currentStep > 0 ? 'complete' : 'inactive'">
              <div v-if="currentStep === 0" class="active-dot" />
              <svg v-else-if="currentStep > 0" class="check-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span v-else class="step-number">1</span>
            </div>
          </div>
          <div class="step-connector"><div class="step-connector-inner" :class="{ complete: currentStep > 0 }" /></div>
          <div class="step-indicator">
            <div class="step-indicator-inner" :class="currentStep === 1 ? 'active' : currentStep > 1 ? 'complete' : 'inactive'">
              <div v-if="currentStep === 1" class="active-dot" />
              <svg v-else-if="currentStep > 1" class="check-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span v-else class="step-number">2</span>
            </div>
          </div>
          <div class="step-connector"><div class="step-connector-inner" :class="{ complete: currentStep > 1 }" /></div>
          <div class="step-indicator">
            <div class="step-indicator-inner" :class="currentStep === 2 ? 'active' : 'inactive'">
              <div v-if="currentStep === 2" class="active-dot" />
              <span v-else class="step-number">3</span>
            </div>
          </div>
        </div>
        <div class="step-content-area">
          <div class="step-title">{{ STEPS[currentStep].title }}</div>
          <div class="step-desc">{{ STEPS[currentStep].desc }}</div>
        </div>
        <div class="step-footer">
          <div class="step-nav" :class="currentStep === 0 ? 'end' : 'spread'">
            <button v-if="currentStep > 0" class="step-back" type="button" @click="prevStep">Back</button>
            <button class="step-next" type="button" @click="nextStep">{{ currentStep === 2 ? '完成' : '下一步' }}</button>
          </div>
        </div>
      </div>

      <h2 class="section-heading">岗位列表</h2>
      <div class="positions-grid">
        <template v-if="positions.length">
          <div
            v-for="pos in positions"
            :key="pos.id"
            class="position-tag-card"
            :class="{ selected: String(selectedPositionId) === String(pos.id) }"
            @click="selectPosition(pos)"
          >
            <div style="flex:1;min-width:0">
              <div class="pos-name">{{ pos.title }}</div>
              <div v-if="pos.description" class="pos-desc">{{ pos.description.substring(0, 60) }}{{ pos.description.length > 60 ? '…' : '' }}</div>
            </div>
            <div class="pos-check" />
          </div>
        </template>
        <template v-else>
          <div class="empty-card">暂无招聘岗位</div>
        </template>
      </div>

      <div class="form-card">
        <div class="form-card-title">报名意向表</div>
        <div class="form-question">
          <div class="form-q-label"><span class="q-num">1</span> 姓名 <span class="q-required">*</span></div>
          <input type="text" class="glass-input" v-model="formName" placeholder="请输入你的姓名" />
        </div>
        <div class="form-question">
          <div class="form-q-label"><span class="q-num">2</span> 你的年级 <span class="q-required">*</span></div>
          <div class="radio-group">
            <div
              v-for="g in GRADES"
              :key="g"
              class="radio-option"
              :class="{ selected: selectedGrade === g }"
              @click="selectedGrade = g"
            >
              <div class="radio-dot" />
              <span class="radio-label">{{ g }}</span>
            </div>
          </div>
        </div>
        <div class="form-question">
          <div class="form-q-label"><span class="q-num">3</span> 选择意向岗位 <span class="q-required">*</span></div>
          <div class="radio-group">
            <div v-if="positions.length">
              <div
                v-for="pos in positions"
                :key="pos.id"
                class="radio-option"
                :class="{ selected: String(selectedPositionId) === String(pos.id) }"
                @click="selectPosition(pos)"
              >
                <div class="radio-dot" />
                <span class="radio-label">{{ pos.title }}</span>
              </div>
            </div>
            <div v-else class="empty-card" style="min-height:60px;font-size:0.82rem">暂无招聘岗位</div>
          </div>
        </div>
        <div class="form-question">
          <div class="form-q-label"><span class="q-num">4</span> 你的联系方式 <span class="q-required">*</span></div>
          <div class="contact-row">
            <div class="contact-type-group">
              <button
                v-for="ct in CONTACT_TYPES"
                :key="ct"
                class="contact-type-btn"
                :class="{ selected: selectedContactType === ct }"
                type="button"
                @click="selectedContactType = ct"
              >{{ ct }}</button>
            </div>
            <div class="contact-input">
              <input type="text" class="glass-input" v-model="formContact" placeholder="请输入联系方式" />
            </div>
          </div>
        </div>
        <div class="form-divider" />
        <div class="form-question">
          <div class="form-q-label"><span class="q-num">5</span> 你的技能 <span class="q-optional">（选填）</span></div>
          <input type="text" class="glass-input" v-model="formSkills" placeholder="如：视频剪辑、文案写作、活动策划等" />
        </div>
        <div class="form-actions">
          <button class="submit-btn" type="button" :disabled="submitting" @click="submitApplication">
            {{ submitting ? '提交中…' : '提交报名' }}
          </button>
        </div>
        <div v-if="formMsg" class="form-note" :style="{ color: formMsgColor }">{{ formMsg }}</div>
      </div>
    </div>
    </template>

    <!-- 招募关闭：只显示关闭提示 -->
    <div v-else class="content-section recruit-closed-wrap">
      <div class="recruit-closed">
        <div class="recruit-closed-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        </div>
        <h2 class="recruit-closed-title">南渝万能墙目前暂无招募计划</h2>
        <p class="recruit-closed-desc">请留意后续通知，感谢你对南渝万能墙的支持！</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recruit-page {
  min-height: 100vh;
}

.content-section {
  max-width: 640px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 2rem;
  position: relative;
  z-index: 1;
}

/* Rotating text */
.tr-wrap {
  display: inline-flex;
  overflow: hidden;
  padding: 0.1em 0.4em;
  background: rgba(179, 157, 219, 0.15);
  color: var(--accent-dark);
  border-radius: 0.35em;
  vertical-align: bottom;
  min-width: 8ch;
  justify-content: center;
}
.tr-text {
  display: inline-block;
  animation: trSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.tr-enter-active { animation: trSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.tr-leave-active { animation: trSlideOut 0.35s cubic-bezier(0.16, 1, 0.3, 1); position: absolute; }
@keyframes trSlideIn {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes trSlideOut {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(-120%); opacity: 0; }
}

/* 招募关闭提示 */
.recruit-closed {
  margin: 0 auto;
  max-width: 28rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px) saturate(200%);
  -webkit-backdrop-filter: blur(20px) saturate(200%);
  box-shadow: 0 4px 16px rgba(126, 87, 194, 0.08), 0 12px 40px rgba(126, 87, 194, 0.05);
  padding: 3.5rem 2rem;
  text-align: center;
}
.recruit-closed-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.25rem;
  border-radius: 50%;
  background: rgba(179, 157, 219, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-dark);
}
.recruit-closed-icon svg {
  width: 32px;
  height: 32px;
}
.recruit-closed-title {
  font-family: var(--font-title);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.6rem;
}
.recruit-closed-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
}

/* Stepper */
.stepper-container {
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  max-width: 28rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px) saturate(200%);
  -webkit-backdrop-filter: blur(20px) saturate(200%);
  box-shadow:
    0 4px 16px rgba(126, 87, 194, 0.08),
    0 12px 40px rgba(126, 87, 194, 0.05);
  overflow: hidden;
  margin-bottom: 2rem;
}
.step-indicator-row {
  display: flex;
  width: 100%;
  align-items: center;
  padding: 1.5rem 1.5rem 0.5rem;
}
.step-indicator { position: relative; cursor: default; outline: none; }
.step-indicator-inner {
  display: flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  font-weight: 600;
  transition: background-color var(--transition-fast, 0.2s), color var(--transition-fast, 0.2s), box-shadow var(--transition-fast, 0.2s);
}
.step-indicator-inner.inactive { background-color: rgba(179, 157, 219, 0.1); color: var(--text-muted, #9575CD); }
.step-indicator-inner.active { background-color: var(--accent-dark); color: #fff; box-shadow: 0 0 12px rgba(126, 87, 194, 0.3); }
.step-indicator-inner.complete { background-color: var(--accent-dark); color: #3b82f6; }
.active-dot { height: 0.75rem; width: 0.75rem; border-radius: 9999px; background-color: #fff; }
.step-number { font-size: 0.875rem; }
.check-icon { height: 1rem; width: 1rem; color: #fff; }
.step-connector {
  position: relative;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  height: 0.125rem;
  flex: 1;
  overflow: hidden;
  border-radius: 0.25rem;
  background-color: rgba(179, 157, 219, 0.15);
}
.step-connector-inner {
  position: absolute;
  left: 0; top: 0;
  height: 100%;
  width: 0;
  background-color: var(--accent-dark);
  transition: width 0.4s;
  border-radius: 0.25rem;
}
.step-connector-inner.complete { width: 100%; }
.step-content-area { padding: 0.5rem 1.5rem 0; }
.step-title {
  font-family: var(--font-title);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.4rem;
}
.step-desc {
  font-family: var(--font-body);
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.7;
  opacity: 0.85;
}
.step-footer { padding: 0.5rem 1.5rem 1.5rem; }
.step-nav { margin-top: 1rem; display: flex; }
.step-nav.spread { justify-content: space-between; }
.step-nav.end { justify-content: flex-end; }
.step-back {
  transition: all var(--transition-fast, 0.2s);
  border-radius: var(--radius-pill, 100px);
  padding: 0.375rem 0.875rem;
  color: var(--text-muted, #9575CD);
  cursor: pointer;
  background: none;
  border: 1px solid rgba(179, 157, 219, 0.3);
  font-family: var(--font-ui);
  font-size: 0.85rem;
}
.step-back:hover { color: var(--text-secondary, #5C4B8A); border-color: rgba(179, 157, 219, 0.5); }
.step-next {
  transition: all var(--transition-fast, 0.2s);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill, 100px);
  background-color: var(--accent-dark);
  color: #fff;
  font-weight: 500;
  font-family: var(--font-ui);
  font-size: 0.85rem;
  letter-spacing: -0.025em;
  padding: 0.375rem 0.875rem;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(126, 87, 194, 0.25);
}
.step-next:hover { opacity: 0.9; box-shadow: 0 4px 16px rgba(126, 87, 194, 0.35); transform: translateY(-1px); }
.step-next:active { transform: scale(0.97); }

/* Section heading */
.section-heading {
  font-family: var(--font-title);
  font-size: 1.2rem;
  color: var(--accent-dark);
  margin-bottom: 1rem;
}

/* Position cards */
.positions-grid {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 2rem;
}
.position-tag-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.2rem;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(179, 157, 219, 0.2);
  border-radius: var(--radius-md, 16px);
  cursor: pointer;
  transition: all var(--transition-fast, 0.2s cubic-bezier(0.16, 1, 0.3, 1));
  width: 100%;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.position-tag-card:hover { border-color: rgba(179, 157, 219, 0.4); background: rgba(255, 255, 255, 0.7); }
.position-tag-card.selected { border-color: rgba(52, 211, 153, 0.5); background: rgba(52, 211, 153, 0.08); box-shadow: 0 0 12px rgba(52, 211, 153, 0.1); }
.pos-name { font-family: var(--font-ui); font-size: 0.88rem; font-weight: 600; color: var(--text-primary); flex: 1; min-width: 0; }
.pos-desc { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; }
.pos-check {
  width: 20px; height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(179, 157, 219, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
  flex-shrink: 0;
}
.position-tag-card.selected .pos-check { border-color: #34d399; background: #34d399; }
.position-tag-card.selected .pos-check::after { content: ''; width: 6px; height: 6px; border-radius: 50%; background: white; }

.empty-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  padding: 1.5rem;
  color: var(--text-muted);
  border: 1px dashed rgba(179, 157, 219, 0.25);
  background: rgba(255, 255, 255, 0.35);
  border-radius: var(--radius-lg, 24px);
  font-size: 0.88rem;
}

/* Form */
.form-card {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-lg, 24px);
  box-shadow:
    0 4px 16px rgba(126, 87, 194, 0.06),
    0 12px 40px rgba(126, 87, 194, 0.04);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.form-card-title {
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent-dark);
  margin-bottom: 1.5rem;
}
.form-question { margin-bottom: 1.5rem; }
.form-question:last-of-type { margin-bottom: 0; }
.form-q-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-ui);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.6rem;
}
.q-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px; height: 22px;
  border-radius: 6px;
  background: rgba(179, 157, 219, 0.15);
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--accent-dark);
  flex-shrink: 0;
}
.q-required { color: var(--accent-rose); font-size: 0.8rem; }
.q-optional { color: var(--text-muted); font-size: 0.72rem; font-weight: 400; }

/* Radio */
.radio-group { display: flex; flex-direction: column; gap: 0.5rem; }
.radio-option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.9rem;
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(179, 157, 219, 0.15);
  border-radius: var(--radius-sm, 10px);
  cursor: pointer;
  transition: all var(--transition-fast, 0.2s);
  user-select: none;
}
.radio-option:hover { border-color: rgba(179, 157, 219, 0.35); background: rgba(255, 255, 255, 0.6); }
.radio-option.selected { border-color: rgba(179, 157, 219, 0.4); background: rgba(179, 157, 219, 0.1); }
.radio-dot {
  width: 18px; height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(179, 157, 219, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast, 0.2s);
}
.radio-option.selected .radio-dot { border-color: var(--accent-dark); background: var(--accent-dark); }
.radio-option.selected .radio-dot::after { content: ''; width: 6px; height: 6px; border-radius: 50%; background: white; }
.radio-label { font-family: var(--font-ui); font-size: 0.85rem; color: var(--text-secondary); transition: color 0.25s; }
.radio-option.selected .radio-label { color: var(--text-primary); }

/* Contact */
.contact-row { display: flex; gap: 0.5rem; }
.contact-type-group {
  display: flex;
  flex-shrink: 0;
  border: 1px solid rgba(179, 157, 219, 0.2);
  border-radius: var(--radius-sm, 10px);
  overflow: hidden;
}
.contact-type-btn {
  padding: 0.7rem 0.8rem;
  font-family: var(--font-ui);
  font-size: 0.8rem;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.45);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast, 0.2s);
  white-space: nowrap;
  border-right: 1px solid rgba(179, 157, 219, 0.15);
}
.contact-type-btn:last-child { border-right: none; }
.contact-type-btn.selected { background: var(--accent-dark); color: white; }
.contact-input { flex: 1; min-width: 0; }
.contact-input .glass-input { border-top-left-radius: 0; border-bottom-left-radius: 0; }

.form-divider { height: 1px; background: rgba(179, 157, 219, 0.15); margin: 1.5rem 0; }

.form-actions { display: flex; justify-content: center; margin-top: 1.5rem; }
.submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--font-ui);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 0.85rem 0;
  width: 100%;
  border: 1px solid rgba(179, 157, 219, 0.25);
  border-radius: var(--radius-pill, 100px);
  cursor: pointer;
  background: linear-gradient(135deg, rgba(179, 157, 219, 0.5), rgba(126, 87, 194, 0.45));
  color: white;
  transition: all var(--transition-fast, 0.2s cubic-bezier(0.16, 1, 0.3, 1));
  box-shadow: 0 4px 16px rgba(126, 87, 194, 0.2);
}
.submit-btn:hover { background: linear-gradient(135deg, rgba(179, 157, 219, 0.65), rgba(126, 87, 194, 0.6)); box-shadow: 0 6px 24px rgba(126, 87, 194, 0.3); transform: translateY(-1px); }
.submit-btn:active { transform: scale(0.98); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.form-note { text-align: center; margin-top: 0.8rem; font-size: 0.78rem; }

@media (max-width: 768px) {
  .content-section { padding: 1.25rem 1rem; }
  .contact-type-btn { padding: 0.6rem 0.6rem; font-size: 0.75rem; }
}
</style>
