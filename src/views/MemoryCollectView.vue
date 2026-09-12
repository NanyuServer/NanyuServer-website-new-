<script setup>
import { ref, computed } from 'vue'
import { memorySubmissionsApi } from '@/services/api'
import { useToast } from '@/composables/useToast'

const { show: showToast } = useToast()

const MEMORY_TYPES = ['文字', '图片', '视频', '音频']
const CONTACT_TYPES = ['QQ', '微信', '抖音']

const nickname = ref('')
const realName = ref('')
const selectedTypes = ref([])
const textMemory = ref('')
const contactType = ref('QQ')
const contactValue = ref('')
const confirmed = ref(false)
const submitting = ref(false)

const showTextMemory = computed(() => selectedTypes.value.includes('文字'))

function toggleType(t) {
  const idx = selectedTypes.value.indexOf(t)
  if (idx >= 0) selectedTypes.value.splice(idx, 1)
  else selectedTypes.value.push(t)
}

const showSuccess = ref(false)

async function submitForm() {
  if (!nickname.value.trim()) { showToast('请填写昵称', 'error'); return }
  if (selectedTypes.value.length === 0) { showToast('请选择至少一种回忆类型', 'error'); return }
  if (showTextMemory.value && !textMemory.value.trim()) { showToast('请填写文字回忆', 'error'); return }
  if (!contactValue.value.trim()) { showToast('请填写联系方式', 'error'); return }
  if (!confirmed.value) { showToast('请勾选确认框', 'error'); return }

  submitting.value = true
  try {
    await memorySubmissionsApi.submit({
      nickname: nickname.value.trim(),
      real_name: realName.value.trim(),
      memory_types: selectedTypes.value,
      text_content: textMemory.value.trim(),
      contact_type: contactType.value,
      contact_value: contactValue.value.trim()
    })
    showSuccess.value = true
    nickname.value = ''
    realName.value = ''
    selectedTypes.value = []
    textMemory.value = ''
    contactType.value = 'QQ'
    contactValue.value = ''
    confirmed.value = false
  } catch (e) {
    showToast('提交失败：' + (e.message || '请稍后重试'), 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page-hero">
    <div class="page-orb" />
    <div class="page-hero-content">
      <div class="page-label">将故事写进回忆录</div>
      <h1 class="page-title">将故事写进回忆录</h1>
      <p class="page-sub">南渝万能墙2027年高考祝福计划</p>
    </div>
  </div>

  <div class="content-section">
    <div class="section-container">
      <div class="memory-card glass-card">
        <div class="mc-header">
          <div class="mc-title">共同书写我们的青春回忆</div>
          <div class="mc-desc">南渝万能墙希望高2027届同学们能够分享你的高中时光。可以是文字，图片抑或是视频。</div>
        </div>

        <div class="cq-block">
          <div class="cq-num">Q1</div>
          <div class="cq-title">你的昵称 <span class="q-required">*</span></div>
          <div class="cq-hint">用于视频中标记出处，可以是抖音、微信昵称</div>
          <input type="text" class="glass-input" v-model="nickname" placeholder="请输入你的昵称" />
        </div>

        <div class="cq-block">
          <div class="cq-num">Q2</div>
          <div class="cq-title">你的姓名 <span class="q-optional">（选填）</span></div>
          <input type="text" class="glass-input" v-model="realName" placeholder="请输入你的真实姓名" />
        </div>

        <div class="cq-block">
          <div class="cq-num">Q3</div>
          <div class="cq-title">你想分享的回忆类型 <span class="q-required">*</span></div>
          <div class="cq-options">
            <button
              v-for="t in MEMORY_TYPES"
              :key="t"
              class="cq-radio"
              :class="{ selected: selectedTypes.includes(t) }"
              type="button"
              @click="toggleType(t)"
            >
              <span class="cq-check-box">
                <svg v-if="selectedTypes.includes(t)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              {{ t }}
            </button>
          </div>
        </div>

        <Transition name="fade-slide">
          <div v-if="showTextMemory" class="cq-block">
            <div class="cq-num">Q4</div>
            <div class="cq-title">你的文字回忆 <span class="q-required">*</span></div>
            <textarea class="glass-textarea" v-model="textMemory" placeholder="请写下你的文字回忆…" rows="5" />
          </div>
        </Transition>

        <div class="cq-block">
          <div class="cq-num">{{ showTextMemory ? 'Q5' : 'Q4' }}</div>
          <div class="cq-title">你的联系方式 <span class="q-required">*</span></div>
          <div class="contact-row">
            <div class="contact-type-group">
              <button
                v-for="ct in CONTACT_TYPES"
                :key="ct"
                class="contact-type-btn"
                :class="{ selected: contactType === ct }"
                type="button"
                @click="contactType = ct"
              >{{ ct }}</button>
            </div>
            <div class="contact-input">
              <input type="text" class="glass-input" v-model="contactValue" placeholder="请输入联系方式" />
            </div>
          </div>
        </div>

        <div class="cq-block">
          <div class="cq-checkbox-wrap" :class="{ checked: confirmed }" @click="confirmed = !confirmed">
            <span class="cq-checkbox-custom">
              <svg v-if="confirmed" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
            <span class="cq-check-text">
              我已知晓南渝万能墙会在我的申请发出后及时联系我获取媒体文件。
            </span>
          </div>
        </div>

        <div class="cq-submit-wrap">
          <button class="glass-btn glass-btn-primary" :disabled="submitting" @click="submitForm">
            {{ submitting ? '提交中…' : '提交' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="pop">
      <div v-if="showSuccess" class="popup-overlay" @click.self="showSuccess = false">
        <div class="popup-card glass-card">
          <div class="popup-title">提交成功！</div>
          <div class="popup-text">感谢你的分享，南渝万能墙会尽快联系你获取媒体文件。</div>
          <button class="glass-btn glass-btn-primary popup-btn" @click="showSuccess = false">确定</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.content-section {
  max-width: 640px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 5rem;
  position: relative;
  z-index: 1;
}

.memory-card {
  padding: 2rem;
}

.mc-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(179, 157, 219, 0.12);
}

.mc-title {
  font-family: var(--font-title);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--accent-dark);
  margin-bottom: 0.6rem;
}

.mc-desc {
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.7;
}

.cq-block {
  padding: 1.2rem 0;
  border-bottom: 1px solid rgba(179, 157, 219, 0.1);
}

.cq-block:last-of-type {
  border-bottom: none;
}

.cq-num {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
}

.cq-title {
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.8rem;
}

.cq-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: 0.6rem;
}

.q-required { color: var(--color-error); font-size: 0.78rem; }
.q-optional { color: var(--text-muted); font-size: 0.72rem; font-weight: 400; }

.cq-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.cq-radio {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1.1rem;
  border: 1px solid rgba(179, 157, 219, 0.2);
  background: rgba(255, 255, 255, 0.5);
  border-radius: 100px;
  cursor: pointer;
  font-size: 0.85rem;
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

.cq-check-box {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 2px solid rgba(179, 157, 219, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.cq-radio.selected .cq-check-box {
  border-color: white;
  background: rgba(255, 255, 255, 0.2);
}

/* Contact */
.contact-row {
  display: flex;
  gap: 0.5rem;
}

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

.contact-type-btn:last-child {
  border-right: none;
}

.contact-type-btn.selected {
  background: var(--accent-dark);
  color: white;
}

.contact-input {
  flex: 1;
  min-width: 0;
}

.contact-input .glass-input {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

/* Checkbox */
.cq-checkbox-wrap {
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
  cursor: pointer;
  padding: 0.5rem 0;
}

.cq-checkbox-custom {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  margin-top: 2px;
  border-radius: 8px;
  border: 2px solid rgba(179, 157, 219, 0.3);
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
}

.cq-checkbox-wrap.checked .cq-checkbox-custom {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent-primary));
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(126, 87, 194, 0.25);
}

.cq-check-text {
  font-size: 0.85rem;
  line-height: 1.7;
  color: var(--text-secondary);
  user-select: none;
}

.cq-submit-wrap {
  text-align: center;
  padding-top: 1.5rem;
}

.cq-submit-wrap .glass-btn {
  width: 100%;
  padding: 0.85rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

/* Popup */
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

.pop-enter-active {
  transition: opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.pop-leave-active {
  transition: opacity 0.2s cubic-bezier(0.55, 0, 0.55, 0.2);
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
}

.pop-enter-from .popup-card {
  transform: translateY(24px) scale(0.92);
  opacity: 0;
}

.pop-enter-active .popup-card {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.pop-leave-active .popup-card {
  transition: transform 0.2s cubic-bezier(0.55, 0, 0.55, 0.2), opacity 0.2s cubic-bezier(0.55, 0, 0.55, 0.2);
}

.pop-leave-to .popup-card {
  transform: translateY(-10px) scale(0.95);
  opacity: 0;
}

.fade-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.55, 0, 0.55, 0.2);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .content-section {
    padding: 1.25rem 1rem 4rem;
  }

  .memory-card {
    padding: 1.25rem;
    border-radius: 20px;
  }

  .cq-title {
    font-size: 0.95rem;
  }

  .cq-block {
    padding: 1rem 0;
  }

  .contact-type-btn {
    padding: 0.6rem 0.6rem;
    font-size: 0.75rem;
  }
}
</style>
