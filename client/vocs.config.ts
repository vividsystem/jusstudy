import { defineConfig } from 'vocs'

export default defineConfig({
	description: 'Guides to help you learn build!',
	title: 'JUS\'Study Guides',
	basePath: "/docs",
	checkDeadlinks: true,
	aiCta: false,
	sidebar: [
		{
			text: "Getting Started",
			link: "/"
		},
		{
			text: "Hardware",
			collapsed: false,
			items: [
				{
					text: "Building a simple pomodoro timer",
					link: "/hw/first-project"
				},
				{
					text: "Further Ressources",
					link: "/hw/ressources"
				}
			]
		},
		{
			text: "Software",
			collapsed: false,
			items: [
				{
					text: "Building a simple to-do website",
					link: "/hw/first-project"
				},
				{
					text: "Further Ressources",
					link: "/sw/ressources"
				},
					]
				},
		{
			text: "Rewards",
			collapsed: false,
			items: [
				{
					text: "How it works",
					link: "/rewards/first-project"
				},
				{
					text: "Further Ressources",
					link: "/rewards/ressources"
				}
			]
		},
		{
			text: "Guides",
			collapsed: false,
			items: [
				{
					text: "Make a Stationary Organiser",
					link: "/guides/stationary-organiser"
				}
			]
		},
		{
			text: "Help",
			collapsed: false,
			items: [
				{
					text: "Resources",
					link: "/help/resources"
				},
				{
					text: "FAQ",
					link: "/help/faq"
				}
			]
		}
	]
})
