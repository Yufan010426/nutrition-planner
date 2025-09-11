<template>
  <!-- 全站导航 -->
  <NavBar />

  <!-- 页面主体 -->
  <main class="container">
    <router-view />
  </main>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
</script>

<style>
/* ====== 全局基础 ====== */
html, body, #app {
  height: 100%;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "PingFang SC",
               "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
  /* 公共目录下的背景图：/public/background.png -> 运行时用根路径访问 */
  background-image: url('/background.png');
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
  background-attachment: fixed;
  color: #1f2937; /* 文字对比度更好 */
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 84px 16px 24px;  
  background: transparent;
  min-height: 100dvh;       
  box-sizing: border-box;
}

a { color: #111; text-decoration: none; }
.router-link-active { font-weight: 600; }

@media (max-width: 640px) {
  .container {
    padding: 76px 12px 20px;
  }
}
</style>
