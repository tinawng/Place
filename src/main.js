import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'
import { routes } from '@/routes.js'
import $api from '@/assets/scripts/api.js'
import '@/assets/styles/tailwind.css'
import '@/assets/styles/base.postcss'
import { getCookie } from '@/assets/scripts/utils'

const app = createApp(App)

const router = createRouter({ history: createWebHistory(), routes })
app.use(router)

let custom_api_address = getCookie('api-address')
$api.setBaseUrl(custom_api_address ?? import.meta.env.VITE_API_ADDRESS)
app.provide("$api", $api)

app.mount('#app')

