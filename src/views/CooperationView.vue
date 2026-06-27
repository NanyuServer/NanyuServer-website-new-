<script setup>
import BorderGlow from '@/components/common/BorderGlow.vue'

const cards = [
  {
    icon: 'monitor',
    title: '商业合作',
    desc: '我们欢迎校园组织和机构与南渝万能墙开展商业合作。通过精准的校园营销渠道，帮助合作伙伴触达目标用户群体，实现共赢发展。'
  },
  {
    icon: 'users',
    title: '活动合作',
    desc: '携手举办各类校园活动，包括竞赛、社团等。我们提供专业的活动策划和执行能力，以及庞大的学生群体资源支持。'
  },
  {
    icon: 'tool',
    title: '共创计划',
    desc: '欢迎有创意的同学参与共创计划，将自己的作品以共创形式发布在抖音账号北关鱼的驿站上。'
  }
]

const iconPaths = {
  monitor: ['M2 3h20v14H2zM8 21h8M12 17v4'],
  users: ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M9 7a4 4 0 100-8 4 4 0 000 8z', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
  tool: ['M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z']
}
</script>

<template>
  <div class="page-hero">
    <div class="page-orb" />
    <div class="page-hero-content">
      <div class="page-label">携手共创</div>
      <h1 class="page-title">合作与共创</h1>
      <p class="page-sub">与我们一起探索无限可能，共同创造美好校园生活</p>
    </div>
  </div>

  <div class="content-section">
    <div class="cooperation-grid">
      <BorderGlow v-for="(card, i) in cards" :key="i" :border-radius="24" :glow-radius="36">
        <div class="cooperation-card" style="border:none; box-shadow:none; background:transparent; padding:2rem">
          <div class="cooperation-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path v-for="(d, j) in iconPaths[card.icon]" :key="j" :d="d" />
            </svg>
          </div>
          <h3 class="cooperation-title">{{ card.title }}</h3>
          <p class="cooperation-desc">{{ card.desc }}</p>
        </div>
      </BorderGlow>
    </div>
  </div>
</template>

<style scoped>
.content-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 2rem;
}
.cooperation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}
.cooperation-card {
  padding: 2rem;
  text-align: center;
}
.cooperation-icon {
  width: 64px; height: 64px;
  margin: 0 auto 1.5rem;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #4c2fa3, #e86fa3);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(75, 47, 163, 0.4);
}
.cooperation-icon svg {
  width: 32px; height: 32px;
  color: white;
}
.cooperation-title {
  font-family: var(--font-title);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--accent-gold);
  margin-bottom: 1rem;
}
.cooperation-desc {
  font-family: var(--font-body);
  font-size: 0.95rem;
  line-height: 1.8;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .content-section { padding: 2rem 1.25rem; }
  .cooperation-grid { grid-template-columns: 1fr; }
}
</style>
