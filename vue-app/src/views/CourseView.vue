<script setup>
import { ref, onMounted } from 'vue'

const pdfUrl = 'https://videotourl.com/documents/1777475377797-4308193f-0dd7-4ebf-a2fc-f5abceadccd4.pdf'
const pdfLib = ref(null)
const pdfDoc = ref(null)
const currentPage = ref(1)
const totalPages = ref(0)
const loading = ref(true)
const error = ref('')

let renderTask = null

async function renderPage(pageNum) {
  if (!pdfDoc.value) return
  try {
    const page = await pdfDoc.value.getPage(pageNum)
    const scale = Math.min(2, window.innerWidth > 768 ? 1.5 : 1)
    const viewport = page.getViewport({ scale })
    const canvas = document.getElementById('pdf-canvas')
    if (!canvas) return
    const context = canvas.getContext('2d')

    if (renderTask) {
      renderTask.cancel()
    }

    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.background = 'white'

    renderTask = page.render({ canvasContext: context, viewport })
    await renderTask.promise
    currentPage.value = pageNum
    renderTask = null
  } catch (e) {
    if (e?.name !== 'RenderingCancelledException') {
      console.error('PDF渲染错误:', e)
    }
  }
}

function prevPage() {
  if (currentPage.value > 1) renderPage(currentPage.value - 1)
}
function nextPage() {
  if (currentPage.value < totalPages.value) renderPage(currentPage.value + 1)
}

onMounted(async () => {
  try {
    // Load PDF.js from CDN
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'
        s.onload = resolve
        s.onerror = reject
        document.head.appendChild(s)
      })
    }
    const pdfjsLib = window.pdfjsLib || window.pdfjs
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'

    const response = await fetch(pdfUrl, { mode: 'cors', credentials: 'omit' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const arrayBuffer = await response.arrayBuffer()
    pdfDoc.value = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    totalPages.value = pdfDoc.value.numPages
    loading.value = false
    renderPage(1)

    window.addEventListener('resize', () => renderPage(currentPage.value))
  } catch (e) {
    error.value = e.message || '加载失败'
    loading.value = false
  }
})
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
    <div class="info-card glass-card">
      <h2 class="course-title">《南渝万能墙公益课程—剪辑软件进阶教程》</h2>
      <p class="course-note">南渝万能墙版权所有 未经允许任何人不得转载商用和署名</p>

      <div class="pdf-frame">
        <div class="pdf-controls">
          <div class="pdf-nav">
            <button class="glass-btn glass-btn-ghost glass-btn-sm" @click="prevPage" :disabled="currentPage <= 1">← 上一页</button>
            <span class="page-info">页 {{ currentPage }}{{ totalPages ? ' / ' + totalPages : '' }}</span>
            <button class="glass-btn glass-btn-ghost glass-btn-sm" @click="nextPage" :disabled="currentPage >= totalPages">下一页 →</button>
          </div>
          <a :href="pdfUrl" target="_blank" class="glass-btn glass-btn-primary glass-btn-sm">下载 PDF</a>
        </div>

        <div class="pdf-viewer">
          <template v-if="loading">
            <div class="pdf-loading">
              <div class="spinner" />
              <p>PDF 加载中…</p>
            </div>
          </template>
          <template v-else-if="error">
            <div class="pdf-error">
              <p>PDF加载失败: {{ error }}</p>
              <a :href="pdfUrl" target="_blank" style="color: var(--accent-gold);">点击下载查看</a>
            </div>
          </template>
          <canvas id="pdf-canvas" style="display: block; max-width: 100%; height: auto;" />
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
}
.info-card {
  padding: 2rem;
  margin-bottom: 2rem;
}
.course-title {
  font-family: var(--font-title);
  font-size: 1.35rem;
  color: #f0e6ff;
  margin-bottom: 0.5rem;
}
.course-note {
  font-size: 0.95rem;
  color: var(--accent-light);
  line-height: 1.75;
  margin-bottom: 1.5rem;
}
.pdf-frame {
  position: relative;
  min-height: 720px;
  height: min(84vh, 920px);
  border: 1px solid rgba(123, 85, 212, 0.25);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: rgba(10, 7, 22, 0.95);
  display: flex;
  flex-direction: column;
}
.pdf-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem;
  background: rgba(45, 27, 107, 0.5);
  border-bottom: 1px solid rgba(123, 85, 212, 0.15);
  flex-shrink: 0;
}
.pdf-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.page-info {
  color: var(--accent-light);
  font-size: 0.85rem;
  min-width: 80px;
  text-align: center;
}
.pdf-viewer {
  width: 100%;
  flex: 1;
  overflow: auto;
  background: rgba(10, 7, 22, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
}
.pdf-loading, .pdf-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--text-secondary);
  text-align: center;
  padding: 2rem;
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(123, 85, 212, 0.15);
  border-top-color: #7b55d4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@media (max-width: 768px) {
  .content-section { padding: 2rem 1.25rem; }
  .pdf-frame { min-height: 520px; }
}
</style>
