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
npm run contentful:setup-admin # create and install the private Website Admin app
npm run contentful:setup-home-menu # add the Menu section to the homepage order
npm run contentful:setup-menu # create the Food Menu model and draft
npm run contentful:setup-coffee # create the Coffee model and placeholder draft
npm run contentful:publish-coffees # update and publish the current coffee list
```

## Routes

| Published      | Draft preview               |
| -------------- | --------------------------- |
| `/`            | `/preview`                  |
| `/events/`     | `/preview/events/`          |
| `/jobs/`       | `/preview/jobs/`            |
| `/menu`        | `/preview/menu`             |
| `/blog`        | `/preview/blog`             |
| `/blog/{slug}` | `/preview/blog?slug={slug}` |

Production routes contain published Contentful content in their generated HTML.
Preview routes fetch saved drafts from `preview.contentful.com` after the shared
password is entered and refresh their content on every page load.

The combined menu defaults to Food. Link directly to its Coffee tab with
`/menu?tab=coffee`, or `/preview/menu?tab=coffee` when reviewing drafts. The
former `/coffee` routes redirect to these corresponding menu views.

The blog index and homepage feature are ordered newest first using the Blog
entry's published date, with Contentful publication and creation dates as safe
fallbacks. Public article share buttons use the device share sheet where
available and otherwise copy the canonical URL. WhatsApp and other messaging
services generate their rich previews from the article's Open Graph metadata;
those services may temporarily cache an older title, description, or image.

## Website admin

`/admin` opens a mobile-friendly coffee and food menu editor inside Contentful.
Contentful handles authentication, so every staff member must have their own
account and membership of the Stage space. Updates are made with the signed-in
user's permissions and remain attributed to that user in Contentful.

The editor can create, edit and immediately publish coffees. Removing a coffee
unpublishes and archives it; archived entries remain available for restoration.
The Food menu tab edits the introduction and the menu itself on the existing
`foodMenu` entry. The menu uses Markdown: `##` creates section headings, `###`
creates dish headings, `*text*` creates italic allergen information, and
`**text**` creates highlighted notes. The existing Contentful webhook rebuilds
the public site after publishing.

The authenticated Page app URL uses Contentful's current `/apps/app_installations/`
route:

```text
https://app.contentful.com/spaces/{space}/environments/{environment}/apps/app_installations/{app-id}/
```

To create or update the private Page app, set a valid
`CONTENTFUL_MANAGEMENT_TOKEN` in `.env`, then run:

```bash
npm run contentful:setup-admin
```

The command discovers the organization from the configured space, creates the
`Stage Website Admin` app definition with `https://stagecoffee.com/admin` as its
source, and installs it in the configured environment. Copy the reported app ID
into `PUBLIC_CONTENTFUL_ADMIN_APP_ID` locally and into the GitHub repository
variable `CONTENTFUL_ADMIN_APP_ID`. The app ID is public; no management token is
included in the browser bundle.

For local iframe development, set `CONTENTFUL_ADMIN_APP_SRC` to the local HTTPS
URL exposed to Contentful and rerun the setup command. Direct visits to `/admin`
redirect to the authenticated Contentful Page app; the editor itself renders
only in Contentful's app frame.

## GitHub Pages configuration

Set GitHub Pages to use **GitHub Actions**, then configure these repository
variables:

- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_ENVIRONMENT` (normally `master`)
- `CONTENTFUL_ADMIN_APP_ID`

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
- Header: `User-Agent: StageCoffee-Contentful-Webhook`
- Header: `X-GitHub-Api-Version: 2022-11-28`
- Body: `{ "event_type": "contentful-publish" }`

Store the token only in Contentful's webhook configuration. Do not add it to
this repository.

Configure Contentful preview URLs to point homepage/banner entries to
`https://stagecoffee.com/preview`, events to `/preview/events/`, jobs to
`/preview/jobs/`, the Food Menu entry to `/preview/menu`, and coffee entries to
`/preview/menu?tab=coffee`. Configure Blog entries with
`https://stagecoffee.com/preview/blog?slug={entry.fields.slug}` so saved drafts
can be opened without rebuilding the site.

## Content model

The site preserves the existing Contentful types:

- `websiteOrder`: ordered homepage content and contact-form introduction
- `banner`: hero images
- `events`: event name, description, image, start time, and end time
- `job`: position, description, and application link
- `foodMenu`: an internal name, optional banner image, Long Text introduction,
  and staff-editable Markdown menu
- `coffee`: coffee name, roaster, tasting notes, origin, region,
  altitude, producer, farm, varietal, optional process, caffeine status, and
  repeatable price options, plus independent Espresso, Batch, Pour Over, and
  Retail section flags
- `blog`: title, unique slug, optional cover image and published date, short
  introduction, and Rich Text article content

To create the Food Menu model and initial unpublished menu, put a valid
`CONTENTFUL_MANAGEMENT_TOKEN` in `.env` and run
`npm run contentful:setup-menu`. The command discovers the default locale,
publishes the content model, configures Contentful's Markdown editor, and safely
migrates legacy Rich Text into the new Long Text field before removing the old
field. Existing published menus remain published.

`npm run contentful:setup-coffee` creates or updates and publishes the Coffee
content model, then creates the seed coffees as unpublished entries. The
command is idempotent and does not overwrite existing entries.

Content mapping is defensive: missing entries render useful empty states rather
than breaking the entire build. Events remain listed until their end time.
