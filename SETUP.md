# Setup 
## Local Build
1. Clone the repo (yeah obviously)
```bash
git clone --recurse-submodules https://github.com/vividsystem/jusstudy.git
```
or if you forgot `--recursive-submodules`:
```bash
git submodule update --init emi
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
to make a strong secret you can use something like: `openssl rand -base64 32`.
```env
CLIENT_URL=SAME AS VITE_CLIENT_URL
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=your_database_url
BETTER_AUTH_SECRET=your_secret
BOT_HOST=
BOT_ACCESS_TOKEN=
HACKATIME_UID=
HACKATIME_SECRET=
HACKCLUB_AUTH_CLIENT_ID=your_client_id
HACKCLUB_AUTH_CLIENT_SECRET=your_client_secret
START_DATE=2026-04-08
JOE_API_KEY=JOE_API_KEY
JOE_EVENT_ID=JOE_EVENT_ID
GRAFANA_LOKI_HOST=GRAFANA_HOST
HACKCLUB_CDN_API_KEY=YOUR_API_KEY
```

> Set up .env for `emi`
See [emi/README.md](emi/README.md)

4. Build
```bash
bun run build
```

5. Apply DB schema (this overwrites existing. use this to setup new dbs only. to migrate use `bunx drizzle-kit migrate`)
```bash
cd server
bunx drizzle-kit push
```

## Local Development
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
The `server/.env` and `client/.env` variables still have to be set.

Set `BOT_HOST` to `http://emi:8000`
**For Prod:** 
Make sure you setup a firewall like `ufw` and only allow `8080` and block the grafana ui (use a vpn to access)
```bash
echo "your grafana pw here" | docker secret create grafana_admin_password
sudo docker compose -f prod.compose.yml up --build -d
```
`sudo docker compose -f prod.compose.yml up --build -d` serves all endpoints on `:8080` through nginx.

