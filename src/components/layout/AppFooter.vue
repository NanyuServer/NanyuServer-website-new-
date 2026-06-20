<template>
  <footer class="app-footer">
    <div class="footer-copy">© 2026 南渝万能墙运营队 · 保留所有权利</div>
    <router-link to="/admin" class="footer-admin">管理登录</router-link>
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
}
</style>
