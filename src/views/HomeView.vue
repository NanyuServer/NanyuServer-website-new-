<script setup>
import { ref, onMounted, computed } from 'vue'
import { submissionsApi } from '@/services/api'

/* ── 投稿随机抽取 ── */
const allSubmissions = ref([])
const currentCard = ref(null)
const isAnimating = ref(false)
const hasDrawn = ref(false)

const typeEmojiMap = {
  '寻物启事': '🔍', '表白': '💌', '挂人': '⚠️', '扩列': '🤝',
  '吐槽': '💬', '交易': '💰', '捞人、物': '🎣', '打听资讯': '❓',
  '寻找搭子': '👫', '有啥说啥': '🗣️'
}

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const stackedCards = computed(() => allSubmissions.value.slice(0, 5))

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

async function drawRandom() {
  if (isAnimating.value || allSubmissions.value.length === 0) return
  isAnimating.value = true

  // 先触发退出动画
  hasDrawn.value = false

  await new Promise(r => setTimeout(r, 350))

  // 随机选取
  const idx = Math.floor(Math.random() * allSubmissions.value.length)
  currentCard.value = allSubmissions.value[idx]

  // 触发进入动画
  setTimeout(() => {
    hasDrawn.value = true
    isAnimating.value = false
  }, 80)
}

/* ── 功能卡片 ── */
const functionCards = [
  {
    icon: 'search',
    title: '稿件查询',
    desc: '查阅南渝万能墙的稿件',
    link: '/query'
  },
  {
    icon: 'handshake',
    title: '有求必应',
    desc: '提出需求，互帮互助',
    link: '/feedback'
  },
  {
    icon: 'book',
    title: '公益课程',
    desc: '免费公开课程资源',
    link: '/course'
  },
  {
    icon: 'star',
    title: '共创计划',
    desc: '在北关鱼的驿站发稿',
    link: '/cooperation'
  }
]

onMounted(async () => {
  try {
    const json = await submissionsApi.getAll()
    const data = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : [])
    allSubmissions.value = shuffleArray(data)
  } catch (e) {
    console.warn('加载投稿失败:', e)
  }
})
</script>

<template>
  <!-- ═══ 模块二：品牌形象主视觉区 ═══ -->
  <section class="hero-section">
    <!-- 背景装饰 -->
    <div class="hero-bg-orb hero-bg-orb-1" />
    <div class="hero-bg-orb hero-bg-orb-2" />
    <div class="hero-bg-orb hero-bg-orb-3" />

    <div class="hero-container">
      <!-- 左侧文字 -->
      <div class="hero-left">
        <h1 class="hero-title">
          Hi, 这里是<br />南渝万能墙
        </h1>
        <div class="hero-subtitle">
          <span class="hero-subtitle-highlight">Nanyu Server · 2024</span>
        </div>
        <p class="hero-desc">
          南渝万能墙隶属于重庆校墙联，以服务好南渝师生为宗旨。于2024年创立。
        </p>
        <div class="hero-buttons">
          <button class="glass-btn glass-btn-primary hero-btn" @click="$router.push('/query')">
            进入万能墙
          </button>
          <button class="glass-btn glass-btn-ghost hero-btn" @click="window.open('https://www.douyin.com/user/MS4wLjABAAAAVgKoJHBKLxQ4nQk-FQp_9sJZk3NBZ3FD2vN7R8QnWqI', '_blank')">
            北关鱼的驿站
          </button>
        </div>
      </div>

      <!-- 右侧 Logo -->
      <div class="hero-right">
        <div class="logo-glow-ring">
          <div class="logo-glow-inner">
            <img src="/logomini.webp" alt="南渝万能墙 Logo" class="hero-logo" />
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ 模块三：随机抽取同学投稿区 ═══ -->
  <section class="draw-section">
    <div class="draw-container">
      <div class="section-header">
        <div class="section-label-number">01 / PART</div>
        <h2 class="section-main-title">试试抽取一份同学投稿</h2>
      </div>

      <div class="draw-layout">
        <!-- 左侧：叠放卡牌 -->
        <div class="draw-left">
          <div class="card-stack">
            <div
              v-for="(card, i) in stackedCards"
              :key="card.id || i"
              class="stack-card"
              :style="{
                '--i': i,
                transform: `translateY(${i * -4}px) rotate(${-2 + i * 1}deg) scale(${1 - i * 0.02})`,
                zIndex: stackedCards.length - i
              }"
            >
              <div class="stack-card-inner">
                <div class="stack-card-type">{{ typeEmojiMap[card.type] || '📄' }} {{ card.type }}</div>
                <div class="stack-card-preview">{{ card.content?.substring(0, 40) }}...</div>
              </div>
            </div>
            <!-- 空状态 -->
            <div v-if="stackedCards.length === 0" class="stack-card stack-card-empty">
              <div class="stack-card-inner">
                <div class="stack-card-preview">暂无投稿数据</div>
              </div>
            </div>
          </div>

          <!-- 抽取按钮 -->
          <button
            class="draw-btn"
            :class="{ 'is-loading': isAnimating }"
            @click="drawRandom"
            :disabled="isAnimating || allSubmissions.length === 0"
          >
            <span v-if="isAnimating" class="draw-btn-spinner" />
            <span v-else>随机抽一张</span>
          </button>
        </div>

        <!-- 右侧：放大展示卡片 -->
        <div class="draw-right">
          <div class="showcase-card" :class="{ 'has-data': hasDrawn, 'is-flipping': isAnimating }">
            <template v-if="currentCard && hasDrawn">
              <div class="showcase-card-inner">
                <div class="showcase-header">
                  <span class="showcase-type-badge">
                    {{ typeEmojiMap[currentCard.type] || '📄' }} {{ currentCard.type }}
                  </span>
                  <span class="showcase-time">{{ formatDate(currentCard.created_at) }}</span>
                </div>
                <div class="showcase-content">{{ currentCard.content }}</div>
              </div>
            </template>
            <template v-else>
              <div class="showcase-placeholder">
                <div class="placeholder-icon">✨</div>
                <div class="placeholder-text">点击左侧按钮抽取投稿</div>
                <div class="placeholder-sub">每一张都是南渝学子的真实声音</div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ 模块四：平台核心功能区 ═══ -->
  <section class="function-section">
    <div class="function-container">
      <div class="section-header">
        <div class="section-label-number">02 / FUNCTION</div>
        <h2 class="section-main-title">为你的校园保驾护航</h2>
      </div>

      <div class="function-grid">
        <a
          v-for="card in functionCards"
          :key="card.title"
          :href="card.link"
          class="function-card"
        >
          <div class="function-card-icon">
            <!-- 搜索图标 -->
            <svg v-if="card.icon === 'search'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <!-- 握手图标 -->
            <svg v-else-if="card.icon === 'handshake'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 17l-2 2-2-2" />
              <path d="M7 17l2 2 2-2" />
              <path d="M14 7l3-3 3 3" />
              <path d="M14 4l3-3 3 3" />
              <path d="M7 4l-3-3-3 3" />
              <path d="M7 4l-3-3-3 3" />
            </svg>
            <!-- 书本图标 -->
            <svg v-else-if="card.icon === 'book'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            <!-- 星星图标 -->
            <svg v-else-if="card.icon === 'star'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h3 class="function-card-title">{{ card.title }}</h3>
          <p class="function-card-desc">{{ card.desc }}</p>
          <div class="function-card-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </div>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ═══ 模块二：Hero 主视觉区 ═══ */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 8rem 2rem 5rem;
}

.hero-bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  opacity: 0.5;
}
.hero-bg-orb-1 {
  width: 500px; height: 500px;
  top: -100px; left: -100px;
  background: radial-gradient(circle, rgba(179, 157, 219, 0.3), transparent 70%);
  animation: float 8s ease-in-out infinite;
}
.hero-bg-orb-2 {
  width: 400px; height: 400px;
  bottom: -50px; right: -50px;
  background: radial-gradient(circle, rgba(248, 187, 208, 0.2), transparent 70%);
  animation: float 10s ease-in-out infinite 2s;
}
.hero-bg-orb-3 {
  width: 300px; height: 300px;
  top: 30%; right: 20%;
  background: radial-gradient(circle, rgba(224, 242, 241, 0.25), transparent 70%);
  animation: float 12s ease-in-out infinite 4s;
}

.hero-container {
  max-width: 1100px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4rem;
  position: relative;
  z-index: 2;
}

.hero-left {
  flex: 1;
  max-width: 560px;
}

.hero-title {
  font-family: var(--font-title);
  font-size: clamp(2.5rem, 6vw, 4.2rem);
  font-weight: 800;
  line-height: 1.2;
  color: var(--text-primary);
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
  animation: fadeUp 0.8s var(--ease-out) 0.2s both;
}

.hero-subtitle {
  margin-bottom: 1.2rem;
  animation: fadeUp 0.8s var(--ease-out) 0.35s both;
}

.hero-subtitle-highlight {
  display: inline-block;
  font-family: var(--font-ui);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--accent-dark);
  background: rgba(179, 157, 219, 0.15);
  padding: 0.35rem 1rem;
  border-radius: 100px;
  letter-spacing: 0.06em;
}

.hero-desc {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.9;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  max-width: 440px;
  animation: fadeUp 0.8s var(--ease-out) 0.45s both;
}

.hero-buttons {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  animation: fadeUp 0.8s var(--ease-out) 0.55s both;
}

.hero-btn {
  padding: 0.75rem 1.8rem;
  font-size: 0.9rem;
  font-weight: 600;
}

/* 右侧 Logo */
.hero-right {
  flex-shrink: 0;
  animation: fadeUp 0.8s var(--ease-out) 0.4s both;
}

.logo-glow-ring {
  position: relative;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: conic-gradient(
    from 0deg,
    rgba(179, 157, 219, 0.3),
    rgba(248, 187, 208, 0.2),
    rgba(224, 242, 241, 0.3),
    rgba(179, 157, 219, 0.3)
  );
  animation: spin-slow 20s linear infinite;
}
.logo-glow-ring::before {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: rgba(245, 240, 255, 0.9);
}
.logo-glow-inner {
  position: relative;
  z-index: 1;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(179, 157, 219, 0.15);
}
.hero-logo {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  object-fit: cover;
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ═══ 模块三：随机抽取投稿区 ═══ */
.draw-section {
  padding: 6rem 2rem;
  position: relative;
}

.draw-container {
  max-width: 1100px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 3.5rem;
}

.section-label-number {
  font-family: var(--font-ui);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.25em;
  color: var(--text-muted);
  margin-bottom: 0.8rem;
}

.section-main-title {
  font-family: var(--font-title);
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.draw-layout {
  display: flex;
  gap: 3rem;
  align-items: flex-start;
}

/* 左侧：叠放卡牌 */
.draw-left {
  flex: 0 0 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.card-stack {
  position: relative;
  width: 280px;
  height: 200px;
  perspective: 600px;
}

.stack-card {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 8px rgba(179, 157, 219, 0.1), 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: default;
}

.stack-card-inner {
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.6rem;
}

.stack-card-type {
  font-family: var(--font-ui);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent-dark);
  letter-spacing: 0.05em;
}

.stack-card-preview {
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stack-card-empty {
  background: rgba(255, 255, 255, 0.4);
  border-style: dashed;
  border-color: rgba(179, 157, 219, 0.3);
}

/* 抽取按钮 */
.draw-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
  height: 48px;
  padding: 0 2rem;
  font-family: var(--font-ui);
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  background: var(--text-primary);
  border: none;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 16px rgba(45, 27, 105, 0.2);
  letter-spacing: 0.04em;
}
.draw-btn:hover:not(:disabled) {
  background: var(--accent-deep);
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(45, 27, 105, 0.3);
}
.draw-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.draw-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.draw-btn-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* 右侧：放大展示卡片 */
.draw-right {
  flex: 1;
  min-height: 300px;
}

.showcase-card {
  width: 100%;
  min-height: 300px;
  border-radius: var(--radius-2xl);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(200%);
  -webkit-backdrop-filter: blur(20px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow:
    0 8px 32px rgba(179, 157, 219, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.showcase-card.has-data {
  animation: card-flip-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.showcase-card.is-flipping {
  transform: perspective(800px) rotateX(-15deg) scale(0.97);
  opacity: 0.5;
}

.showcase-card-inner {
  padding: 2.5rem;
}

.showcase-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.showcase-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-ui);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 1rem;
  border-radius: 100px;
  background: rgba(179, 157, 219, 0.12);
  color: var(--accent-dark);
  border: 1px solid rgba(179, 157, 219, 0.2);
}

.showcase-time {
  font-family: var(--font-ui);
  font-size: 0.78rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.showcase-content {
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 2;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* 空状态占位 */
.showcase-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 3rem;
  text-align: center;
}
.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: float 3s ease-in-out infinite;
}
.placeholder-text {
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}
.placeholder-sub {
  font-family: var(--font-body);
  font-size: 0.88rem;
  color: var(--text-muted);
}

/* ═══ 模块四：功能区 ═══ */
.function-section {
  padding: 6rem 2rem 8rem;
}

.function-container {
  max-width: 1100px;
  margin: 0 auto;
}

.function-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.function-card {
  display: flex;
  flex-direction: column;
  padding: 2rem;
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 4px 16px rgba(179, 157, 219, 0.08), 0 1px 4px rgba(0, 0, 0, 0.03);
  text-decoration: none;
  color: inherit;
  position: relative;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.function-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%);
  pointer-events: none;
}

.function-card:hover {
  transform: translateY(-6px);
  box-shadow:
    0 12px 40px rgba(179, 157, 219, 0.18),
    0 4px 12px rgba(0, 0, 0, 0.04);
  border-color: rgba(179, 157, 219, 0.3);
}

.function-card-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(179, 157, 219, 0.2), rgba(126, 87, 194, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.2rem;
  border: 1px solid rgba(179, 157, 219, 0.15);
  transition: all 0.3s ease;
}
.function-card:hover .function-card-icon {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-dark));
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(126, 87, 194, 0.25);
}
.function-card-icon svg {
  width: 24px;
  height: 24px;
  stroke: var(--accent-dark);
  transition: stroke 0.3s;
}
.function-card:hover .function-card-icon svg {
  stroke: white;
}

.function-card-title {
  font-family: var(--font-title);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.function-card-desc {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.7;
  flex: 1;
}

.function-card-arrow {
  margin-top: 1.2rem;
  color: var(--text-muted);
  transition: all 0.3s ease;
}
.function-card:hover .function-card-arrow {
  color: var(--accent-dark);
  transform: translate(3px, -3px);
}

/* ═══ 响应式 ═══ */
@media (max-width: 768px) {
  .hero-section {
    padding: 7rem 1.25rem 4rem;
    min-height: 100svh;
  }
  .hero-container {
    flex-direction: column-reverse;
    gap: 2.5rem;
    text-align: center;
  }
  .hero-left {
    max-width: 100%;
  }
  .hero-title {
    font-size: clamp(2rem, 8vw, 3rem);
  }
  .hero-desc {
    max-width: 100%;
  }
  .hero-buttons {
    justify-content: center;
  }
  .logo-glow-ring {
    width: 200px;
    height: 200px;
  }
  .logo-glow-inner {
    width: 170px;
    height: 170px;
  }
  .hero-logo {
    width: 140px;
    height: 140px;
  }

  .draw-layout {
    flex-direction: column;
    gap: 2rem;
  }
  .draw-left {
    flex: none;
    width: 100%;
  }
  .card-stack {
    width: 240px;
    height: 170px;
  }
  .draw-right {
    min-height: 240px;
  }
  .showcase-card {
    min-height: 240px;
  }
  .showcase-card-inner {
    padding: 1.5rem;
  }

  .function-grid {
    grid-template-columns: 1fr;
  }

  .draw-section,
  .function-section {
    padding: 4rem 1.25rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: clamp(1.8rem, 8vw, 2.5rem);
  }
  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }
  .hero-btn {
    width: 100%;
    max-width: 260px;
  }
}
</style>
