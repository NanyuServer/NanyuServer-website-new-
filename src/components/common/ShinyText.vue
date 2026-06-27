<script setup>
defineProps({
  text: { type: String, required: true },
  color: { type: String, default: '#b5b5b5' },
  shineColor: { type: String, default: '#d6adfc' },
  speed: { type: Number, default: 2 },
  spread: { type: Number, default: 120 }
})
</script>

<template>
  <span class="shiny-text" :style="{
    '--base-color': color,
    '--shine-color': shineColor,
    '--spread': spread + 'deg',
    '--dur': speed + 's'
  }">
    {{ text }}
  </span>
</template>

<style scoped>
.shiny-text {
  display: inline-block;
  background-image: linear-gradient(
    var(--spread),
    var(--base-color) 0%,
    var(--base-color) 35%,
    var(--shine-color) 50%,
    var(--base-color) 65%,
    var(--base-color) 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine var(--dur) ease-in-out infinite;
}
@keyframes shine {
  0% { background-position: 100% center; }
  100% { background-position: 0% center; }
}
</style>
