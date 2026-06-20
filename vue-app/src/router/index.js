import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('@/views/HomeView.vue') },
  { path: '/query', name: 'Query', component: () => import('@/views/QueryView.vue') },
  { path: '/course', name: 'Course', component: () => import('@/views/CourseView.vue') },
  { path: '/feedback', name: 'Feedback', component: () => import('@/views/FeedbackView.vue') },
  { path: '/cooperation', name: 'Cooperation', component: () => import('@/views/CooperationView.vue') },
  { path: '/recruit', name: 'Recruit', component: () => import('@/views/RecruitView.vue') },
  { path: '/about', name: 'About', component: () => import('@/views/AboutView.vue') },
  { path: '/admin', name: 'Admin', component: () => import('@/views/AdminView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
