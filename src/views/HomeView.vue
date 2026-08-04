<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { submissionsApi } from '@/services/api'

/* ── Logo 轮播 ── */
const logoSlides = [
  { src: '/logomini.webp', platform: 'QQ', name: '南渝万能墙', desc: '提供校园论坛服务' },
  { src: '/douyin.webp', platform: '抖音', name: '北关鱼的驿站', desc: '校园宣传阵地' },
  { src: '/wechat.webp', platform: '微信公众号', name: 'BEIGUANYU驿站', desc: '提供微信投稿服务' }
]
const logoIndex = ref(0)
const logoAnimating = ref(false)
let logoTimer = null

function nextLogo() {
  logoAnimating.value = true
  setTimeout(() => {
    logoIndex.value = (logoIndex.value + 1) % logoSlides.length
    setTimeout(() => { logoAnimating.value = false }, 50)
  }, 400)
}

onMounted(() => { logoTimer = setInterval(nextLogo, 4000) })
onBeforeUnmount(() => { if (logoTimer) clearInterval(logoTimer) })

/* ── 投稿随机抽取（迁移自3D卡牌模块） ── */
const allSubmissions = ref([])
const currentCard = ref(null)
const isAnimating = ref(false)
const hasDrawn = ref(false)
const detailGlow = ref(false)
const rightPhase = ref('')  /* '' | 'elastic' | 'show' */
const flyPhase = ref('')    /* '' | 'flying' */

/* 3张可见卡牌（c0底 c1中 c2顶） */
const DECK_VISIBLE = 3
const visibleCards = ref([])
const flyCardState = ref(null) /* {img} or null */
const newCardEnter = ref(false)
const newCardEntered = ref(false)
const deckC0Ref = ref(null)
let lastImgUsed = ''

const cardBackImages = [
  '/card/card (1).webp',
  '/card/card (2).webp',
  '/card/card (3).webp',
  '/card/card (4).webp',
  '/card/card (5).webp'
]

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

function randomImg() {
  let img
  do {
    img = cardBackImages[Math.floor(Math.random() * cardBackImages.length)]
  } while (img === lastImgUsed && cardBackImages.length > 1)
  lastImgUsed = img
  return img
}

function formatDate(iso) {
  if (!iso) return ''
  const s = String(iso).replace('T', ' ')
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})[\sT](\d{2}):(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`
  return s.slice(0, 16)
}

function initVisible() {
  visibleCards.value = Array.from({ length: DECK_VISIBLE }, () => randomImg())
  flyCardState.value = null
}

/* ③ 无空闲轮播 — 卡牌保持静态 */

/* ── 抽卡流程 ── */
async function drawRandom() {
  if (isAnimating.value || allSubmissions.value.length === 0) return
  isAnimating.value = true
  hasDrawn.value = false
  detailGlow.value = false
  rightPhase.value = ''
  flyPhase.value = ''

  /* 1. 顶卡飞出到画面中央 */
  flyCardState.value = { img: visibleCards.value[2] }
  flyPhase.value = 'flying'
  await new Promise(r => setTimeout(r, 100))

  /* 2. 底卡→中卡→顶卡递补，新卡从底部淡入 */
  visibleCards.value = [
    randomImg(),
    visibleCards.value[0],
    visibleCards.value[1]
  ]
  newCardEnter.value = true
  newCardEntered.value = false
  await nextTick()
  await new Promise(r => setTimeout(r, 20))
  newCardEntered.value = true
  await new Promise(r => setTimeout(r, 700))
  newCardEnter.value = false
  newCardEntered.value = false

  /* 3. 卡片淡出完毕 */
  await new Promise(r => setTimeout(r, 600))
  flyCardState.value = null
  flyPhase.value = ''

  /* 4. 右侧文字淡入 + 金光扫边 */
  const idx = Math.floor(Math.random() * allSubmissions.value.length)
  currentCard.value = allSubmissions.value[idx]

  rightPhase.value = 'elastic'
  await new Promise(r => setTimeout(r, 500))

  rightPhase.value = 'show'
  detailGlow.value = true
  hasDrawn.value = true
  isAnimating.value = false

  setTimeout(() => { detailGlow.value = false }, 1500)
}

onMounted(async () => {
  try {
    const json = await submissionsApi.getAll()
    const data = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : [])
    allSubmissions.value = shuffleArray(data)
  } catch (e) { console.warn('加载投稿失败:', e) }
  initVisible()
})
onBeforeUnmount(() => {})

/* ── 功能卡片 ── */
const functionCards = [
  { icon: 'search', title: '稿件查询', desc: '查阅南渝万能墙的稿件', link: '/query' },
  { icon: 'handshake', title: '有求必应', desc: '提出需求，互帮互助', link: '/feedback' },
  { icon: 'book', title: '公益课程', desc: '免费公开课程资源', link: '/course' },
  { icon: 'star', title: '共创计划', desc: '在北关鱼的驿站发稿', link: '/cooperation' }
]

/* ── 平台数据（动态计算） ── */
const foundedDate = new Date('2024-08-08')
const daysSinceFounded = computed(() => {
  const now = new Date()
  const diff = now.getTime() - foundedDate.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
})
const stats = computed(() => [
  { num: '1900+', label: '服务学子' },
  { num: String(allSubmissions.value.length || '0'), label: '可查询稿件数' },
  { num: String(daysSinceFounded.value), label: '已成立（天）' }
])
</script>

<template>
  <!-- ═══ Hero 主视觉区 ═══ -->
  <section class="hero">
    <div class="hero-container">
      <!-- 左侧文字 -->
      <div class="hero-left">
        <div class="hero-tag">
          <span class="tag-dot" />
          HELLO / 你好
        </div>
        <h1 class="hero-title">
          Hi, 这里是南渝万能墙
        </h1>
        <div class="hero-file-bar">
          <span class="file-label">MEMBER OF /</span>
          <span class="file-value">重庆校墙联</span>
        </div>
        <p class="hero-desc">
          南渝万能墙建立于2024年8月8日。以服务好南渝师生为宗旨，我们致力于为南渝学子提供信息交流、资源共享平台。非校方组织。
        </p>
        <div class="hero-tags">
          <span class="hero-tag-item">互动宣教</span>
          <span class="hero-tag-item">多元交流</span>
          <span class="hero-tag-item">允公允能</span>
          <span class="hero-tag-item">日新月异</span>
        </div>
        <div class="hero-btns">
          <button class="btn-dark" @click="$router.push('/query')">进入万能墙</button>
          <button class="btn-outline" @click="window.open('https://www.douyin.com/user/MS4wLjABAAAAVgKoJHBKLxQ4nQk-FQp_9sJZk3NBZ3FD2vN7R8QnWqI', '_blank')">北关鱼的驿站</button>
        </div>
      </div>

      <!-- 右侧 Logo 装饰 -->
      <div class="hero-right">
        <div class="logo-blob">
          <div class="logo-circle" :class="{ 'is-animating': logoAnimating }">
            <img :src="logoSlides[logoIndex].src" :alt="logoSlides[logoIndex].name" class="logo-img" />
          </div>
          <!-- 浮动装饰气泡 -->
          <div class="hero-bubble hb-1" />
          <div class="hero-bubble hb-2" />
          <div class="hero-bubble hb-3" />
          <div class="hero-bubble hb-4" />
        </div>
        <div class="hero-status-card" :class="{ 'is-animating': logoAnimating }">
          <div class="status-label">{{ logoSlides[logoIndex].platform }}</div>
          <div class="status-title">{{ logoSlides[logoIndex].name }}</div>
          <div class="status-desc">{{ logoSlides[logoIndex].desc }}</div>
        </div>
      </div>
    </div>

    <!-- 底部滚动提示 -->
    <div class="scroll-hint">
      <span class="scroll-text">继续下滑，探索更多</span>
      <div class="scroll-arrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  </section>

  <!-- ═══ 平台数据 ═══ -->
  <section class="stats-section">
    <div class="stats-container">
      <div v-for="stat in stats" :key="stat.label" class="stat-item">
        <div class="stat-num">{{ stat.num }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>
  </section>

  <!-- ═══ 随机抽取同学投稿 ═══ -->
  <section class="draw-section">
    <div class="section-container">
      <div class="section-header">
        <div class="section-num">01 / PART</div>
        <h2 class="section-title">试试抽取一份同学投稿</h2>
        <p class="section-sub">每一张都是南渝学子的真实声音</p>
      </div>

      <div class="draw-outer-card">
        <div class="draw-layout">
          <!-- 左侧：3D 牌堆 -->
          <div class="draw-left">
            <div class="deck-scene">
              <div class="deck-shadow" />
              <!-- 底层 c0 — ④ 补卡渐入 -->
              <div
                ref="deckC0Ref"
                class="deck-card deck-c0"
                :class="{ 'card-enter-new': newCardEnter, 'card-entered': newCardEntered }"
              >
                <img :src="visibleCards[0]" alt="卡背" class="deck-card-img" />
              </div>
              <!-- 中层 c1 -->
              <div class="deck-card deck-c1">
                <img :src="visibleCards[1]" alt="卡背" class="deck-card-img" />
              </div>
              <!-- 顶层 c2 -->
              <div class="deck-card deck-c2">
                <img :src="visibleCards[2]" alt="卡背" class="deck-card-img" />
              </div>
              <!-- 飞出卡（原位淡出） -->
              <div v-if="flyCardState" class="deck-card deck-c2 deck-fly">
                <img :src="flyCardState.img" alt="卡背" class="deck-card-img" />
              </div>
            </div>

            <div class="draw-btn-wrap">
              <button
                class="draw-btn"
                @click="drawRandom"
                :disabled="isAnimating || allSubmissions.length === 0"
              >
                <span v-if="isAnimating" class="draw-btn-loading" />
                <span v-else>随机抽一张 ✦</span>
              </button>
              <div class="draw-count">牌库共有 {{ allSubmissions.length }} 条投稿</div>
            </div>
          </div>

          <!-- ② 飞出卡 — 在 draw-layout 内部绝对定位，飞到画面中央后淡出 -->
          <div v-if="flyCardState" class="fly-center-card">
            <img :src="flyCardState.img" alt="卡背" class="fly-center-img" />
          </div>

          <!-- 右侧：详情卡 -->
          <div class="draw-right">
            <div class="detail-card" :class="{ 'detail-glow': detailGlow, 'detail-elastic': rightPhase === 'elastic', 'detail-sweep': rightPhase === 'show' }">
              <!-- 有内容时才显示 -->
              <template v-if="currentCard && hasDrawn">
                <div class="detail-inner" :class="{ 'detail-content-show': rightPhase === 'show' }">
                  <div class="detail-tag">{{ typeEmojiMap[currentCard.type] || '📄' }} {{ currentCard.type }}</div>
                  <div class="detail-time">{{ formatDate(currentCard.created_at) }}</div>
                  <div class="detail-content">{{ currentCard.content }}</div>
                </div>
              </template>
              <!-- 空占位 -->
              <template v-else>
                <div class="detail-empty">
                  <div class="detail-empty-icon">✨</div>
                  <div class="detail-empty-text">点击左侧按钮抽取投稿</div>
                </div>
              </template>
            </div>
            <div v-if="currentCard && hasDrawn" class="draw-counter">
              {{ allSubmissions.indexOf(currentCard) + 1 }} — {{ allSubmissions.length }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ 核心功能矩阵 ═══ -->
  <section class="func-section">
    <div class="section-container">
      <div class="section-header">
        <div class="section-num">02 / FUNCTION</div>
        <h2 class="section-title">为你的校园保驾护航</h2>
        <p class="section-sub">每个版块都承载着南渝学子的真实需求</p>
      </div>

      <div class="func-grid">
        <router-link
          v-for="(card, idx) in functionCards"
          :key="card.title"
          :to="card.link"
          class="func-card"
        >
          <div class="func-num">{{ String(idx + 1).padStart(2, '0') }}</div>
          <div class="func-card-body">
            <div class="func-icon">
              <svg v-if="card.icon === 'search'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <svg v-else-if="card.icon === 'handshake'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <svg v-else-if="card.icon === 'book'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <svg v-else-if="card.icon === 'star'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h3 class="func-title">{{ card.title }}</h3>
            <p class="func-desc">{{ card.desc }}</p>
          </div>
          <div class="func-arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
            </svg>
          </div>
        </router-link>
      </div>
    </div>
  </section>

  <!-- ═══ 平台特色模块（用户可自定义内容） ═══ -->
  <section class="feature-section">
    <div class="section-container">
      <div class="section-header">
        <div class="section-num">03 / FEATURE</div>
        <h2 class="section-title">我们的特色服务</h2>
        <p class="section-sub">从一个真实的小需求出发，用心服务每一位南渝学子</p>
      </div>

      <div class="feature-card">
        <div class="feature-num">01</div>
        <div class="feature-body">
          <div class="feature-tag">课业互助</div>
          <h3 class="feature-title">让知识在校园中自由流动</h3>
          <p class="feature-desc">
            在这里提问、解答、分享笔记与学习资料，让优秀的南渝学子相互成就，共同进步。
          </p>
        </div>
        <div class="feature-visual">
          <div class="feature-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="feature-card feature-card-alt">
        <div class="feature-visual">
          <div class="feature-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
        </div>
        <div class="feature-body">
          <div class="feature-num">02</div>
          <div class="feature-tag">表白心意</div>
          <h3 class="feature-title">那些说不出口的话，都可以在这里被倾听</h3>
          <p class="feature-desc">
            匿名倾诉、表白心意，校园中那些说不出口的话，都可以在这里被倾听。温暖与支持，从未缺席。
          </p>
        </div>
      </div>

      <div class="feature-card">
        <div class="feature-num">03</div>
        <div class="feature-body">
          <div class="feature-tag">二手交易</div>
          <h3 class="feature-title">打造绿色循环校园</h3>
          <p class="feature-desc">
            教辅书籍、文具器材、闲置好物，统统在这里循环利用。打造绿色校园，南渝万能墙先行。
          </p>
        </div>
        <div class="feature-visual">
          <div class="feature-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ 联系我们（深色区块） ═══ -->
  <section class="contact-section">
    <div class="section-container">
      <div class="contact-num">04 / LET'S TALK</div>
      <h2 class="contact-title">
        有什么想法，<br />欢迎来聊聊。
      </h2>
      <p class="contact-desc">
        有任何校园资讯提问或网站问题反馈？<br />
        我们会认真倾听并及时回复。
      </p>
      <div class="contact-btns">
        <button class="btn-contact" @click="$router.push('/feedback')">有求必应</button>
        <button class="btn-contact-ghost" @click="navigator.clipboard.writeText('3969066287').then(() => alert('已复制 QQ 号：3969066287'))">复制QQ号</button>
        <button class="btn-contact-ghost" @click="$router.push('/recruit')">加入我们</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ═══ Hero 主视觉区 ═══ */
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  padding: 8rem 2rem 4rem;
}

.hero-container {
  max-width: 1200px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4rem;
}

.hero-left {
  flex: 1;
  max-width: 600px;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 0.1em;
  margin-bottom: 1.5rem;
  padding: 0.4rem 1rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(179, 157, 219, 0.15);
  border-radius: 100px;
}

.tag-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-dark);
  animation: pulse-soft 2s ease-in-out infinite;
}

.hero-title {
  font-family: var(--font-title);
  font-size: clamp(2.2rem, 5.5vw, 4rem);
  font-weight: 900;
  line-height: 1.15;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.hero-file-bar {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(179, 157, 219, 0.15);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
}

.file-label {
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.08em;
}

.file-value {
  color: var(--text-secondary);
}

.hero-desc {
  font-size: 0.95rem;
  line-height: 1.9;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  max-width: 500px;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.hero-tag-item {
  padding: 0.4rem 1rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(179, 157, 219, 0.15);
  border-radius: 100px;
  transition: all 0.25s;
}

.hero-tag-item:hover {
  background: rgba(179, 157, 219, 0.15);
  border-color: rgba(179, 157, 219, 0.3);
  color: var(--accent-dark);
}

.hero-btns {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.btn-dark {
  padding: 0.8rem 2rem;
  font-family: var(--font-ui);
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  background: var(--text-primary);
  border: none;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-dark:hover {
  background: var(--accent-deep);
}

.btn-outline {
  padding: 0.8rem 2rem;
  font-family: var(--font-ui);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: rgba(179, 157, 219, 0.1);
  border: none;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-outline:hover {
  background: rgba(179, 157, 219, 0.18);
  color: var(--text-primary);
}

/* 右侧 Logo */
.hero-right {
  flex-shrink: 0;
  position: relative;
}

.logo-blob {
  position: relative;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(209, 196, 233, 0.4), rgba(179, 157, 219, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-circle {
  width: 240px;
  height: 240px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 12px 40px rgba(179, 157, 219, 0.2);
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.logo-circle.is-animating {
  transform: scale(0.85) rotate(-8deg);
  opacity: 0;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-bubble {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.5), rgba(179, 157, 219, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: bubble-float 6s ease-in-out infinite;
}

.hb-1 { width: 40px; height: 40px; top: -10px; right: 20px; animation-delay: 0s; }
.hb-2 { width: 28px; height: 28px; bottom: 30px; right: -15px; animation-delay: -2s; }
.hb-3 { width: 22px; height: 22px; top: 50px; left: -20px; animation-delay: -4s; }
.hb-4 { width: 18px; height: 18px; bottom: 60px; left: 10px; animation-delay: -1s; }

.hero-status-card {
  position: absolute;
  bottom: -20px;
  right: -30px;
  padding: 1rem 1.2rem;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  box-shadow: 0 8px 28px rgba(179, 157, 219, 0.12);
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-status-card.is-animating {
  transform: translateX(12px);
  opacity: 0;
}

.status-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--accent-dark);
  margin-bottom: 0.3rem;
}

.status-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.2rem;
}

.status-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* 滚动提示 */
.scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 3rem;
}

.scroll-text {
  font-size: 0.75rem;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  padding: 0.35rem 1rem;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(179, 157, 219, 0.1);
  border-radius: 100px;
}

.scroll-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(179, 157, 219, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  animation: bounce-down 2s ease-in-out infinite;
}

@keyframes bounce-down {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}

/* ═══ 平台数据 ═══ */
.stats-section {
  padding: 4rem 2rem;
  position: relative;
  z-index: 1;
}

.stats-container {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.stat-item {
  text-align: center;
  padding: 2rem 1rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(179, 157, 219, 0.06);
}

.stat-num {
  font-family: var(--font-title);
  font-size: 2rem;
  font-weight: 800;
  color: var(--accent-dark);
  margin-bottom: 0.3rem;
}

.stat-label {
  font-size: 0.82rem;
  color: var(--text-muted);
}

/* ═══ 通用区块 ═══ */
.section-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 3.5rem;
}

.section-num {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.25em;
  color: var(--text-muted);
  margin-bottom: 0.8rem;
}

.section-title {
  font-family: var(--font-title);
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.8rem;
}

.section-sub {
  font-size: 0.95rem;
  color: var(--text-muted);
}

/* ═══ 随机抽取投稿（迁移自3D卡牌模块） ═══ */
.draw-section {
  padding: 6rem 0;
  position: relative;
  z-index: 1;
}

.draw-outer-card {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 28px;
  box-shadow: 0 8px 32px rgba(179, 157, 219, 0.08);
  padding: 3rem;
  position: relative;
  overflow: visible;
}

.draw-outer-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
  pointer-events: none;
}

.draw-layout {
  display: flex;
  gap: 3rem;
  align-items: flex-start;
  position: relative;
}

/* ── 左侧牌堆 ── */
.draw-left {
  flex: 0 0 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.deck-scene {
  position: relative;
  width: 240px;
  height: 340px;
  perspective: 900px;
  perspective-origin: 50% 40%;
}

.deck-shadow {
  position: absolute;
  bottom: -12px;
  left: 8%;
  width: 84%;
  height: 30px;
  background: radial-gradient(ellipse, rgba(179, 157, 219, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(10px);
}

/* 3张可见卡牌 */
.deck-card {
  position: absolute;
  left: 15px;
  top: 15px;
  width: 210px;
  height: 300px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(179, 157, 219, 0.2);
  /* ⑤ 卡牌递补的平滑过渡 */
  transition: transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease;
  will-change: transform, opacity;
}

.deck-card-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 24px;
}

/* c0 底层 */
.deck-c0 {
  transform: translateY(15px) translateZ(-40px) rotate(-5deg);
}

/* c1 中层 */
.deck-c1 {
  transform: translateZ(0) rotate(3deg);
}

/* c2 顶层 */
.deck-c2 {
  transform: translateY(-15px) translateZ(40px) rotate(-3deg);
}

/* ④ 补卡淡入+移动动画 — 使用 transition 而非 keyframe，确保渐入可见 */
.deck-c0.card-enter-new {
  opacity: 0;
  transform: translateY(40px) translateZ(-60px) rotate(-8deg) scale(0.92);
  transition: opacity 0.65s ease, transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
}

.deck-c0.card-enter-new.card-entered {
  opacity: 1;
  transform: translateY(15px) translateZ(-40px) rotate(-5deg) scale(1);
}

/* 飞出卡（在牌堆内的原始卡淡出） */
.deck-fly {
  animation: cardFly 0.8s cubic-bezier(0.45, 0, 0.15, 1) forwards;
}

@keyframes cardFly {
  0% {
    transform: translateY(-15px) translateZ(50px) rotateY(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-15px) translateZ(50px) rotateY(0deg);
    opacity: 0;
  }
}

/* ② 飞出卡 — 从牌堆位置飞到画面中央再淡出 */
.fly-center-card {
  position: absolute;
  top: 150px;
  left: 65px;
  width: 210px;
  height: 300px;
  border-radius: 24px;
  overflow: hidden;
  z-index: 20;
  box-shadow: 0 20px 60px rgba(179, 157, 219, 0.35);
  pointer-events: none;
  animation: flyCenterFade 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.fly-center-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 24px;
}

@keyframes flyCenterFade {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotateZ(0deg) scale(1);
  }
  55% {
    opacity: 1;
    transform: translate(200px, -50px) rotateZ(-8deg) scale(1.08);
  }
  80% {
    opacity: 0.5;
    transform: translate(200px, -50px) rotateZ(-5deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(200px, -50px) rotateZ(-3deg) scale(0.9);
  }
}

/* ── 按钮区 ── */
.draw-btn-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}

.draw-btn {
  padding: 0.85rem 2.8rem;
  font-family: var(--font-ui);
  font-size: 0.92rem;
  font-weight: 600;
  color: white;
  background: var(--text-primary);
  border: none;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.3s;
  letter-spacing: 0.03em;
}

.draw-btn:hover:not(:disabled) {
  background: var(--accent-deep);
}

.draw-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }
.draw-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.draw-btn-loading {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.5s linear infinite;
  display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }

.draw-count {
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* ── 右侧详情卡 ── */
.draw-right {
  flex: 1;
  min-width: 0;
  min-height: 360px;
  width: 100%;
}

.detail-card {
  width: 100%;
  min-height: 360px;
  border-radius: 25px;
  background: white;
  box-shadow: 0 8px 32px rgba(179, 157, 219, 0.08);
  position: relative;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 35px;
}

/* ② 飞出卡叠在详情卡上方然后淡出 */
.fly-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  border-radius: 25px;
  overflow: hidden;
  animation: flyOverlayFade 0.6s ease-out forwards;
  pointer-events: none;
}

.fly-overlay-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 25px;
}

@keyframes flyOverlayFade {
  0% { opacity: 1; transform: scale(0.9); }
  40% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 0; transform: scale(1); }
}

/* ① 弹性放大 */
.detail-elastic {
  animation: detailElastic 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes detailElastic {
  0% { transform: scale(0.95); opacity: 0.5; }
  60% { transform: scale(1.03); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

/* ③ 金光扫边动画 */
.detail-sweep {
  animation: goldSweep 1.2s ease-in-out;
}

@keyframes goldSweep {
  0% {
    box-shadow:
      0 8px 32px rgba(179, 157, 219, 0.08),
      inset 0 0 0 2px transparent;
  }
  30% {
    box-shadow:
      0 8px 32px rgba(179, 157, 219, 0.08),
      inset 0 0 0 2px rgba(255, 193, 7, 0.6);
  }
  100% {
    box-shadow:
      0 0 40px rgba(255, 228, 155, 0.3),
      inset 0 0 0 2px rgba(255, 193, 7, 0.4);
  }
}

/* ② 内容淡入 */
.detail-content-show {
  animation: contentFadeIn 0.45s ease 0.1s both;
}

@keyframes contentFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}

/* 金光脉冲 */
.detail-glow {
  animation: detailGlowPulse 1.2s ease-in-out;
}

@keyframes detailGlowPulse {
  0%, 100% {
    box-shadow: 0 0 40px rgba(255, 228, 155, 0.3), inset 0 0 0 2px rgba(255, 193, 7, 0.4);
  }
  50% {
    box-shadow: 0 0 60px rgba(255, 228, 155, 0.45), inset 0 0 0 3px rgba(255, 193, 7, 0.5);
  }
}

.detail-inner {
  padding: 0;
}

.detail-tag {
  display: inline-block;
  font-family: var(--font-ui);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.4rem 1rem;
  border-radius: 100px;
  background: rgba(179, 157, 219, 0.12);
  color: var(--accent-dark);
  border: 1px solid rgba(179, 157, 219, 0.15);
  margin-bottom: 1rem;
}

.detail-time {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.detail-content {
  font-size: 1rem;
  line-height: 2;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* 空状态 */
.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 290px;
  gap: 0.8rem;
}

.detail-empty-icon {
  font-size: 3rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.detail-empty-text {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-muted);
}

.draw-counter {
  text-align: center;
  margin-top: 1.2rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  letter-spacing: 0.15em;
  font-weight: 500;
}

/* ═══ 功能矩阵 ═══ */
.func-section {
  padding: 6rem 0;
  position: relative;
  z-index: 1;
}

.func-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.func-card {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  padding: 2rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 16px rgba(179, 157, 219, 0.06);
  text-decoration: none;
  color: inherit;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.func-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
  pointer-events: none;
}

.func-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(179, 157, 219, 0.15);
  border-color: rgba(179, 157, 219, 0.3);
}

.func-num {
  font-family: var(--font-title);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-dark);
  background: rgba(179, 157, 219, 0.15);
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.func-card-body {
  flex: 1;
}

.func-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(179, 157, 219, 0.2), rgba(126, 87, 194, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.func-icon svg {
  width: 24px;
  height: 24px;
  stroke: var(--accent-dark);
}

.func-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.4rem;
}

.func-desc {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.func-arrow {
  color: var(--text-muted);
  transition: all 0.3s;
  flex-shrink: 0;
  margin-top: 0.5rem;
}

.func-card:hover .func-arrow {
  color: var(--accent-dark);
  transform: translate(3px, -3px);
}

/* ═══ 特色模块 ═══ */
.feature-section {
  padding: 6rem 0;
  position: relative;
  z-index: 1;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 3rem;
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 24px;
  box-shadow: 0 4px 16px rgba(179, 157, 219, 0.06);
  margin-bottom: 1.5rem;
  transition: all 0.35s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(179, 157, 219, 0.12);
}

.feature-card-alt {
  flex-direction: row-reverse;
}

.feature-num {
  font-family: var(--font-title);
  font-size: 4rem;
  font-weight: 900;
  color: rgba(179, 157, 219, 0.15);
  line-height: 1;
  flex-shrink: 0;
}

.feature-body {
  flex: 1;
}

.feature-tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--accent-dark);
  background: rgba(179, 157, 219, 0.12);
  padding: 0.3rem 0.8rem;
  border-radius: 100px;
  margin-bottom: 0.8rem;
}

.feature-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.8rem;
}

.feature-desc {
  font-size: 0.92rem;
  color: var(--text-secondary);
  line-height: 1.8;
}

.feature-visual {
  flex-shrink: 0;
}

.feature-icon-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(209, 196, 233, 0.4), rgba(179, 157, 219, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-icon-circle svg {
  width: 48px;
  height: 48px;
  stroke: var(--accent-dark);
}

/* ═══ 联系我们（深色区块） ═══ */
.contact-section {
  padding: 6rem 0;
  position: relative;
  z-index: 1;
}

.contact-section > .section-container {
  max-width: 1100px;
  border-radius: 32px;
  background: linear-gradient(135deg, #2D1B69, #3d2578, #4a2d8a);
  padding: 4rem 3rem;
  position: relative;
  overflow: hidden;
}

.contact-section::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
  pointer-events: none;
}

.contact-container {
  max-width: 800px;
  position: relative;
  z-index: 1;
}

.contact-num {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: rgba(209, 196, 233, 0.6);
  margin-bottom: 1.5rem;
}

.contact-title {
  font-family: var(--font-title);
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  color: white;
  line-height: 1.2;
  margin-bottom: 1.5rem;
}

.contact-desc {
  font-size: 1rem;
  color: rgba(209, 196, 233, 0.7);
  line-height: 1.9;
  margin-bottom: 2rem;
}

.contact-btns {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.btn-contact {
  padding: 0.8rem 2rem;
  font-family: var(--font-ui);
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  background: rgba(179, 157, 219, 0.9);
  border: none;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-contact:hover {
  background: rgba(126, 87, 194, 0.9);
}

.btn-contact-ghost {
  padding: 0.8rem 2rem;
  font-family: var(--font-ui);
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(209, 196, 233, 0.8);
  background: transparent;
  border: 1px solid rgba(209, 196, 233, 0.3);
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-contact-ghost:hover {
  background: rgba(209, 196, 233, 0.1);
  color: white;
}

/* ═══ 响应式 ═══ */
@media (max-width: 768px) {
  .hero {
    padding: 7rem 1.25rem 3rem;
    min-height: auto;
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
    white-space: normal;
  }

  .hero-tags {
    justify-content: center;
  }

  .hero-btns {
    justify-content: center;
  }

  .logo-blob {
    width: 240px;
    height: 240px;
  }

  .logo-circle {
    width: 180px;
    height: 180px;
  }

  .hero-status-card {
    right: 0;
    bottom: -15px;
  }

  .scroll-hint {
    display: none;
  }

  .stats-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .draw-outer-card {
    padding: 1.5rem;
    overflow: hidden;
  }

  .draw-layout {
    flex-direction: column;
    gap: 2rem;
  }

  .draw-left {
    flex: none;
    width: 100%;
  }

  .deck-scene {
    width: 220px;
    height: 300px;
  }

  .deck-card {
    width: 190px;
    height: 270px;
  }

  .draw-right {
    width: 100%;
    min-height: 280px;
    flex: none;
  }

  .showcase-card {
    min-height: 280px;
  }

  .showcase-placeholder {
    min-height: 280px;
  }

  .flying-card-wrap {
    display: none;
  }

  /* 手机端飞卡：向右飞出画面淡出（不做中央消失） */
  .fly-center-card {
    animation: flyCenterMobile 0.9s cubic-bezier(0.45, 0, 0.15, 1) forwards;
  }

  @keyframes flyCenterMobile {
    0% {
      opacity: 1;
      transform: translate(0, 0) rotateY(0deg) scale(1);
    }
    50% {
      opacity: 1;
      transform: translate(120px, -60px) translateZ(150px) rotateY(180deg) scale(1.05);
    }
    100% {
      opacity: 0;
      transform: translate(260px, 10px) translateZ(100px) rotateY(360deg) scale(0.85);
    }
  }

  .func-grid {
    grid-template-columns: 1fr;
  }

  .feature-card {
    flex-direction: column !important;
    text-align: center;
    gap: 1.5rem;
  }

  .feature-num {
    font-size: 3rem;
  }

  .feature-icon-circle {
    width: 100px;
    height: 100px;
  }

  .contact-section {
    margin: 1rem;
    padding: 4rem 1.5rem;
  }

  .contact-btns {
    flex-direction: column;
    align-items: stretch;
  }

  .draw-section,
  .func-section,
  .feature-section {
    padding: 4rem 0;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: clamp(1.8rem, 8vw, 2.5rem);
    white-space: normal;
  }

  .hero-btns {
    flex-direction: column;
    align-items: center;
  }

  .btn-dark,
  .btn-outline {
    width: 100%;
    max-width: 280px;
  }

  .hero-status-card {
    display: none;
  }
}
</style>
