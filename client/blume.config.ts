import { defineConfig } from 'blume';

export default defineConfig({
	title: 'JUS\'Study Guides',
	description: 'Guides to help you learn build!',
	basePath: "/guides",
	ai: {
		llmsTxt: false,
		mcp: {
			enabled: false
		},
		markdownComponents: {}
	},
	navigation: {
		tabs: [{ label: "API Reference", path: "/guides/api" }]
	},
	seo: {
		contentSignals: {
			aiInput: false,
			aiTrain: false,
			search: true
		}
	}

})
