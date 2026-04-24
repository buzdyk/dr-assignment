import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/fonts'],

  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/app.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  fonts: {
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 500, 700] },
    ],
  },
})
