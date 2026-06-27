<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import GlassModal from '@/components/common/GlassModal.vue'
import ColorBends from '@/components/common/ColorBends.vue'
import TrueFocus from '@/components/common/TrueFocus.vue'
import SplitText from '@/components/common/SplitText.vue'
import ShinyText from '@/components/common/ShinyText.vue'
import BorderGlow from '@/components/common/BorderGlow.vue'
import MagicBento from '@/components/common/MagicBento.vue'

const showModal = ref(false)
const videoLoaded = ref(false)

const bentoCards = [
  { color: '#120F17', title: '稿件查询', description: '快速搜索已审核发布的投稿，支持按时间、类型与关键词筛选', label: '查询', link: '/query' },
  { color: '#120F17', title: '公益课程', description: '专业级剪辑软件教程等优质教育资源完全免费共享', label: '学习', link: '/course' },
  { color: '#120F17', title: '有求必应', description: '有任何校园资讯提问或网站问题反馈，我们会及时处理', label: '反馈', link: '/feedback' },
  { color: '#120F17', title: '合作与共创', description: '与南渝万能墙合作，共同打造更好的校园服务平台', label: '合作', link: '/cooperation' },
  { color: '#120F17', title: '招贤纳士', description: '加入南渝万能墙团队，为校园文化建设贡献力量', label: '加入', link: '/recruit' },
  { color: '#120F17', title: '关于我们', description: '了解南渝万能墙的创立初衷、发展历程与团队介绍', label: '了解', link: '/about' }
]

function initVideo() {
  videoLoaded.value = true
  const s = document.createElement('script')
  s.src = 'https://player.polyv.net/resp/vod-player/latest/player.js'
  s.async = true
  s.onload = () => {
    try {
      polyvPlayer({
        wrap: '#plv-wrap',
        width: '100%',
        height: '100%',
        vid: 'b1d203ea5ebf2fb550d2d459b8fe2133_b',
        autoplay: false
      })
    } catch (e) {
      console.warn('polyv player init failed', e)
    }
  }
  document.body.appendChild(s)
}

const marqueeItems = [
  { text: '✦ 课业互助', highlight: true },
  { text: '活动公告', highlight: false },
  { text: '✦ 二手交易', highlight: true },
  { text: '寻找搭子', highlight: false },
  { text: '✦ 社团招募', highlight: true },
  { text: '失物招领', highlight: false },
  { text: '✦ 校园资讯', highlight: true },
  { text: '互动问答', highlight: false },
  { text: '✦ 学习交流', highlight: true },
  { text: '表白心意', highlight: false }
]

const features = [
  { icon: 'book', title: '课业互助', desc: '在这里提问、解答、分享笔记与学习资料，让优秀的南渝学子相互成就，共同进步，让知识在校园中自由流动。', gradient: ['#a87fe8', '#e86fa3'] },
  { icon: 'heart', title: '表白心意', desc: '匿名倾诉、表白心意，校园中那些说不出口的话，都可以在这里被倾听。温暖与支持，从未缺席。', gradient: ['#5de8d0', '#a87fe8'] },
  { icon: 'bag', title: '二手交易', desc: '教辅书籍、文具器材、闲置好物，统统在这里循环利用。打造绿色校园，南渝万能墙先行。', gradient: ['#e8c97a', '#e86fa3'] },
  { icon: 'calendar', title: '活动公告', desc: '社团招新、运动会、艺术节、校级通知……所有校园动态一网打尽，再也不错过任何重要信息。', gradient: ['#a87fe8', '#5de8d0'] },
  { icon: 'search', title: '失物招领', desc: '丢失了水杯、钥匙、学生卡？在南渝万能墙快速发布或查询，让校园里的失物找到回家的路。', gradient: ['#e86fa3', '#e8c97a'] },
  { icon: 'users', title: '寻找搭子', desc: '假期没有人出来玩？来南渝万能墙寻找志同道合的搭子！在这里，认识新同学、结实新朋友、分享快乐时光。', gradient: ['#5de8d0', '#e8c97a'] }
]

const iconPaths = {
  book: ['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
  heart: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  bag: ['M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z', 'M3 6h18', 'M16 10a4 4 0 01-8 0'],
  calendar: ['M16 2v4', 'M8 2v4', 'M3 10h18', 'M3 4a2 2 0 012-2h14a2 2 0 012 2v16a2 2 0 01-2 2H5a2 2 0 01-2-2V4z'],
  search: ['M11 3a8 8 0 100 16 8 8 0 000-16z', 'M21 21l-4.35-4.35'],
  users: ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M9 7a4 4 0 100-8 4 4 0 000 8z', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75']
}

const stats = [
  { value: '1900', suffix: '+', label: '服务学子' },
  { value: '1200', suffix: '+', label: '累计稿件' },
  { value: '6', suffix: '', label: '核心版块' },
  { value: '99.9', suffix: '%', label: '系统可用率' }
]

onMounted(() => {})

onUnmounted(() => {})
</script>

<template>
  <!-- Hero Section -->
  <section class="hero">
    <ColorBends
      :rotation="90"
      :speed="0.2"
      :colors="['#7C3AED','#e86fa3','#5de8d0']"
      :transparent="true"
      :scale="1"
      :frequency="1"
      :warpStrength="1"
      :mouseInfluence="1"
      :parallax="0.5"
      :noise="0.15"
      :iterations="1"
      :intensity="1.5"
      :bandWidth="6"
    />
    <div class="hero-content">
      <div class="school-badge"><ShinyText text="重庆校墙联核心成员" color="#b5a5d4" shineColor="#d6adfc" :speed="2" :spread="120" /></div>
      <h1 class="hero-title">
        <TrueFocus
          sentence="南渝 万能墙"
          separator=" "
          :blurAmount="5"
          borderColor="#7b55d4"
          glowColor="rgba(123, 85, 212, 0.6)"
          :animationDuration="0.5"
          :pauseBetweenAnimations="1"
        />
        <div class="line2"><SplitText text="坚持打造南渝学子的一站式服务平台" :delay="30" :duration="0.7" tag="span" /></div>
      </h1>
    </div>
  </section>

  <!-- Marquee -->
  <div class="showcase">
    <div class="marquee-track">
      <span
        v-for="(item, i) in [...marqueeItems, ...marqueeItems]"
        :key="i"
        class="marquee-pill"
        :class="{ highlight: item.highlight }"
      >
        {{ item.text }}
      </span>
    </div>
  </div>

  <!-- MagicBento -->
  <section class="bento-wrapper">
    <div class="bento-header">
      <div class="section-label">平台核心功能</div>
      <h2 class="section-title">专为<strong>南渝学子</strong>打造的一站式平台</h2>
      <p class="section-body">每个版块都承载着南渝学子的真实需求，点击卡片即可进入对应服务。</p>
    </div>
    <MagicBento
      :cards="bentoCards"
      :text-auto-hide="true"
      :enable-spotlight="true"
      :enable-border-glow="true"
      :enable-tilt="false"
      :spotlight-radius="300"
      glow-color="132, 0, 255"
      :click-effect="true"
    />
  </section>

  <!-- Video Section -->
  <section class="video-section">
    <div class="video-inner">
      <div style="text-align: center; margin-bottom: 3rem;">
        <div class="section-label" style="justify-content: center;">特色平台</div>
        <h2 class="section-title"><strong>北关鱼的驿站</strong></h2>
        <p class="section-body" style="margin: 1rem auto 0; text-align: center; max-width: 600px;">
          南渝万能墙庆祝重庆南开中学建校90周年专辑《适合，不适合》。
        </p>
      </div>
      <div class="video-box">
      <BorderGlow :border-radius="24" :glow-radius="36"><div class="video-frame" style="border:none;box-shadow:none;border-radius:24px">
        <div v-if="!videoLoaded" class="video-placeholder" @click="initVideo" role="button" tabindex="0" @keydown.enter="initVideo" @keydown.space.prevent="initVideo">
          <div class="play-btn">▶</div>
        </div>
        <div id="plv-wrap" :style="{ display: videoLoaded ? 'block' : 'none', width: '100%', height: '100%' }" />
      </div></BorderGlow>
        <p class="video-caption">或前往抖音搜索 北关鱼的驿站 查看更多视频</p>
      </div>
    </div>
  </section>

  <!-- Feedback Promo -->
  <section class="promo-section">
    <div class="promo-inner">
      <div class="section-label">有求必应</div>
      <h2 class="section-title"><strong>你的声音</strong>，我们倾听</h2>
      <p class="section-body" style="margin: 1rem auto 1.5rem; max-width: 640px; text-align: center;">
        有任何校园资讯提问或网站问题反馈？请前往有求必应提交，我们会及时回复。
      </p>
      <router-link to="/feedback" class="glass-btn glass-btn-primary"><span>前往有求必应</span></router-link>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="cta-section">
    <div class="cta-orb" />
    <div class="cta-inner">
      <h2 class="cta-title">进入南渝万能墙<br /><em>让校园生活更精彩</em></h2>
      <p class="cta-sub">
        1900+ 南渝学子已在这里相遇。无论你需要学业帮助、想结交朋友，还是只想分享今天的心情——南渝万能墙永远为你敞开。
      </p>
      <div class="hero-ctas">
        <button class="glass-btn glass-btn-primary" @click="window.open('https://qm.qq.com/q/FHAbiDBIQO', '_blank')">
          <span>立即进入</span>
        </button>
        <router-link to="/recruit" class="glass-btn glass-btn-ghost">
          <span>成为运营队员</span>
        </router-link>
      </div>
    </div>
  </section>

  <!-- Join Modal -->
  <GlassModal :show="showModal" @close="showModal = false">
    <div class="modal-header-bar">
      <div class="modal-icon">💬</div>
      <div>
        <div class="modal-eyebrow">招募公告</div>
        <div class="modal-title-text">加入运营队</div>
      </div>
      <button class="modal-close-btn" @click="showModal = false">✕</button>
    </div>
    <div class="modal-body-content">
      <p>很感谢您愿意加入南渝万能墙运营队！南渝万能墙目前正在招募<strong style="color: var(--accent-gold)">初2028届、高2028届学生</strong>（校区不限）。运营队成员能够在培训后直接管理南渝万能墙，并享有重庆校墙联的成员优惠福利。</p>
      <div class="modal-info-block">
        <div class="qq-icon">💬</div>
        <p>请在 QQ 添加好友 <strong>3969066287</strong>，私信发送「申请加入运营队」，运营成员看到后会及时回复您。</p>
      </div>
    </div>
    <div class="modal-footer-bar">
      <button class="glass-btn glass-btn-primary" style="flex:1" @click="window.open('https://qm.qq.com/q/FHAbiDBIQO')">立即联系我们</button>
      <button class="glass-btn glass-btn-ghost" @click="showModal = false">稍后再说</button>
    </div>
  </GlassModal>
</template>

<style scoped>
/* ── Hero ── */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 8rem 2rem 5rem;
  background: transparent;
}

.hero-content {
  text-align: center;
  position: relative;
  z-index: 10;
  max-width: 960px;
}

.school-badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-ui);
  font-size: 0.78rem;
  color: var(--accent-light);
  border: 1px solid rgba(168, 127, 232, 0.35);
  border-radius: 100px;
  padding: 0.35rem 1.2rem;
  margin-bottom: 1.8rem;
  letter-spacing: 0.04em;
  animation: fadeUp 1s var(--ease-out) 0.55s both;
}

.hero-title {
  font-family: var(--font-title);
  font-weight: 700;
  line-height: 1.25;
  margin-bottom: 15px;
  animation: fadeUp 1s var(--ease-out) 0.5s both;
}
.hero-title .line2 {
  display: block;
  font-size: clamp(0.85rem, 2.2vw, 1.4rem);
  font-weight: 400;
  letter-spacing: 0.04em;
  color: rgba(236, 234, 239, 0.7);
  margin-top: 18px;
}
.hero-title :deep(.focus-word) {
  font-size: clamp(3rem, 8vw, 6rem);
  text-shadow: 0 0 40px rgba(123, 85, 212, 0.5), 0 0 80px rgba(123, 85, 212, 0.25), 0 4px 20px rgba(0, 0, 0, 0.4);
}

/* ── ScrollStack ── */
/* ── Bento ── */
.bento-wrapper {
  padding: 6rem 2rem;
  background: var(--bg-primary);
  text-align: center;
}
.bento-header {
  max-width: 700px;
  margin: 0 auto 3rem;
}
.scroll-stack-card {
  border-radius: 40px;
  padding: 3rem;
  box-sizing: border-box;
  min-height: 20rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
  position: relative;
}
.ss-card-num {
  font-family: var(--font-title);
  font-size: 4rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.08);
  position: absolute;
  top: 1.5rem;
  right: 2rem;
  line-height: 1;
}
.ss-card-title {
  font-family: var(--font-title);
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 700;
  color: #f0e6ff;
  margin-bottom: 1rem;
  letter-spacing: 0.02em;
}
.ss-card-title-big {
  font-size: clamp(2.2rem, 5vw, 3.5rem);
  text-align: center;
  background: linear-gradient(135deg, #f0e6ff, #e8c97a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.ss-card-desc {
  font-family: var(--font-body);
  font-size: 1.05rem;
  color: rgba(236, 234, 239, 0.75);
  line-height: 2;
  max-width: 600px;
}
.ss-card-final {
  text-align: center;
  align-items: center;
}
.ss-card-final .ss-card-desc {
  text-align: center;
}

/* ── Marquee ── */
.showcase {
  overflow: hidden;
  padding: 3.5rem 0;
  background: var(--bg-primary);
}
.marquee-track {
  display: flex;
  gap: 1.4rem;
  animation: marquee 30s linear infinite;
  width: max-content;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.marquee-pill {
  flex-shrink: 0;
  padding: 0.6rem 1.6rem;
  border-radius: 100px;
  border: 1px solid rgba(123, 85, 212, 0.3);
  font-family: var(--font-ui);
  font-size: 0.82rem;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  white-space: nowrap;
  background: rgba(29, 14, 58, 0.5);
  backdrop-filter: blur(8px);
}
.marquee-pill.highlight {
  background: linear-gradient(135deg, rgba(75, 47, 163, 0.5), rgba(232, 111, 163, 0.3));
  border-color: rgba(168, 127, 232, 0.5);
  color: #f0e6ff;
}

/* ── Features ── */
.features-section {
  padding: 8rem 2rem;
  background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%);
}
.features-inner {
  max-width: 1200px;
  margin: 0 auto;
}
.features-header {
  max-width: 620px;
  margin-bottom: 5rem;
}
.features-body {
  display: flex;
  flex-direction: column;
}
.feature-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: clamp(2rem, 4vw, 5rem);
  align-items: center;
  padding: clamp(2rem, 3vw, 3.5rem) 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  transition: color 0.4s;
}
.feature-row.revealed {
  opacity: 1;
  transform: translateY(0);
}
.feature-row::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: #7b55d4;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.6s cubic-bezier(0.77, 0, 0.175, 1);
}
.feature-row:hover::after { transform: scaleX(1); }
.feature-row:hover { color: #7b55d4; }
.feature-number {
  font-size: clamp(0.9rem, 1.2vw, 1.1rem);
  font-weight: 400;
  color: rgba(236, 234, 239, 0.4);
  letter-spacing: 0.05em;
  min-width: 3rem;
  transition: color 0.4s;
}
.feature-row:hover .feature-number { color: #7b55d4; }
.feature-content h3 {
  font-family: var(--font-title);
  font-size: clamp(1.5rem, 3vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 0.5rem;
  color: #f0e6ff;
  transition: color 0.4s;
}
.feature-row:hover .feature-content h3 { color: #7b55d4; }
.feature-content p {
  font-size: clamp(0.85rem, 1vw, 1rem);
  color: rgba(236, 234, 239, 0.6);
  line-height: 1.8;
  max-width: 500px;
  letter-spacing: 0.02em;
}
.feature-icon-wrap {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.4s, border-color 0.4s, transform 0.4s;
  flex-shrink: 0;
}
.feature-icon-wrap svg {
  width: 24px;
  height: 24px;
  stroke: rgba(236, 234, 239, 0.5);
  transition: stroke 0.4s;
}
.feature-row:hover .feature-icon-wrap {
  background: #7b55d4;
  border-color: #7b55d4;
  transform: rotate(45deg);
}
.feature-row:hover .feature-icon-wrap svg { stroke: #fff; }
.feature-card {
  padding: 2.4rem 2rem;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.7s var(--ease-out), transform 0.7s var(--ease-out), border-color 0.3s, box-shadow 0.4s;
}
.feature-card.revealed {
  opacity: 1;
  transform: none;
}
.feature-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #7b55d4, transparent);
  transform: scaleX(0);
  transition: transform 0.4s var(--ease-out);
}
.feature-card:hover::after {
  transform: scaleX(1);
}

.feature-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.feature-icon svg {
  width: 26px;
  height: 26px;
  position: relative;
  z-index: 1;
}
.feature-icon::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(75, 47, 163, 0.4), rgba(168, 127, 232, 0.2));
  border-radius: 10px;
  border: 1px solid rgba(123, 85, 212, 0.3);
}

.feature-card h3 {
  font-family: var(--font-title);
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #f0e6ff;
  letter-spacing: 0.03em;
}
.feature-card p {
  font-family: var(--font-body);
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 2;
  letter-spacing: 0.04em;
}

/* ── Promo sections ── */
.promo-section {
  padding: 8rem 2rem;
  background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%);
  text-align: center;
}
.promo-dark {
  background: var(--bg-primary);
}
.promo-inner {
  max-width: 1100px;
  margin: 0 auto;
  text-align: center;
}

/* ── Video ── */
.video-section {
  padding: 8rem 2rem;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  position: relative;
  overflow: hidden;
}
.video-inner {
  max-width: 1100px;
  margin: 0 auto;
}
.video-box {
  max-width: 1100px;
  margin: 0 auto;
}
.video-frame {
  position: relative;
  width: 100%;
  min-height: 338px;
  height: min(48vh, 520px);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.28);
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.video-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.6));
}
.play-btn {
  width: 84px; height: 84px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 28px;
  border: 2px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  transition: transform 0.3s;
}
.play-btn:hover {
  transform: scale(1.08);
}
.video-caption {
  margin-top: 1.4rem;
  text-align: center;
  font-family: var(--font-body);
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.8;
}

/* ── CTA ── */
.cta-section {
  padding: 10rem 2rem;
  text-align: center;
  background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%);
  position: relative;
  overflow: hidden;
}
.cta-orb {
  position: absolute;
  width: 700px; height: 700px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(75, 47, 163, 0.4) 0%, rgba(232, 111, 163, 0.15) 50%, transparent 70%);
  filter: blur(60px);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 6s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
  50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
}
.cta-inner {
  position: relative;
  z-index: 1;
}
.cta-title {
  font-family: var(--font-title);
  font-size: clamp(2.2rem, 5.5vw, 4.8rem);
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 1.5rem;
  letter-spacing: 0.03em;
  color: #ffffff;
}
.cta-title em {
  font-style: normal;
  background: linear-gradient(135deg, var(--accent-light), var(--accent-gold), var(--accent-rose));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% 200%;
  animation: shimmer 5s ease infinite;
}
.cta-sub {
  font-family: var(--font-body);
  color: var(--text-secondary);
  font-size: 1.02rem;
  max-width: 500px;
  margin: 0 auto 3rem;
  line-height: 2.1;
  letter-spacing: 0.05em;
}

/* ── Modal ── */
.modal-header-bar {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 2rem 2.2rem 1.2rem;
  border-bottom: 1px solid rgba(123, 85, 212, 0.15);
}
.modal-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4c2fa3, #e86fa3);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 8px 24px rgba(75, 47, 163, 0.4);
  flex-shrink: 0;
}
.modal-eyebrow {
  font-family: var(--font-ui);
  font-size: 0.65rem;
  letter-spacing: 0.2em;
  color: var(--accent-gold);
  text-transform: uppercase;
  margin-bottom: 0.3rem;
}
.modal-title-text {
  font-family: var(--font-title);
  font-size: 1.4rem;
  font-weight: 700;
  color: #f0e6ff;
}
.modal-close-btn {
  margin-left: auto;
  background: transparent;
  border: 1px solid rgba(123, 85, 212, 0.25);
  border-radius: 8px;
  color: var(--accent-light);
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.25s;
  flex-shrink: 0;
}
.modal-close-btn:hover {
  background: rgba(232, 111, 163, 0.2);
  border-color: var(--accent-rose);
  color: var(--accent-rose);
}
.modal-body-content {
  padding: 1.4rem 2.2rem 2rem;
}
.modal-body-content p {
  font-family: var(--font-body);
  font-size: 0.95rem;
  line-height: 2;
  color: var(--text-secondary);
}
.modal-info-block {
  margin-top: 1.2rem;
  padding: 1rem 1.2rem;
  background: rgba(75, 47, 163, 0.15);
  border-radius: 12px;
  border: 1px solid rgba(123, 85, 212, 0.2);
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.modal-info-block .qq-icon {
  width: 38px; height: 38px;
  border-radius: 8px;
  background: linear-gradient(135deg, #12b7f5, #0073e6);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  font-size: 1.2rem;
}
.modal-info-block p {
  font-size: 0.85rem;
  line-height: 1.6;
}
.modal-info-block strong {
  color: #f0e6ff;
}
.modal-footer-bar {
  padding: 0 2.2rem 1.8rem;
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .hero {
    padding: 7rem 1.25rem 4rem;
    min-height: 100svh;
  }
  .hero-title { font-size: clamp(2rem, 9vw, 3rem); }
  .hero-title .line2 { font-size: clamp(0.9rem, 4vw, 1.3rem); margin-top: 12px; }
  .hero-sub { font-size: 0.9rem; }
  .hero-ctas { flex-direction: column; align-items: center; gap: 0.9rem; }
  .feature-row { grid-template-columns: 1fr; gap: 1rem; }
  .feature-number, .feature-icon-wrap { display: none; }
  .cta-section { padding: 5rem 1.25rem; }
  .cta-title { font-size: clamp(1.8rem, 7vw, 3rem); }
}
</style>
