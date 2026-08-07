<script setup>
const originalPdfUrl = '/course.pdf'
</script>

<template>
  <div class="page-hero">
    <div class="page-orb" />
    <div class="page-hero-content">
      <div class="page-label">学习资源</div>
      <h1 class="page-title">公益课程</h1>
      <p class="page-sub">汇聚优质教学资源，为学生提供免费学习支持</p>
    </div>
  </div>

  <div class="content-section">
    <div class="info-card">
      <h2 class="course-title">《南渝万能墙公益课程—剪辑软件进阶教程》</h2>
      <p class="course-note">南渝万能墙版权所有 未经允许任何人不得转载商用和署名</p>

      <div class="pdf-frame">
        <div class="pdf-controls">
          <div class="pdf-hint">浏览器内置查看器支持翻页 / 缩放 / 全屏</div>
          <a :href="originalPdfUrl" target="_blank" rel="noopener" class="glass-btn glass-btn-primary glass-btn-sm">下载 PDF</a>
        </div>

        <div class="pdf-viewer">
          <!-- 原生 iframe：浏览器内置 PDF 查看器渲染，不受 CORS / 大小限制 -->
          <iframe
            class="pdf-iframe"
            :src="originalPdfUrl"
            title="公益课程PDF"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 2rem;
  position: relative;
  z-index: 1;
}
.info-card {
  padding: 2rem;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(179, 157, 219, 0.2);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(126, 87, 194, 0.08);
}
.course-title {
  font-family: var(--font-title);
  font-size: 1.35rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}
.course-note {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.75;
  margin-bottom: 1.5rem;
}
.pdf-frame {
  position: relative;
  height: min(84vh, 920px);
  min-height: 520px;
  border: 1px solid rgba(179, 157, 219, 0.2);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
}
.pdf-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  background: rgba(245, 240, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(179, 157, 219, 0.15);
  flex-shrink: 0;
}
.pdf-hint {
  color: var(--text-secondary);
  font-size: 0.82rem;
}
.pdf-viewer {
  width: 100%;
  flex: 1;
  background: #525659;
  position: relative;
}
.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

@media (max-width: 768px) {
  .content-section { padding: 2rem 1.25rem; }
  .pdf-frame { min-height: 440px; }
  .pdf-controls { flex-direction: column; gap: 0.6rem; }
}
</style>
