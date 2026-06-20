<template>
  <div class="page-hero">
    <div class="page-orb" />
    <div class="page-hero-content">
      <div class="page-label">我们的故事</div>
      <h1 class="page-title">关于我们</h1>
      <p class="page-sub">致力于为南渝学子提供优质的校园服务平台</p>
    </div>
  </div>

  <div class="content-section">
    <div class="info-card glass-card">
      <div class="info-title">🎯 南渝万能墙是什么？</div>
      <div class="info-text">南渝万能墙是一个学生组织的校园公益平台，致力于为广大同学提供信息交流、资源共享和相互帮助的场所。我们相信，通过集体的力量和相互的支持，我们可以打造一个更加温暖、互助的校园社区。</div>
    </div>

    <div class="info-card glass-card">
      <div class="info-title">✨ 我们的使命</div>
      <div class="info-text">
        • 为学生打造开放、透明、互信的信息交流平台<br />
        • 帮助学生表达声音、分享经验、互相支持<br />
        • 提供多样化的学习资源和成长机会<br />
        • 建立包容、尊重的校园文化<br />
        • 促进学生与学校之间的沟通理解
      </div>
    </div>

    <div class="info-card glass-card">
      <div class="info-title">🌟 平台功能</div>
      <div class="info-text">
        <strong>稿件查询</strong> - 便捷的搜索和筛选功能，帮助你快速找到需要的稿件<br />
        <strong>公益课程</strong> - 由南渝万能墙制作的免费学习资源<br />
        <strong>有求必应</strong> - 向南渝万能墙提问校园资讯或问题反馈<br />
        <strong>合作与共创</strong> - 校园组织、同学通过与南渝万能墙合作获得更多曝光<br />
        <strong>招贤纳士</strong> - 加入运营团队管理校园墙，锻炼自己
      </div>
    </div>

    <div class="info-card glass-card">
      <div class="info-title">📞 联系我们</div>
      <div class="info-text">
        有建议、问题如何反馈？<br />
        使用"有求必应"功能提交你的声音，我们会认真倾听并回复。<br /><br />
        <router-link to="/feedback" class="glass-btn glass-btn-ghost glass-btn-sm">
          <span>前往有求必应</span>
        </router-link>
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
.info-title {
  font-family: var(--font-title);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--accent-gold);
  margin-bottom: 1rem;
}
.info-text {
  font-family: var(--font-body);
  font-size: 0.95rem;
  line-height: 1.8;
  color: var(--text-secondary);
}
.info-text strong {
  color: #f0e6ff;
}

@media (max-width: 768px) {
  .content-section { padding: 2rem 1.25rem; }
}
</style>
