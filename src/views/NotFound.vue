<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import code404Glyph from '@/assets/404-glyphs/code404.svg'
import hongGlyph from '@/assets/404-glyphs/hong.svg'
import { Button } from '@/components/ui/button'

const route = useRoute()

const currentPath = computed(() => {
  const query = new URLSearchParams(route.query as Record<string, string>).toString()
  const hash = typeof route.hash === 'string' ? route.hash : ''
  return `${route.path}${query ? `?${query}` : ''}${hash}`
})
</script>

<template>
  <section class="not-found-shell relative flex w-full items-center justify-center overflow-hidden px-4 py-4 sm:px-6 sm:py-8">
    <div class="not-found-wash not-found-wash-left" aria-hidden="true" />
    <div class="not-found-wash not-found-wash-right" aria-hidden="true" />

    <div class="not-found-stage relative z-10 flex w-full max-w-5xl flex-col items-center text-center">
      <div class="hong-scene" aria-hidden="true">
        <p class="hong-kicker">
          薨〇薨
        </p>

        <span class="hong-404">
          <img :src="code404Glyph" alt="" class="hong-404-layer hong-404-main">
          <img :src="code404Glyph" alt="" class="hong-404-layer hong-404-cyan">
          <img :src="code404Glyph" alt="" class="hong-404-layer hong-404-red">
        </span>

        <span class="hong-character">
          <img :src="hongGlyph" alt="" class="hong-glyph">
        </span>
      </div>

      <div class="not-found-copy flex flex-col items-center">
        <h1 class="not-found-title text-2xl font-semibold tracking-[0.15em] text-foreground sm:text-3xl">
          您好，您误入藕花深处了
        </h1>

        <p class="not-found-path text-sm text-muted-foreground sm:text-base">
          这里是
          <code class="rounded-md border bg-background/75 px-2 py-1 font-mono text-foreground">{{ currentPath }}</code>
        </p>

        <Button as-child size="lg" class="min-w-36">
          <RouterLink to="/">
            回到主页
          </RouterLink>
        </Button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.not-found-shell {
  min-height: calc(100dvh - 4rem);
  background:
    radial-gradient(circle at top, color-mix(in oklch, var(--foreground) 7%, transparent), transparent 38%),
    linear-gradient(180deg, color-mix(in oklch, var(--muted) 70%, white), var(--background) 58%);
}

.not-found-stage {
  gap: clamp(1.25rem, 4vh, 2.5rem);
}

.not-found-wash {
  position: absolute;
  width: 22rem;
  height: 22rem;
  border-radius: 9999px;
  background:
    radial-gradient(circle, color-mix(in oklch, var(--foreground) 7%, transparent), transparent 68%);
  filter: blur(10px);
  opacity: 0.72;
}

.not-found-wash-left {
  top: 5%;
  left: -5rem;
}

.not-found-wash-right {
  right: -6rem;
  bottom: 3%;
}

.hong-scene {
  --hong-center-x: 50%;
  --hong-kicker-offset-x: -1.5rem;
  position: relative;
  width: min(86vw, 62rem);
  height: min(46dvh, 34rem);
  min-height: 14rem;
}

.hong-kicker {
  position: absolute;
  left: calc(var(--hong-center-x) + var(--hong-kicker-offset-x));
  top: 5%;
  z-index: 2;
  margin: 0;
  transform: translateX(-50%);
  letter-spacing: 0.55em;
  font-size: 0.95rem;
  color: color-mix(in oklch, var(--muted-foreground) 88%, transparent);
  opacity: 0;
  animation: copy-enter 540ms ease-out 2380ms both;
}

.hong-404,
.hong-character {
  position: absolute;
  left: var(--hong-center-x);
  top: 50%;
  line-height: 1;
  user-select: none;
}

.hong-character {
  width: clamp(14rem, 34vw, 26rem);
  height: clamp(14rem, 34vw, 26rem);
  transform: translate(-50%, -50%);
  animation: hong-enter 1900ms cubic-bezier(0.18, 0.82, 0.22, 1) both;
}

.hong-glyph {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  filter: blur(8px);
  user-select: none;
  pointer-events: none;
  animation: hong-fade 680ms ease-out 1500ms both;
}

.hong-404 {
  width: clamp(18rem, 64vw, 50rem);
  aspect-ratio: 3810 / 1904;
  opacity: 0;
  transform: translate(-50%, -36%) scale(1.08);
  animation: error-code-enter 760ms ease-out 2140ms both;
}

.hong-404-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.hong-404-main {
  opacity: 0.24;
}

.hong-404-cyan {
  opacity: 0.16;
  transform: translateX(0.9%);
  filter: hue-rotate(148deg) saturate(1.2) brightness(1.03);
}

.hong-404-red {
  opacity: 0.16;
  transform: translateX(-0.9%);
  filter: hue-rotate(-24deg) saturate(1.1) brightness(1.01);
}

.not-found-copy {
  gap: 0.75rem;
  max-width: min(92vw, 38rem);
  opacity: 0;
  animation: copy-enter 540ms ease-out 2380ms both;
}

.not-found-title,
.not-found-path {
  margin: 0;
}

.not-found-path {
  margin-bottom: 1.25rem;
}

@keyframes hong-enter {
  0% {
    transform: translate(-50%, -52%) scale(6.4);
  }

  58% {
    transform: translate(-50%, -50%) scale(1.08);
  }

  100% {
    transform: translate(-45%, -35%) scale(0.82);
  }
}

@keyframes hong-fade {
  0% {
    opacity: 0;
    filter: blur(8px);
  }

  100% {
    opacity: 1;
    filter: blur(0);
  }
}

@keyframes error-code-enter {
  0% {
    opacity: 0;
    filter: blur(10px);
    transform: translate(-50%, -36%) scale(1.18);
  }

  70% {
    opacity: 1;
    filter: blur(0);
    transform: translate(-50%, -36%) scale(1.01);
  }

  100% {
    opacity: 1;
    filter: blur(0);
    transform: translate(-50%, -36%) scale(1);
  }
}

@keyframes copy-enter {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .hong-scene {
    height: min(34dvh, 24rem);
    min-height: 12rem;
  }

  .hong-kicker {
    top: 8%;
    font-size: 0.8rem;
  }

  .hong-character {
    animation-duration: 1700ms;
  }

  .hong-glyph {
    animation-duration: 620ms;
  }

  .hong-404 {
    width: clamp(14rem, 76vw, 26rem);
  }
}

@media (orientation: landscape) and (max-height: 760px) {
  .not-found-shell {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }

  .not-found-stage {
    gap: 0.875rem;
  }

  .hong-scene {
    width: min(76vw, 48rem);
    height: min(30dvh, 13rem);
    min-height: 10rem;
  }

  .hong-kicker {
    top: 2%;
    font-size: 0.8rem;
  }

  .hong-character {
    width: clamp(8rem, 15vw, 13rem);
    height: clamp(8rem, 15vw, 13rem);
  }

  .hong-404 {
    width: clamp(16rem, 42vw, 28rem);
  }

  .not-found-copy {
    gap: 0.5rem;
  }

  .not-found-title {
    font-size: clamp(1.25rem, 2.2vw, 1.75rem);
    letter-spacing: 0.08em;
  }

  .not-found-path {
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
  }
}
</style>
