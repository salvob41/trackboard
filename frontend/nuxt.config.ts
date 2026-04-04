// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2024-01-01',
    devtools: { enabled: true },
    ssr: false,
    modules: ['@nuxt/ui', '@nuxt/icon'],
    app: {
        baseURL: process.env.NUXT_PUBLIC_BASE_URL || '/',
    },
    css: ['~/assets/css/main.css'],
})
