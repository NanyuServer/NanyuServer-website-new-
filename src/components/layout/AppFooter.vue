<template>
  <footer class="app-footer">
    <div class="footer-copy">&copy; 2026 南渝万能墙运营队 · 保留所有权利</div>
    <div class="footer-right">
      <a href="/new-index.html" class="footer-beta">BETA预览</a>
      <router-link to="/admin" class="footer-admin">管理登录</router-link>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  padding: 2rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(75, 47, 163, 0.2);
  background: linear-gradient(0deg, rgba(15, 10, 26, 0.9), transparent);
}

.footer-copy {
  font-family: var(--font-body);
  font-size: 0.73rem;
  color: var(--accent-light);
  letter-spacing: 0.06em;
  opacity: 0.6;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.footer-beta {
  font-family: var(--font-ui);
  font-size: 0.73rem;
  color: var(--accent-gold);
  letter-spacing: 0.06em;
  opacity: 0.7;
  text-decoration: none;
  padding: 0.25rem 0.7rem;
  border: 1px solid rgba(232, 201, 122, 0.3);
  border-radius: 100px;
  transition: opacity 0.3s, color 0.3s, border-color 0.3s, background 0.3s;
}
.footer-beta:hover {
  opacity: 1;
  color: var(--accent-gold);
  border-color: var(--accent-gold);
  background: rgba(232, 201, 122, 0.1);
}

.footer-admin {
  font-family: var(--font-ui);
  font-size: 0.73rem;
  color: var(--accent-light);
  letter-spacing: 0.06em;
  opacity: 0.4;
  text-decoration: none;
  transition: opacity 0.3s, color 0.3s;
}
.footer-admin:hover {
  opacity: 1;
  color: var(--accent-gold);
}

@media (max-width: 600px) {
  .app-footer {
    flex-direction: column;
    gap: 0.8rem;
    text-align: center;
  }
  .footer-right {
    gap: 0.8rem;
  }
}
</style>
