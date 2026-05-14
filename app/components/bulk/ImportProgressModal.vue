<template>
  <Teleport to="body">
    <Transition name="import-progress-fade">
      <div v-if="open" class="import-progress-backdrop" role="status" aria-live="assertive" aria-label="Import in progress">
        <div class="import-progress-card">
          <div class="import-progress-visual" aria-hidden="true">
            <svg class="import-progress-svg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="ipm-file-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--color-brand, #1b3a5c)" stop-opacity="0.95" />
                  <stop offset="100%" stop-color="var(--color-brand, #1b3a5c)" stop-opacity="0.7" />
                </linearGradient>
                <linearGradient id="ipm-cloud-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--color-brand, #1b3a5c)" stop-opacity="0.22" />
                  <stop offset="100%" stop-color="var(--color-brand, #1b3a5c)" stop-opacity="0.08" />
                </linearGradient>
                <radialGradient id="ipm-cloud-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="var(--color-brand, #1b3a5c)" stop-opacity="0.45" />
                  <stop offset="60%" stop-color="var(--color-brand, #1b3a5c)" stop-opacity="0.08" />
                  <stop offset="100%" stop-color="var(--color-brand, #1b3a5c)" stop-opacity="0" />
                </radialGradient>
              </defs>

              <!-- Outer ambient glow (large, soft) -->
              <circle class="ipm-glow ipm-glow--outer" cx="60" cy="32" r="44" fill="url(#ipm-cloud-glow)" />
              <!-- Inner core glow (tighter, brighter) -->
              <circle class="ipm-glow ipm-glow--inner" cx="60" cy="32" r="26" fill="url(#ipm-cloud-glow)" />

              <!-- Cloud (destination / server) -->
              <g class="ipm-cloud">
                <path
                  d="M 30,44
                     A 12,12 0 0 1 34,22
                     A 14,14 0 0 1 58,20
                     A 14,14 0 0 1 82,22
                     A 12,12 0 0 1 90,44
                     Z"
                  fill="url(#ipm-cloud-fill)"
                  stroke="var(--color-brand, #1b3a5c)"
                  stroke-width="1.6"
                  stroke-opacity="0.6"
                  stroke-linejoin="round"
                />
                <!-- Down arrow inside cloud (drop-zone marker) -->
                <g class="ipm-cloud-arrow"
                   stroke="var(--color-brand, #1b3a5c)"
                   stroke-width="2"
                   stroke-linecap="round"
                   stroke-linejoin="round"
                   fill="none"
                   stroke-opacity="0.55">
                  <line x1="60" y1="24" x2="60" y2="40" />
                  <polyline points="54,34 60,40 66,34" />
                </g>
              </g>

              <!-- Motion guide (subtle dotted line between file and cloud) -->
              <line
                x1="60" y1="48" x2="60" y2="98"
                stroke="var(--color-brand, #1b3a5c)"
                stroke-width="1.4"
                stroke-opacity="0.18"
                stroke-dasharray="2 4"
                stroke-linecap="round"
              />

              <!-- Particle trail (sparks rising up to the cloud) -->
              <circle class="ipm-particle ipm-particle--1" cx="60" cy="100" r="1.6" fill="var(--color-brand, #1b3a5c)" />
              <circle class="ipm-particle ipm-particle--2" cx="56" cy="100" r="1.2" fill="var(--color-brand, #1b3a5c)" />
              <circle class="ipm-particle ipm-particle--3" cx="64" cy="100" r="1.2" fill="var(--color-brand, #1b3a5c)" />

              <!-- File / document — rises into cloud and fades -->
              <g class="ipm-file">
                <path
                  d="M 47,76 L 65,76 L 73,84 L 73,108 L 47,108 Z"
                  fill="url(#ipm-file-fill)"
                  stroke="var(--color-brand, #1b3a5c)"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                />
                <path
                  d="M 65,76 L 65,84 L 73,84 Z"
                  fill="var(--color-brand, #1b3a5c)"
                  fill-opacity="0.45"
                  stroke="var(--color-brand, #1b3a5c)"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                />
                <line x1="52" y1="92"  x2="68" y2="92"  stroke="white" stroke-width="1.4" stroke-opacity="0.9"  stroke-linecap="round" />
                <line x1="52" y1="97"  x2="69" y2="97"  stroke="white" stroke-width="1.4" stroke-opacity="0.7"  stroke-linecap="round" />
                <line x1="52" y1="102" x2="63" y2="102" stroke="white" stroke-width="1.4" stroke-opacity="0.55" stroke-linecap="round" />
              </g>
            </svg>
          </div>

          <p class="import-progress-title">Importing to catalog…</p>
          <p v-if="label" class="import-progress-label">{{ label }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean;
  label?: string;
}>();
</script>

<style scoped>
.import-progress-backdrop {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(27, 58, 92, 0.38);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

.import-progress-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2.25rem 2.75rem 2rem;
  background: var(--color-surface-card);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow-hover);
  min-width: 220px;
  max-width: 320px;
  text-align: center;
}

.import-progress-visual {
  width: 120px;
  height: 120px;
}

.import-progress-svg {
  width: 120px;
  height: 120px;
  overflow: visible;
}

.import-progress-title {
  margin: 0;
  font-size: var(--paragraph-size);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: 1.35;
}

.import-progress-label {
  margin: 0;
  font-size: var(--paragraph-size-small);
  color: var(--color-text-muted);
  line-height: 1.4;
}

/* ── File-to-cloud upload animation ──────────────────────────────────── */

@keyframes ipm-file-rise {
  0%   { transform: translateY(0);     opacity: 0; }
  8%   { opacity: 1; }
  85%  { transform: translateY(-60px); opacity: 0; }
  100% { transform: translateY(0);     opacity: 0; }
}

@keyframes ipm-particle-rise {
  0%   { transform: translateY(0);    opacity: 0; }
  15%  { transform: translateY(-12px); opacity: 0.95; }
  70%  { transform: translateY(-58px); opacity: 0.55; }
  100% { transform: translateY(-78px); opacity: 0; }
}

@keyframes ipm-cloud-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-2px); }
}

@keyframes ipm-glow-outer {
  0%, 45%, 100% { opacity: 0.5;  transform: scale(1); }
  64%, 76%      { opacity: 1;    transform: scale(1.18); }
}

@keyframes ipm-glow-inner {
  0%, 45%, 100% { opacity: 0.55; transform: scale(0.9); }
  64%, 76%      { opacity: 1;    transform: scale(1.25); }
}

@keyframes ipm-arrow-pulse {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
}

.ipm-file {
  transform-box: fill-box;
  transform-origin: center;
  animation: ipm-file-rise 2.6s linear infinite;
}

.ipm-particle {
  transform-box: fill-box;
  transform-origin: center;
  animation: ipm-particle-rise 2.6s ease-in-out infinite;
}

.ipm-particle--1 { animation-delay: 0.05s; }
.ipm-particle--2 { animation-delay: 0.45s; }
.ipm-particle--3 { animation-delay: 0.85s; }

.ipm-cloud {
  transform-box: fill-box;
  transform-origin: center;
  animation: ipm-cloud-bob 2.6s ease-in-out infinite;
}

.ipm-glow {
  transform-box: fill-box;
  transform-origin: center;
}

.ipm-glow--outer {
  animation: ipm-glow-outer 2.6s ease-in-out infinite;
}

.ipm-glow--inner {
  animation: ipm-glow-inner 2.6s ease-in-out infinite;
  mix-blend-mode: screen;
}

.ipm-cloud-arrow {
  animation: ipm-arrow-pulse 1.6s ease-in-out infinite;
}

/* ── Enter / leave transition ─────────────────────────────────────────── */

.import-progress-fade-enter-active,
.import-progress-fade-leave-active {
  transition: opacity 0.2s ease;
}

.import-progress-fade-enter-from,
.import-progress-fade-leave-to {
  opacity: 0;
}
</style>
