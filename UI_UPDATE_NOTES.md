# GSC and AI Traffic UI update

This version extends the existing single-page dashboard with two new left-navigation views:

- Google Search Console
- AI Traffic

## New files

- `js/gsc.js`
- `js/ai-traffic.js`

## Updated files

- `index.html`
- `css/layout.css`
- `css/print.css`
- `js/data.js`
- `js/ui.js`
- `js/ga4.js`
- `js/charts.js`
- `js/export.js`
- `js/main.js`

## GSC view

- Eight KPI cards
- Clicks, impressions, CTR, and position trend selector
- Keyword position distribution
- Search opportunity table
- Query dataset tabs with search and pagination
- Landing-page dataset tabs with search and pagination
- Device, country, and search-appearance summaries
- Page-query relationship table
- Compact-cache and data-quality notices

## AI Traffic view

- Eight AI referral KPI cards
- Daily trend normalized to include zero-traffic dates
- AI source performance table
- Landing-page table with lost/new states, search, and pagination
- Device split
- Country table
- Small-sample notice
- AI referral classification note
- Supporting-data quality notice

## Deployment

Replace the GitHub repository files with this version and push to `main`. Netlify should deploy automatically.

No new Netlify environment variables are required for these UI views.
