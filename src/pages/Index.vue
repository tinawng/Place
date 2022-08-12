<script setup>
import { ref, inject, onMounted } from "vue"
import { numberClamp } from "@/assets/scripts/utils"

const $api = inject("$api")
const evtSource = new EventSource(`${$api.base_url}sse`)

var MAP
const MAP_SIZE = 1024
const CANVAS_SCALE = 3
var color_palette = ref()
const connected_client = ref(0)

const origin_canvas = ref()
var origin_ctx
const scaled_canvas = ref()
var scaled_ctx

const selected_color = ref("rose-500")
const show_palette = ref(false)
const cursor_position_x = ref("0px")
const cursor_position_y = ref("0px")
const palette_translate_x = ref("0px")
const palette_translate_y = ref("0px")
const coolbar = ref()

var canvas_can_move = false
var canvas_can_place = false
var canvas_cooled_down = true
const canvas_zoom = ref(5)
const cursor_canvas_x = ref(512)
const cursor_canvas_y = ref(512)
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
  color_palette.value = await $api.fetchColorPalette()
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
    }
    if (e.button == 0 || e.button == 1) {
      canvas_can_move = true
    }
  })
  window.addEventListener("mouseup", () => {
    canvas_can_move = false
  })
  window.addEventListener("contextmenu", (e) => e.preventDefault())
  window.addEventListener("wheel", (e) => {
    canvas_zoom.value = numberClamp(canvas_zoom.value + (e.deltaY < 0 ? 0.2 : -0.2), 0.3, 8)
  })
  window.addEventListener("mousemove", (e) => {
    requestAnimationFrame(() => {
      cursor_position_x.value = `${Math.floor(e.clientX)}px`
      cursor_position_y.value = `${Math.floor(e.clientY)}px`
    })
  })

  scaled_canvas.value.addEventListener("mousedown", (e) => {
    if (e.button == 0) {
      // Prevent placement if palette was open
      canvas_can_place = !show_palette.value
      show_palette.value = false
    } else if (e.button == 1) {
      show_palette.value = false
    } else if (e.button == 2) {
      show_palette.value = !show_palette.value
      palette_translate_x.value = cursor_position_x.value
      palette_translate_y.value = cursor_position_y.value
    }
  })
  scaled_canvas.value.addEventListener("mouseup", (e) => {
    if (e.button != 0 || !canvas_can_place || !canvas_cooled_down) return

    const r = color_palette.value.get(selected_color.value)[0]
    const g = color_palette.value.get(selected_color.value)[1]
    const b = color_palette.value.get(selected_color.value)[2]

    $api.placePixel({ ...getCursorCanvasPosition(e), r, g, b })

    coolbar.value.classList.add("coolbar_animation")
    canvas_cooled_down = false
    setTimeout(() => {
      coolbar.value.classList.remove("coolbar_animation")
      canvas_cooled_down = true
    }, 500)
  })
  scaled_canvas.value.addEventListener("mousemove", (e) => {
    if (canvas_can_place)
      canvas_can_place = (e.movementX <= 1 && e.movementX >= -1) || (e.movementY <= 1 && e.movementY >= -1)

    let { x, y } = getCursorCanvasPosition(e)
    cursor_canvas_x.value = x
    cursor_canvas_y.value = y

    if (canvas_can_move && !canvas_move_frame_asked) {
      canvas_move_frame_asked = true
      requestAnimationFrame(() => {
        const delta_x = ((e.movementX * 5) / canvas_zoom.value) * 0.2
        const delta_y = ((e.movementY * 5) / canvas_zoom.value) * 0.2
        canvas_view_translate_x.value = String(parseFloat(canvas_view_translate_x.value) + delta_x + "px")
        canvas_view_translate_y.value = String(parseFloat(canvas_view_translate_y.value) + delta_y + "px")
        canvas_move_frame_asked = false
      })
    }
  })
}

function getCursorCanvasPosition(event) {
  const rect = scaled_canvas.value.getBoundingClientRect()
  const x = Math.round((event.clientX - rect.left) / CANVAS_SCALE / canvas_zoom.value) - 1
  const y = Math.round((event.clientY - rect.top) / CANVAS_SCALE / canvas_zoom.value) - 1
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
    <div v-if="show_palette" class="palette__container">
      <div
        v-for="color in color_palette"
        :key="color[0]"
        :style="`background-color: rgb(${color[1].join()});`"
        :class="{
        'border-2': color[0] == 'white',
        'border-4 border-white border-opacity-60': selected_color == color[0]
      }"
        @click="selected_color = color[0]; show_palette = false"
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
      <span>Click & Drag</span>
      <icon class="w-4 lg:w-5" variant="move" />
    </p>
    <p class="flex justify-end items-center gap-2">
      <span>Right Click</span>
      <icon class="w-4 lg:w-5" variant="aperture" />
    </p>
  </div>

  <div ref="coolbar" class="coolbar__container"></div>
</template>

<script setup>
</script>

<style lang="postcss">
.scaled_canvas {
  @apply border-2;
  transform: scale(v-bind(canvas_zoom)) translate(v-bind(canvas_view_translate_x), v-bind(canvas_view_translate_y));
  image-rendering: pixelated;
}
.mini_map_canvas {
  @apply fixed top-6 right-6 lg:top-10 lg:right-10 translate-x-[37%] -translate-y-[37%] z-10;
  @apply p-1;
  @apply bg-white border-2 rounded-sm shadow-xl;
  @apply scale-[0.25];
  image-rendering: pixelated;
}
.palette__container {
  @apply fixed z-20 top-0 left-0;
  transform: translate(
    min(calc(100vw - 105%), calc(v-bind(palette_translate_x) + 10%)),
    min(calc(100vh - 105%), calc(v-bind(palette_translate_y) - 50%))
  );
  @apply p-2 lg:p-3;
  @apply bg-white border rounded shadow-xl;
  @apply grid grid-cols-[auto_auto_auto] justify-center gap-2;
}
.palette__container > * {
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
.coolbar__container {
  @apply absolute left-0 top-0;
  @apply w-3;
  @apply bg-red-200;
  transform: translate(calc(v-bind(cursor_position_x) - 200%), calc(v-bind(cursor_position_y) - 50%));
}
.coolbar_animation {
  animation: cooldown 0.5s linear forwards, hue-rotation 1s linear infinite;
}
</style>