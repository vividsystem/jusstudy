# Setup 
## Local Build
1. Clone the repo (yeah obviously)
```bash
git clone --recurse-submodules https://github.com/vividsystem/jusstudy.git
```
or if you forgot `--recurse-submodules`:
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
Log levels: `fatal`, `error`, `warn`, `info`, `debug`, `trace`
```env
START_DATE=2026-04-08
CLIENT_URL=SAME AS VITE_CLIENT_URL
SERVER_URL=SAME_AS_VITE_SERVER_URL
LOG_LEVEL=default:info
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=your_database_url
BETTER_AUTH_SECRET=your_secret
BOT_HOST=
BOT_ACCESS_TOKEN=
HACKATIME_UID=
HACKATIME_SECRET=
HACKCLUB_AUTH_CLIENT_ID=your_client_id
HACKCLUB_AUTH_CLIENT_SECRET=your_client_secret
HACKCLUB_CDN_API_KEY=YOUR_API_KEY
JOE_API_KEY=JOE_API_KEY
JOE_EVENT_ID=JOE_EVENT_ID
OTEL_EXPORTER_OTLP_ENDPOINT=GRAFANA_ALLOY_ETC_HOST
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
Use `cd server && bun run src/db/migrate.ts` exclusively or `cd server && bunx drizzle-kit migrate` (not recommended due to less verbosity when errors happen). 
> [!ERROR]
> If you use `bunx drizzle-kit push` drizzle won't automatically keep track of migrations and future ones might break.

## Deployment
### Docker
The `server/.env` and `client/.env` variables still have to be set.
`OTEL_EXPORTER_OTLP_ENDPOINT`, `BOT_HOST`, `NODE_ENV` get set automatically and don't have to be set in `.env`
#### Production
Add a `.env` file with `GRAFANA_ADMIN_PASSWORD`.
Make sure you setup a firewall like `ufw` and only allow `8080` and block the grafana ui (use a vpn to access)

If you want to run a postgres instance as well you can use the `postgres` service for an easily deployable option.
BEWARE: you have to apply the sql schema to the database before deploying!
You will have to populate the secrets(in `secrets/`): `pg_superuser_password`, `pg_migrator_password`, `pg_readonly_password`, `pg_app_password`.
```bash
docker compose -f prod.compose.yml up frontend -d
```
Grafana can be accessed via `localhost:3001`.
Both backend and frontend will be served through nginx at `:8080`
To update the code in prod:
```bash
docker compose -f prod.compose.yml pull
git pull
```
then restart your containers
To migrate in prod (all containers have to be up to date):
```bash
docker compose -f prod.compose.yml run --rm migrate
```
