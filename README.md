# Jus'STUDY
A study focused [YSWS](https://ysws.hackclub.com/)


## Installation
1. Clone the repo (yeah obviously)
```bash
git clone https://github.com/vividsystem/jusstudy.git
```

2. Install dependencies
```bash
# Install dependencies for all workspaces
bun install
```

3. Set up environment variables

> Set up .env for the client
```bash

nano client/.env
``` 
And paste the following into the file:

`VITE_CLIENT_URL=http://localhost:5173`

> Set up .env for the server
```bash

nano server/.env
``` 
And paste the following into the file:

```env
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=your_database_url
BETTER_AUTH_SECRET=your_secret
HACKCLUB_AUTH_CLIENT_ID=your_client_id
HACKCLUB_AUTH_CLIENT_SECRET=your_client_secret
HACKATIME_API_KEY=your_api_key
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
#### Cloudflare
1. Do this
```bash
openssl rand -base64 32 | bunx wrangler secret put BETTER_AUTH_SECRET
bunx wrangler secret put HACKCLUB_AUTH_CLIENT_ID
bunx wrangler secret put HACKCLUB_AUTH_CLIENT_SECRET
bunx wrangler secret put DATABASE_URL
bunx wrangler secret put HACKATIME_API_KEY

```
2. Add env variables to [wrangler.jsonc](./wrangler.jsonc)
```jsonc
//...
  "vars": {
  	"VITE_CLIENT_URL": "my-variable",
    "CORS_ORIGIN": "SAME AS VITE_CLIENT_URL"
  }
//...
```
NOTE: enviromental loading doesnt work correctly yet as environmental variables passed to the frontend via vite get bundled at compile time so cloudflare variables dont have any effect

## Acknowledgments
This is built upon the [bhvr](https://bhvr.dev) stack. It intern is built upon [bun](https://bun.sh), [hono](https://hono.dev), [vite](https://vitejs.dev) and [react](https://react.dev).
Everything is written in [typescript](https://www.typescriptlang.org/).
The project also uses [drizzle](https://orm.drizzle.team/) as an orm and [better-auth](https://better-auth.com/) together with hackclub-auth to provide auth.

## LICENSE
To see how this project is licensed see [LICENSE](,/LICENSE).
