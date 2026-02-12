# Visa Tracking App

A community-driven German student visa application tracker built for a ~2300-member Turkish student group. Users can collectively log and monitor visa processing timelines across different consulates.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Database:** Turso (libSQL) — edge SQLite
- **Deployment:** Vercel

## Features

- Shared real-time data — all users see the same dataset
- Live reload — automatic background refresh every 15s with idle detection
- Active visitors — real-time count of online users
- Dark/light mode — theme toggle with system preference support, no flash (FOIT prevention)
- Inline editing — click any cell to update
- Infinite scroll — paginated table loading (200 rows/page)
- Statistics dashboard — processing time averages, consulate breakdowns, city stats
- Filtering — by consulate, city, date range, result status
- CSV/JSON import & export
- Automatic name masking for privacy
- IP-based rate limiting, input validation, security headers
- Delete protection — progressive warning + permanent restriction for abuse
- Data preservation — resolved rows older than 60 days cannot be deleted

## Getting Started

### Prerequisites

- Node.js 18+
- A Turso database ([turso.tech](https://turso.tech))

### Setup

1. Clone and install:
   ```bash
   git clone https://github.com/sametatila/visa-tracking-app.git
   cd visa-tracking-app
   npm install
   ```

2. Create `.env.local` from the template:
   ```bash
   cp .env.example .env.local
   ```

3. Update `.env.local` with your Turso credentials:
   ```
   TURSO_DATABASE_URL=libsql://your-db.turso.io
   TURSO_AUTH_TOKEN=your-token
   ```

4. Initialize the database:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
  app/
    api/rows/           # GET (paginated) + POST
    api/rows/[id]/      # PUT + DELETE
    api/rows/stats/     # GET (all filtered rows for statistics)
    page.tsx            # Main page
  app/
    banned/             # Restricted access page
  components/
    AppShell.tsx        # Main orchestrator (fetch, filter, state)
    DataTable.tsx       # Table with infinite scroll
    TableRow.tsx        # Editable row with inline save
    AddRowModal.tsx     # New entry form
    FilterBar.tsx       # Filter controls
    StatCards.tsx       # Statistics dashboard
    TopBar.tsx          # Theme toggle button
    LiveReloadIndicator.tsx  # Live reload status indicator
  context/
    AppContext.tsx      # Global state (useReducer)
    ThemeContext.tsx    # Dark/light theme management
  hooks/
    useRowsAPI.ts       # API communication hook
    useLiveReload.ts    # Auto-refresh with idle detection
  lib/
    db.ts               # Turso client singleton
    queryBuilder.ts     # SQL filter builder
    validation.ts       # Server-side input validation
    rateLimit.ts        # IP-based rate limiter
    ipBan.ts            # Delete abuse detection & IP restriction
    activeVisitors.ts   # In-memory visitor counter
    derivation.ts       # RawRow -> DerivedRow computation
    statistics.ts       # Stats computation
    types.ts            # TypeScript interfaces
    constants.ts        # Consulates, cities, columns
    filterParams.ts     # FilterState -> URLSearchParams
    dateUtils.ts        # Date parsing & validation
    maskUtils.ts        # Name masking
    csvUtils.ts         # CSV/JSON import & export
scripts/
  seed.ts               # Database table creation
.github/
  workflows/
    db-backup.yml       # Daily automated DB backup (GitHub Actions)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rows` | Paginated rows (query: page, limit, filters) |
| POST | `/api/rows` | Create a new row |
| GET | `/api/rows/stats` | All filtered rows for statistics |
| PUT | `/api/rows/[id]` | Update a single field |
| DELETE | `/api/rows/[id]` | Delete a row |

## Security

- Rate limiting: 60 reads/min, 10 writes/min per IP
- Delete protection: 2 deletes in 5min → warning, 1 more → permanent IP restriction (stored in DB)
- Data preservation: resolved rows (with decision email/SMS) older than 60 days are undeletable
- Input validation: length limits, date format checks, whitelist validation
- Parameterized SQL queries (no SQL injection)
- Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- Cryptographic UUIDs for row IDs
- Automatic daily database backups (7-day retention via GitHub Actions)

## Backups

The database is automatically backed up daily via GitHub Actions. Each backup is a full SQL dump stored as a GitHub Artifact with 7-day retention. To restore from a backup, download the artifact from the Actions tab, drop the existing table, and execute the SQL dump against your Turso database.

Turso's free plan also includes automatic backups at every write transaction with 24-hour point-in-time recovery (PITR).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
