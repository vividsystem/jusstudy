# Setup 


## Local
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

paste the following into `client/.env`:
for prod change the client and server urls to the urls where the front- and backend- are going to be exposed
```env
VITE_CLIENT_URL=http://localhost:5173
VITE_SERVER_URL=http://localhost:3000
VITE_HIDE_LOGIN=yes # if you want to disable login
```

> Set up .env for the server
paste the following into `server/.env`:
adjust the base origin to the url that you are going to expose
to make a strong secret you can use something like: `openssl rand -base64 32`
```env
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=your_database_url
BETTER_AUTH_SECRET=your_secret
HACKCLUB_AUTH_CLIENT_ID=your_client_id
HACKCLUB_AUTH_CLIENT_SECRET=your_client_secret
START_DATE=2026-04-08
JOE_API_KEY=JOE_API_KEY
JOE_EVENT_ID=JOE_EVENT_ID
GRAFANA_LOKI_HOST=GRAFANA_HOST
HACKCLUB_CDN_API_KEY=YOUR_API_KEY
```

4. Build
```bash
bun run build
```

### Local Development
(follow steps 1 to 3 from Local)
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


## Databases
You can use drizzle-kit with `push` or `migrate` (may not work due to custom migrations) or use the sql-files

## Deployment
### Docker
The `server/.env` variables still have to be set.
`sudo docker compose up backend --build -d`
### Cloudflare
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
  	"VITE_CLIENT_URL": "my-variable", // this does unfortunately not work currently because VITE_ variables get read on compile time...
    "CORS_ORIGIN": "SAME AS VITE_CLIENT_URL"
    "START_DATE": "2026-01-01" // the start date of the ysws
  }
//...
```
NOTE: enviromental loading doesnt work correctly yet as environmental variables passed to the frontend via vite get bundled at compile time so cloudflare variables dont have any effect

