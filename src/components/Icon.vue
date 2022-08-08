<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <g v-if="!variant || variant == 'eth'">
      <path
        fill="currentColor"
        stroke="transparent"
        d="M12,1.75L5.75,12.25L12,16L18.25,12.25L12,1.75M5.75,13.5L12,22.25L18.25,13.5L12,17.25L5.75,13.5Z"
      />
    </g>
    <g v-else-if="variant == 'trend-up'">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </g>
    <g v-else-if="variant == 'trend-down'">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
      <polyline points="17 18 23 18 23 12"></polyline>
    </g>
    <g v-else-if="variant == 'minus'">
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </g>
  </svg>
</template>

<script setup>
defineProps({
  variant: String,
  stroke: {
    type: Number,
    default: 1.5,
  },
});
</script>