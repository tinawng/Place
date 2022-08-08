export const routes = [
  {
    path: '/',
    component: () => import('@/layouts/Default.vue'),
    children: [
      {
        name: 'Home',
        path: '/',
        component: () => import('@/pages/Index.vue')
      }
    ]
  },
]
