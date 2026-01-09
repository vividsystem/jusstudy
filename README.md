# Jus'STUDY
A study focused [YSWS](https://ysws.hackclub.com/)


## Installation
1. Clone the repo (yeah obviously)

2. Install dependencies
```bash
# Install dependencies for all workspaces
bun install
```

## Development

```bash
# Run all workspaces in development mode with Turbo
bun run dev

# Or run individual workspaces directly
bun run dev:client    # Run the Vite dev server for React
bun run dev:server    # Run the Hono backend

# Lint all workspaces
bun run lint

# Type check all workspaces
bun run type-check

# Run tests across all workspaces
bun run test
```

## Building

```bash
# Build all workspaces with Turbo
bun run build

# Or build individual workspaces directly
bun run build:client  # Build the React frontend
bun run build:server  # Build the Hono backend
```

### Deployment
(this section is still boilerplate while we figure out how to host this)

Deploying each piece is very versatile and can be done numerous ways, and exploration into automating these will happen at a later date. Here are some references in the meantime.

**Client**
- [Orbiter](https://orbiter.host)
- [GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages)
- [Netlify](https://vite.dev/guide/static-deploy.html#netlify)
- [Cloudflare Pages](https://vite.dev/guide/static-deploy.html#cloudflare-pages)

**Server**
- [Cloudflare Worker](https://gist.github.com/stevedylandev/4aa1fc569bcba46b7169193c0498d0b3)
- [Bun](https://hono.dev/docs/getting-started/bun)
- [Node.js](https://hono.dev/docs/getting-started/nodejs)

## Acknowledgments
This is built upon the [bhvr](https://bhvr.dev) stack. It intern is built upon [bun](https://bun.sh), [hono](https://hono.dev), [vite](https://vitejs.dev) and [react](https://react.dev).
Everything is written in [typescript](https://www.typescriptlang.org/).
The project also uses [drizzle](https://orm.drizzle.team/) as an orm and [better-auth](https://better-auth.com/) together with hackclub-auth to provide auth.

## LICENSE
To see how this project is licensed see [LICENSE](,/LICENSE).
