<script setup>
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <div class="footer-copy">&copy; 2026 南渝万能墙运营队 · 保留所有权利</div>
      <div class="footer-actions">
        <router-link to="/admin" class="footer-admin">管理登录</router-link>
        <button class="back-to-top" @click="scrollToTop" aria-label="回到顶部">
          回到顶部
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  padding: 2.5rem 2rem;
  position: relative;
  z-index: 1;
}

.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-copy {
  font-family: var(--font-body);
  font-size: 0.78rem;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.footer-admin {
  font-family: var(--font-ui);
  font-size: 0.78rem;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-admin:hover {
  color: var(--accent-dark);
}

.back-to-top {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-ui);
  font-size: 0.78rem;
  color: var(--text-muted);
  background: rgba(179, 157, 219, 0.08);
  border: none;
  border-radius: 100px;
  padding: 0.4rem 1rem;
  cursor: pointer;
  transition: all 0.25s;
}

.back-to-top:hover {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(179, 157, 219, 0.3);
  color: var(--accent-dark);
  transform: translateY(-1px);
}

@media (max-width: 600px) {
  .footer-inner {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .footer-actions {
    gap: 0.8rem;
  }
}
</style>
