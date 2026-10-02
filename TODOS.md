# TODOS
## Bot
- [ ] notify payment unlocked (currently disabled)
- [ ] notify order approved (not implemented in backend)
- [ ] notify order fulfilled (not implemented in backend)
- [ ] notify order fulfilled rejected
- [ ] notify vote received (not implemented in emi yet)

## Code review findings (2026-09-27)
### Time tracking
- [ ] validate `START_DATE` at startup (Invalid Date otherwise)

### Bot integration (notify.ts)
- [ ] reviews.ts + vote.ts now call notify*, check remaining ones (ship, fulfill_*, payment unlocked) get wired up; move all notify calls to after commit

### Deployment / docs
- [x] document `LOG_LEVEL`, `NODE_ENV`
- [x] CONTRIBUTING says `main` + `feature/` prefix, repo uses `master` + `feat/`

### Cleanup
- [ ] auth/role middleware instead of ~30 copies of `if (!user) 401` / admin checks
- [ ] shared role helper (`staff` redefined 3x in reviews.ts)
- [ ] dedupe variant+regional price insert (3x in shop.ts), project details loop (2x in vote.ts)
- [ ] remove ~90 lines of commented payout code in ships.ts

### make config module
- [ ] validate all env variables.
- [ ] make them available

## Transactions & error handling (2026-10-02)
Rules:
- `return` inside a `db.transaction` callback COMMITS; any failure after a write must `throw` (`HTTPException`, logged right before with business context).
- Where checks go:
  - input-only checks -> zod schema / before the transaction
  - checks guarding a write -> conditional update (`UPDATE ... WHERE coins >= cost RETURNING`) or `SELECT ... FOR UPDATE` (`.for("update")`)
  - plain reads -> anywhere (a plain `SELECT` in a tx takes no lock under READ COMMITTED)

- [ ] vote.ts: `requestFraudReview` runs after commit and returns 500 on failure although the vote is saved -> ship can go stale; needs retry/outbox or at least a 200 + error log
- [ ] (low prio) orders.ts: item/option/variant reads are unlocked; if one is deleted concurrently the FK on `orderVariantSelection`/`shopOrders` fails -> 500 instead of a 4xx. No bad data, just an ugly error


## Devlogs
- Nice formatting and stuff
-> maybe markdown
-> read from markdown in gh?

## Improvements
- [ ] dynamic FAQ section with a slack bot?
- [ ] ticketing system w/ slack bot
- [ ] user page
- [ ] slack emoji support

### Reviews
- [ ] git stats in review panel?
- [ ] show reviewers ships of projects they already know
-> select where project reviews reviewee = user
- [ ] add review claim to prevent race cond
- [ ] allow requesting ships as non-creator non-staff -> only finished ships or voting
- [ ] fraud review panel
    -> final coin calculation + addition to purse


## Landing
- [ ] emi

## CDN
Banners for proj
attachments for devlogs

## Explore
-> recommendation algo??
-> maybe user following?

## Guides & Resources
vocs.dev?

## Logging
Grafana w/ Loki, Alloy

## Dashboard
* ai ideas generator with #hackclub-ai  ai.hackclub.com :hs:
