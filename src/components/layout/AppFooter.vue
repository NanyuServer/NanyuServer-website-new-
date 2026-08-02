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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
          回到顶部
        </button>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  padding: 2.5rem 2rem;
  border-top: 1px solid rgba(179, 157, 219, 0.15);
  background: linear-gradient(0deg, rgba(237, 231, 246, 0.3) 0%, transparent 100%);
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
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(179, 157, 219, 0.2);
  border-radius: 100px;
  padding: 0.4rem 0.9rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.back-to-top:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(179, 157, 219, 0.35);
  color: var(--accent-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(179, 157, 219, 0.1);
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
