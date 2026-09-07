# Stage Espresso & Brewbar

The Astro website for [Stage Espresso & Brewbar](https://stagecoffee.com) in
Leeds. Published content is generated from Contentful and deployed to GitHub
Pages. Staff can review saved drafts through the frontend-gated `/preview`
routes. password: soupswimsale

## Links

- Website: [stagecoffee.com](https://stagecoffee.com)
- GitHub: [stage-coffee/website](https://github.com/stage-coffee/website)
- Contentful: [Stage space](https://app.contentful.com/spaces/cccc6mdhxqr5/environments/master/home)
- Instagram: [@stagecoffeeleeds](https://www.instagram.com/stagecoffeeleeds/)

## Requirements

- Node.js 22.12 or newer (`.nvmrc` is included)
- Access to the Stage Contentful space for real content

## Local development

```bash
nvm use
npm install
npx playwright install chromium
cp .env.example .env
npm run dev
```

Production content uses `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`, and
`CONTENTFUL_ENVIRONMENT`. Preview routes reuse `CONTENTFUL_SPACE_ID` when
`PUBLIC_CONTENTFUL_SPACE_ID` is omitted, but require a separate
`PUBLIC_CONTENTFUL_PREVIEW_TOKEN` because draft requests run in the browser.
After changing these values, restart the development server so Astro can embed
the updated preview configuration.

Create the preview password hash without storing the password in the repository:

```bash
printf '%s' 'your shared password' | shasum -a 256
```

Put only the resulting hash in `PUBLIC_PREVIEW_PASSWORD_HASH`.

> [!CAUTION]
> The preview gate is a convenience deterrent, not access control. Its password
> hash and Contentful Preview API token are shipped to the browser and can be
> extracted. Draft website content is intentionally treated as low sensitivity.

## Commands

```bash
npm run dev          # local Astro server
npm run build        # static production build in dist/
npm run check        # Astro and TypeScript diagnostics
npm test             # unit tests
npm run test:e2e     # desktop and mobile browser tests
npm run format:check # formatting check
npm run contentful:setup-menu # create the Food Menu model and draft
npm run contentful:setup-coffee # create the Coffee model and placeholder draft
npm run contentful:publish-coffees # update and publish the current coffee list
```

## Routes

| Published  | Draft preview      |
| ---------- | ------------------ |
| `/`        | `/preview`         |
| `/events/` | `/preview/events/` |
| `/jobs/`   | `/preview/jobs/`   |
| `/menu`    | `/preview/menu`    |
| `/coffee`  | `/preview/coffee`  |

Production routes contain published Contentful content in their generated HTML.
Preview routes fetch saved drafts from `preview.contentful.com` after the shared
password is entered and refresh their content on every page load.

## GitHub Pages configuration

Set GitHub Pages to use **GitHub Actions**, then configure these repository
variables:

- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_ENVIRONMENT` (normally `master`)

Configure these repository secrets:

- `CONTENTFUL_DELIVERY_TOKEN`
- `CONTENTFUL_PREVIEW_TOKEN`
- `PREVIEW_PASSWORD_HASH`

The workflow in `.github/workflows/pages.yml` validates pull requests and deploys
`main`, manual runs, and `contentful-publish` repository dispatches. Deployment
concurrency prevents an older build from replacing a newer content update.

## Contentful publishing webhook

Create a fine-grained GitHub token scoped only to `stage-coffee/website` with the
minimum permission required to create a repository dispatch. In Contentful,
create a webhook for entry and asset publish, unpublish, and deletion events:

- Method: `POST`
- URL: `https://api.github.com/repos/stage-coffee/website/dispatches`
- Header: `Accept: application/vnd.github+json`
- Header: `Authorization: Bearer YOUR_FINE_GRAINED_TOKEN`
- Header: `X-GitHub-Api-Version: 2022-11-28`
- Body: `{ "event_type": "contentful-publish" }`

Store the token only in Contentful's webhook configuration. Do not add it to
this repository.

Configure Contentful preview URLs to point homepage/banner entries to
`https://stagecoffee.com/preview`, events to `/preview/events/`, jobs to
`/preview/jobs/`, the Food Menu entry to `/preview/menu`, and coffee entries to
`/preview/coffee`.

## Content model

The site preserves the existing Contentful types:

- `websiteOrder`: ordered homepage content and contact-form introduction
- `banner`: hero images
- `events`: event name, description, image, start time, and end time
- `job`: position, description, and application link
- `foodMenu`: an internal name and the staff-editable rich-text menu
- `coffee`: coffee name, roaster, tasting notes, origin, region,
  altitude, producer, farm, varietal, optional process, caffeine status, and
  repeatable price options, plus independent House Espresso, House Batch,
  Filter, and Retail section flags

To create the Food Menu model and initial unpublished menu, put a valid
`CONTENTFUL_MANAGEMENT_TOKEN` in `.env` and run
`npm run contentful:setup-menu`. The command discovers the default locale,
publishes the content model and leaves the entry as a draft for review. It does
not overwrite an existing menu entry.

`npm run contentful:setup-coffee` creates or updates and publishes the Coffee
content model, then creates the seed coffees as unpublished entries. The
command is idempotent and does not overwrite existing entries.

Content mapping is defensive: missing entries render useful empty states rather
than breaking the entire build. Events remain listed until their end time.
