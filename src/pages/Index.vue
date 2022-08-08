<script setup>
import { ref, inject, onMounted } from "vue"
import { numberClamp } from "@/assets/scripts/utils"

const $api = inject("$api")
const evtSource = new EventSource(`${$api.base_url}sse`)

var MAP
const MAP_SIZE = 1024
const CANVAS_SCALE = 3
const ZOOM = ref(5)
const COLORS = new Map([
  ["pink-700", [190, 24, 93]],
  ["pink-500", [236, 72, 153]],
  ["pink-300", [249, 168, 212]],
  ["rose-700", [190, 18, 60]],
  ["rose-500", [244, 63, 94]],
  ["rose-300", [253, 164, 175]],
  ["amber-700", [180, 83, 9]],
  ["amber-500", [245, 158, 11]],
  ["amber-300", [252, 211, 77]],
  ["teal-700", [15, 118, 110]],
  ["teal-500", [20, 184, 166]],
  ["teal-300", [94, 234, 212]],
  ["emerald-700", [4, 120, 87]],
  ["emerald-500", [16, 185, 129]],
  ["emerald-300", [52, 211, 153]],
  ["sky-700", [3, 105, 161]],
  ["sky-500", [14, 165, 233]],
  ["sky-300", [125, 211, 252]],
  ["indigo-700", [67, 56, 202]],
  ["indigo-500", [99, 102, 241]],
  ["indigo-300", [165, 180, 252]],
  ["fuchsia-700", [162, 28, 175]],
  ["fuchsia-500", [217, 70, 239]],
  ["fuchsia-300", [240, 171, 252]],
  ["yellow-800", [133, 77, 14]],
  ["yellow-600", [202, 138, 4]],
  ["orange-300", [253, 186, 116]],
  ["neutral-700", [64, 64, 64]],
  ["neutral-500", [115, 115, 115]],
  ["neutral-300", [212, 212, 212]],
  ["white", [255, 255, 255]],
  ["black", [0, 0, 0]],
])
const connected_client = ref(0)

const origin_canvas = ref()
var origin_ctx
const scaled_canvas = ref()
var scaled_ctx

const selected_color = ref("rose-500")
const show_pallete = ref(false)
const pallete_translate_x = ref("0px")
const pallete_translate_y = ref("0px")

var canvas_can_move = false
const cursor_canvas_x = ref(0)
const cursor_canvas_y = ref(0)
const canvas_view_translate_x = ref("0px")
const canvas_view_translate_y = ref("0px")
var canvas_move_frame_asked = false
var canvas_update_frame_asked = false

evtSource.onmessage = function (event) {
  const payload = JSON.parse(event.data)

  if (payload.type == "connected-client") {
    connected_client.value = payload.data
  } else if (payload.type == "pixel") {
    let { x, y, r, g, b } = payload.data
    const map_pos = y * MAP_SIZE * 4 + x * 4
    MAP[map_pos] = r
    MAP[map_pos + 1] = g
    MAP[map_pos + 2] = b
    MAP[map_pos + 3] = 255

    canvas_update_frame_asked = true
    if (canvas_update_frame_asked) requestAnimationFrame(updateCanvas)
  }
}

onMounted(async () => {
  connected_client.value = await $api.fetchConnectedClient()
  MAP = new Uint8ClampedArray(await $api.fetchMap())

  origin_ctx = origin_canvas.value.getContext("2d")
  scaled_ctx = scaled_canvas.value.getContext("2d")
  scaled_ctx.scale(CANVAS_SCALE, CANVAS_SCALE)
  updateCanvas()

  registerEventListeners()
})

function registerEventListeners() {
  window.addEventListener("mousedown", (e) => {
    if (e.button == 1 || e.button == 2) {
      e.preventDefault()
      if (e.button == 1) canvas_can_move = true
    }
  })
  window.addEventListener("mouseup", () => {
    canvas_can_move = false
  })
  window.addEventListener("contextmenu", (e) => e.preventDefault())
  window.addEventListener("wheel", (e) => {
    ZOOM.value = numberClamp(ZOOM.value + (e.deltaY < 0 ? 0.2 : -0.2), 0.3, 8)
  })

  scaled_canvas.value.addEventListener("mousedown", (e) => {
    if (e.button == 0) {
      show_pallete.value = false

      const r = COLORS.get(selected_color.value)[0]
      const g = COLORS.get(selected_color.value)[1]
      const b = COLORS.get(selected_color.value)[2]

      $api.placePixel({ ...getCursorCanvasPosition(e), r, g, b })
    } else if (e.button == 1) {
      show_pallete.value = false
    } else if (e.button == 2) {
      show_pallete.value = !show_pallete.value
      pallete_translate_x.value = `${Math.floor(e.clientX)}px`
      pallete_translate_y.value = `${Math.floor(e.clientY)}px`
    }
  })
  scaled_canvas.value.addEventListener("mousemove", (e) => {
    let { x, y } = getCursorCanvasPosition(e)
    cursor_canvas_x.value = x
    cursor_canvas_y.value = y

    if (canvas_can_move && !canvas_move_frame_asked) {
      canvas_move_frame_asked = true
      requestAnimationFrame(() => {
        const delta_x = ((e.movementX * 5) / ZOOM.value) * 0.2
        const delta_y = ((e.movementY * 5) / ZOOM.value) * 0.2
        canvas_view_translate_x.value = String(parseFloat(canvas_view_translate_x.value) + delta_x + "px")
        canvas_view_translate_y.value = String(parseFloat(canvas_view_translate_y.value) + delta_y + "px")
        canvas_move_frame_asked = false
      })
    }
  })
}

function getCursorCanvasPosition(event) {
  const rect = scaled_canvas.value.getBoundingClientRect()
  const x = Math.round((event.clientX - rect.left) / CANVAS_SCALE / ZOOM.value) - 1
  const y = Math.round((event.clientY - rect.top) / CANVAS_SCALE / ZOOM.value) - 1
  return { x, y }
}

function updateCanvas() {
  let image_data = new ImageData(MAP, MAP_SIZE, MAP_SIZE)
  origin_ctx.putImageData(image_data, 0, 0)
  scaled_ctx.imageSmoothingEnabled = false
  scaled_ctx.drawImage(origin_canvas.value, 0, 0)

  canvas_update_frame_asked = false
}
</script>

<template>
  <canvas ref="origin_canvas" class="mini_map_canvas" :width="MAP_SIZE" :height="MAP_SIZE" />
  <canvas ref="scaled_canvas" class="scaled_canvas" :width="MAP_SIZE*CANVAS_SCALE" :height="MAP_SIZE*CANVAS_SCALE" />

  <transition name="fade">
    <div v-if="show_pallete" class="pallete__container">
      <div
        v-for="color in COLORS"
        :key="color[0]"
        :style="`background-color: rgb(${color[1].join()});`"
        :class="{
        'border-2': color[0] == 'white',
        'border-4 border-white border-opacity-60': selected_color == color[0]
      }"
        @click="selected_color = color[0]; show_pallete = false"
      />
    </div>
  </transition>

  <div class="position__container">
    <span>X:</span>
    <span>{{cursor_canvas_x}}</span>
    <span class="ml-4">Y:</span>
    <span>{{cursor_canvas_y}}</span>
  </div>

  <div class="tips__container">
    <p class="flex justify-end items-center gap-2">
      <span>{{connected_client}}</span>
      <icon class="w-4 lg:w-6" variant="users" />
    </p>
    <p class="flex justify-end items-center gap-2">
      <span>Left Click</span>
      <icon class="w-4 lg:w-5" variant="edit" />
    </p>
    <p class="flex justify-end items-center gap-2">
      <span>Middle Click</span>
      <icon class="w-4 lg:w-5" variant="move" />
    </p>
    <p class="flex justify-end items-center gap-2">
      <span>Right Click</span>
      <icon class="w-4 lg:w-5" variant="aperture" />
    </p>
  </div>
</template>

<script setup>
</script>

<style lang="postcss">
.scaled_canvas {
  @apply border-2;
  transform: scale(v-bind(ZOOM)) translate(v-bind(canvas_view_translate_x), v-bind(canvas_view_translate_y));
  image-rendering: pixelated;
}
.mini_map_canvas {
  @apply fixed top-6 right-6 lg:top-10 lg:right-10 translate-x-[37%] -translate-y-[37%] z-10;
  @apply p-1;
  @apply bg-white border-2 rounded-sm shadow-xl;
  @apply scale-[0.25];
  image-rendering: pixelated;
}
.pallete__container {
  @apply fixed z-20 top-0 left-0;
  transform: translate(
    min(calc(100vw - 105%), calc(v-bind(pallete_translate_x) + 10%)),
    min(calc(100vh - 105%), calc(v-bind(pallete_translate_y) - 50%))
  );
  @apply p-2 lg:p-3;
  @apply bg-white border rounded shadow-xl;
  @apply grid grid-cols-[auto_auto_auto] justify-center gap-2;
}
.pallete__container > * {
  @apply h-8 w-8 lg:h-10 lg:w-10;
  @apply cursor-pointer;
}

.position__container {
  @apply fixed top-6 lg:top-12 left-1/2 -translate-x-1/2 z-10;
  @apply w-36 lg:w-44 h-10 lg:h-14;
  @apply bg-white border rounded-full shadow-xl;
  @apply flex justify-center items-center lg:gap-1;
  @apply lg:text-xl font-medium;
}
.tips__container {
  @apply fixed bottom-6 right-6 lg:bottom-12 lg:right-12 z-10;
  @apply flex flex-col gap-4;
  @apply text-xs lg:text-sm font-medium;
}
</style>