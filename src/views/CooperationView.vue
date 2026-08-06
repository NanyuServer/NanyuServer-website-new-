<script setup>
import { ref } from 'vue'
import { cocreationApi } from '@/services/api'

const VIDEO_ROLES = ['出镜', '配音', '后期', '导演', '编剧', '创作支持']
const STATIC_ROLES = ['出镜', '策划', '拍摄', '文案', '后期']

const VIDEO_LIMITS = { '出镜': Infinity, '配音': Infinity, '后期': 1, '导演': 1, '编剧': 1, '创作支持': 2 }
const STATIC_LIMITS = { '出镜': Infinity, '策划': Infinity, '拍摄': Infinity, '文案': Infinity, '后期': Infinity }

const step = ref(1)
const peopleCount = ref(0)
const mediaType = ref('')
const roles = ref({})
const accounts = ref({})
const confirmed = ref(false)

const showWarningPopup = ref(false)
const warningTitle = ref('')
const warningText = ref('')
const showSuccessPopup = ref(false)
const verificationCode = ref('')

const currentRoles = ref([])

const roleLimits = ref({})

const errors = ref({})
const totalCountMismatch = ref(false)

function getRoles() {
  if (mediaType.value === '视频') {
    roleLimits.value = VIDEO_LIMITS
    return VIDEO_ROLES
  }
  if (mediaType.value === '全为静图') {
    roleLimits.value = STATIC_LIMITS
    return STATIC_ROLES
  }
  return []
}

function selectMediaType(type) {
  mediaType.value = type
  roles.value = {}
  accounts.value = {}
  errors.value = {}

  if (type === '动图+静图') {
    warningTitle.value = '动图+静图模式不支持共创'
    warningText.value = '因抖音限制，动图+静图素材不支持共同创作。您可以将其整合为1个视频，也可以选择将动图转换为静图'
    showWarningPopup.value = true
    return
  }
  if (type === '全为动图') {
    warningTitle.value = '动图不支持共创'
    warningText.value = '因抖音限制，动图素材不支持共同创作。您可以将其整合为1个视频，也可以选择将动图转换为静图'
    showWarningPopup.value = true
    return
  }
  updateRoles(type)
}

function dismissWarning() {
  showWarningPopup.value = false
  mediaType.value = ''
}

function updateRoles(type) {
  if (type === '视频') {
    currentRoles.value = VIDEO_ROLES
    roleLimits.value = VIDEO_LIMITS
  } else if (type === '全为静图') {
    currentRoles.value = STATIC_ROLES
    roleLimits.value = STATIC_LIMITS
  } else {
    currentRoles.value = []
  }
  roles.value = {}
  accounts.value = {}
  errors.value = {}
}

function setRoleCount(role, val) {
  const num = parseInt(val) || 0
  const newRoles = { ...roles.value, [role]: Math.max(0, num) }
  roles.value = newRoles
  const newAccounts = { ...accounts.value }
  if (!newAccounts[role]) newAccounts[role] = []
  while (newAccounts[role].length < num) newAccounts[role].push('')
  while (newAccounts[role].length > num) newAccounts[role].pop()
  accounts.value = newAccounts
  validateRoles()
  totalCountMismatch.value = totalCount() !== peopleCount.value
}

function validateRoles() {
  const limit = roleLimits.value
  const newErrors = {}
  for (const role of Object.keys(roles.value)) {
    const val = roles.value[role]
    const max = limit[role] || Infinity
    if (val > max) {
      newErrors[role] = '该身份人数超过限制'
    }
  }
  errors.value = newErrors
}

function roleErrors() {
  return Object.keys(errors.value).length > 0
}

function totalCount() {
  return Object.values(roles.value).reduce((s, v) => s + (parseInt(v) || 0), 0)
}

function validate() {
  errors.value = {}
  if (!peopleCount.value) { errors._general = '请选择共创人数'; return false }
  if (!mediaType.value) { errors._general = '请选择共创媒体类型'; return false }
  if (currentRoles.value.length === 0) { errors._general = '请选择有效的媒体类型'; return false }
  validateRoles()
  if (roleErrors()) { errors._general = '部分身份人数超过限制'; return false }
  const sum = totalCount()
  if (sum !== peopleCount.value) { errors._general = `您选择的身份总人数(${sum})和共创人数(${peopleCount.value})不符`; return false }
  if (!confirmed.value) { errors._general = '请先确认共创须知'; return false }
  return true
}

async function submitForm() {
  errors.value = {}
  if (!validate()) return

  try {
    const json = await cocreationApi.submit({
      people_count: peopleCount.value,
      media_type: mediaType.value,
      roles: roles.value,
      accounts: accounts.value,
      confirmed: true
    })
    verificationCode.value = json.data.verification_code
    showSuccessPopup.value = true
    resetForm()
  } catch (e) {
    errors.value._general = e.message || '提交失败'
  }
}

function resetForm() {
  step.value = 1
  peopleCount.value = 0
  mediaType.value = ''
  currentRoles.value = []
  roles.value = {}
  accounts.value = {}
  confirmed.value = false
  errors.value = {}
}
</script>

<template>
  <div class="page-hero">
    <div class="page-orb" />
    <div class="page-hero-content">
      <div class="page-label">携手共创</div>
      <h1 class="page-title">共创计划</h1>
      <p class="page-sub">在北关鱼的驿站上发布共创视频</p>
    </div>
  </div>

  <div class="content-section">
    <div class="section-container">
      <div class="cocreation-card glass-card">
        <!-- Q1: 共创人数 -->
        <div class="cq-block">
          <div class="cq-num">Q1</div>
          <div class="cq-title">共创人数</div>
          <div class="cq-options">
            <button v-for="n in 5" :key="n" class="cq-radio" :class="{ selected: peopleCount === n }" @click="peopleCount = n; roles = {}; accounts = {}; errors = {}">
              <span class="cq-radio-dot" />
              {{ n }}人
            </button>
          </div>
        </div>

        <!-- Q2: 共创媒体类型 -->
        <div class="cq-block" v-if="peopleCount > 0">
          <div class="cq-num">Q2</div>
          <div class="cq-title">共创媒体类型</div>
          <div class="cq-options">
            <button class="cq-radio" :class="{ selected: mediaType === '全为静图' }" @click="selectMediaType('全为静图')">全为静图</button>
            <button class="cq-radio" :class="{ selected: mediaType === '视频' }" @click="selectMediaType('视频')">视频</button>
            <button class="cq-radio" :class="{ selected: mediaType === '动图+静图' }" @click="selectMediaType('动图+静图')">动图+静图</button>
            <button class="cq-radio" :class="{ selected: mediaType === '全为动图' }" @click="selectMediaType('全为动图')">全为动图</button>
          </div>
        </div>

        <!-- Q3: 身份人数分配 -->
        <div class="cq-block" v-if="currentRoles.length > 0">
          <div class="cq-num">Q3</div>
          <div class="cq-title">身份人数分配（共需 {{ peopleCount }} 人）</div>
          <div class="cq-role-grid">
            <div v-for="role in currentRoles" :key="role" class="cq-role-item">
              <label class="cq-role-label">{{ role }}</label>
              <input type="number" min="0" class="glass-input cq-role-input" :value="roles[role] || 0" @input="setRoleCount(role, $event.target.value)" />
              <div v-if="errors[role]" class="cq-error">{{ errors[role] }}</div>
            </div>
          </div>
          <div class="cq-total" :class="{ 'cq-mismatch': totalCountMismatch }">当前已分配 <strong>{{ totalCount() }}</strong> / {{ peopleCount }} 人<span v-if="totalCountMismatch">（不一致，请调整）</span></div>
        </div>

        <!-- Q4: 抖音号填写 -->
        <div class="cq-block" v-if="currentRoles.length > 0 && totalCount() > 0">
          <div class="cq-num">Q4</div>
          <div class="cq-title">各身份抖音号</div>
          <div class="cq-account-list">
            <template v-for="role in currentRoles" :key="role">
              <div v-for="(acc, idx) in (accounts[role] || [])" :key="role + idx" class="cq-account-item">
                <label class="cq-role-label">{{ role }}{{ accounts[role].length > 1 ? (idx + 1) : '' }} 抖音号</label>
                <input type="text" class="glass-input" v-model="accounts[role][idx]" placeholder="输入抖音号" />
              </div>
            </template>
          </div>
        </div>

        <!-- Q5: 确认须知 -->
        <div class="cq-block" v-if="currentRoles.length > 0 && totalCount() > 0">
          <div class="cq-num">Q5</div>
          <div class="cq-title">共创须知确认</div>
          <label class="cq-checkbox-wrap">
            <input type="checkbox" class="cq-checkbox" v-model="confirmed" />
            <span class="cq-check-text">
              我已知晓南渝万能墙每月共有4次共创机会，本次共创会进行排期。共创代表在填写报名表后会将素材私信发至北关鱼的驿站（抖音号:cqnyzxwnq）。
            </span>
          </label>
        </div>

        <!-- 提交 -->
        <div v-if="errors._general" class="cq-error cq-general-error">{{ errors._general }}</div>
        <div class="cq-submit-wrap" v-if="peopleCount > 0 && currentRoles.length > 0 && confirmed">
          <button class="glass-btn glass-btn-primary" @click="submitForm">提交共创申请</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 警告弹窗 -->
  <Teleport to="body">
    <div v-if="showWarningPopup" class="popup-overlay" @click.self="dismissWarning">
      <div class="popup-card glass-card">
        <div class="popup-title">{{ warningTitle }}</div>
        <div class="popup-text">{{ warningText }}</div>
        <button class="glass-btn glass-btn-primary popup-btn" @click="dismissWarning">我已知晓</button>
      </div>
    </div>
  </Teleport>

  <!-- 成功弹窗 -->
  <Teleport to="body">
    <div v-if="showSuccessPopup" class="popup-overlay" @click.self="showSuccessPopup = false">
      <div class="popup-card glass-card success-popup">
        <div class="popup-title">您的共创申请已提交</div>
        <div class="popup-text">
          为确保北关鱼的驿站（抖音号:cqnyzxwnq）正确处理您的共创申请，请您在私信发送您的素材前，将6位身份验证码私信发给北关鱼的驿站：
        </div>
        <div class="verification-code">
          <span v-for="(digit, i) in verificationCode.split('')" :key="i" class="code-digit">{{ digit }}</span>
        </div>
        <button class="glass-btn glass-btn-primary popup-btn" @click="showSuccessPopup = false">确定</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.cocreation-card {
  padding: 2.5rem;
  max-width: 800px;
  margin: 0 auto;
}
.cq-block {
  padding: 1.5rem 0;
  border-bottom: 1px solid rgba(179, 157, 219, 0.12);
}
.cq-block:last-of-type {
  border-bottom: none;
}
.cq-num {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}
.cq-title {
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}
.cq-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}
.cq-radio {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border: 1px solid rgba(179, 157, 219, 0.2);
  background: rgba(255, 255, 255, 0.5);
  border-radius: 100px;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--text-secondary);
  transition: all 0.25s;
  font-family: var(--font-ui);
}
.cq-radio:hover {
  border-color: rgba(179, 157, 219, 0.4);
  background: rgba(179, 157, 219, 0.08);
}
.cq-radio.selected {
  background: var(--accent-dark);
  color: white;
  border-color: var(--accent-dark);
}
.cq-radio-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(179, 157, 219, 0.3);
  transition: all 0.2s;
}
.cq-radio.selected .cq-radio-dot {
  border-color: white;
  background: white;
  box-shadow: inset 0 0 0 3px var(--accent-dark);
}
.cq-role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}
.cq-role-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.cq-role-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.cq-role-input {
  width: 100%;
  max-width: 120px;
  text-align: center;
}
.cq-error {
  font-size: 0.75rem;
  color: var(--color-error);
  margin-top: 0.2rem;
}
.cq-general-error {
  font-size: 0.88rem;
  margin-top: 1rem;
  text-align: center;
}
.cq-total {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 1rem;
}
.cq-mismatch {
  color: var(--color-error, #e53935);
  font-weight: 600;
}
.cq-account-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.cq-account-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.cq-checkbox-wrap {
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
  cursor: pointer;
}
.cq-checkbox {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
  accent-color: var(--accent-dark);
}
.cq-check-text {
  font-size: 0.88rem;
  line-height: 1.7;
  color: var(--text-secondary);
}
.cq-submit-wrap {
  text-align: center;
  padding-top: 1.5rem;
}

/* 弹窗 */
.popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 240, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 1rem;
}
.popup-card {
  width: min(480px, 90%);
  padding: 2rem;
  text-align: center;
}
.popup-title {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}
.popup-text {
  font-size: 0.9rem;
  line-height: 1.8;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}
.popup-btn {
  margin-top: 0.5rem;
}
.verification-code {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.code-digit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 56px;
  font-size: 1.6rem;
  font-weight: 700;
  font-family: var(--font-title);
  color: var(--accent-dark);
  background: rgba(179, 157, 219, 0.08);
  border: 2px solid rgba(179, 157, 219, 0.2);
  border-radius: 12px;
}
.success-popup {
  max-width: 520px;
}
</style>
