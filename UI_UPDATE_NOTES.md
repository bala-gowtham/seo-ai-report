# Premium dashboard and GA4 workspace update

This release refreshes the existing single-page dashboard without changing the Netlify, n8n, cache, report-generation, or API contracts.

## Premium visual system

- Apple-style system font stack with SF Pro, Inter, Geist, and Segoe UI fallbacks
- Four interface accents only: blue, green, orange, and soft red
- Soft-gray application canvas with refined white cards
- Compact sidebar and sticky report toolbar
- Subtle borders, restrained shadows, and consistent card radii
- Improved KPI hierarchy, tables, filters, empty states, focus states, and responsive behavior
- Updated Overview, GA4, Search Console, AI Traffic, AI Assistant, and export surfaces

## GA4 workspace

The long GA4 page is now a focused workspace with these tabs:

- Overview
- Acquisition
- Landing pages
- Audience & devices

GA4 improvements include:

- Up to eight KPI cards when the payload provides the metrics
- Current-versus-previous sessions chart
- Dynamic, clickable medium selector
- Clickable medium values inside the Source / Medium table
- Medium-aware acquisition filtering
- Selected-medium summary and clear-filter action
- Searchable and sortable channel, source / medium, landing-page, and country tables
- Previous and Next pagination
- Rows-per-page selectors on the large acquisition and landing-page tables
- Long-value truncation with full-value tooltips
- Compact expandable GA4 data notes
- An explicit note when the compact payload does not contain a landing-page-by-medium dimension

The medium selector only filters datasets that contain a compatible medium or channel dimension. It does not fabricate medium-specific daily trends or landing-page attribution when those dimensions are absent from the compact payload.

## Search Console

- Existing GSC data, charts, tabs, search, and pagination are preserved
- Coverage and row-limit messages are grouped into one compact expandable data-notes card
- Property-level KPI messaging remains separate from dimension-level coverage limitations

## AI Traffic

- Existing AI referral KPIs, trends, source details, landing pages, devices, and countries are preserved
- Small-sample, classification, and supporting-data notes are consolidated into one expandable information card
- The note badge is generated from the actual AI session count

## Responsive behavior

- Desktop: compact fixed sidebar, multi-column KPI grids, and full tables
- Tablet: reduced grids and collapsible navigation
- Mobile: drawer navigation, stacked filters, two-column KPI cards where space permits, scrollable tables, and no page-level horizontal overflow

## Deployment

Push the repository contents to the GitHub `main` branch. Netlify should deploy automatically.

No new environment variables or backend workflow changes are required.


## Classic theme usability update
- Restored the original SEO Intel visual design and colour palette.
- Preserved GA4 tabs, medium filtering, search, sorting, and pagination.
- Replaced the Overview landing-page card with an embedded AI Assistant launcher.
- Removed GSC Search Appearance from the interface.
- Added GSC opportunity search/status filtering and pagination.
- Limited GSC country results to five rows per page with search and Previous/Next navigation.
