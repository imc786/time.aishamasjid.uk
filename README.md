# Aisha Masjid Prayer Timer

Prayer timer is a one-page web interface, intended to be shown on a FHD (1920x1080) resolution TV/projector screen. It shows the Athan and Jama'at times of all 5 prayers for the day, and counts down to the next prayer & Iqamah time.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5.9
- Tailwind CSS 4
- Zod 4 (data validation)
- Vitest (testing)

## Development

```bash
pnpm install
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm type-check` | TypeScript type checking |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage |

## Prayer Time Data

1. Prayer start (athan) times are retrieved from [moonsighting.com](https://www.moonsighting.com/time_json.php?year=2023&tz=Europe/London&lat=51.4548878&lon=-0.9365519&method=0&both=false&time=0) and stored locally under `data/athan/{year}.json`

2. Iqamah/Jama'at times are provided by Aisha Masjid & Islamic Centre, converted to JSON and stored locally under `data/iqamah/{year}.json`

Data currently covers 2023-2026. The application will show empty times for unsupported years.

## Testing (Dev Only)

In non-production environments, a DevTools panel is available for simulating different times and speeds to test prayer state transitions.

## Licence

Private. Copyright [Hibah](https://hibah.app).
