import type { Config } from "@react-router/dev/config";

export default {
	splitRouteModules: true,
	appDirectory: "src",
	ssr: false,
	buildDirectory: "client-dist",
	async prerender() {
		return ["/"]
	}
} satisfies Config;
