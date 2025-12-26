// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },

	// SPA モード
	ssr: false,

	runtimeConfig: {
		public: {
			apiBase: 'http://localhost:8000', // バックエンドAPIのURL
		},
	},

	modules: ['shadcn-nuxt'],
	css: ['~/assets/css/main.css'],
	postcss: {
		plugins: {
			tailwindcss: {},
			autoprefixer: {},
		},
	},
})
