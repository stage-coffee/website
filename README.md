# Stage Espresso website

The website for Stage Espresso & Brewbar in Leeds. It is a React application
powered by Contentful and hosted with GitHub Pages.

## Links

- Website: [stagecoffee.com](https://stagecoffee.com)
- GitHub: [stage-coffee/website](https://github.com/stage-coffee/website)
- Contentful: [Stage Contentful space](https://app.contentful.com/spaces/cccc6mdhxqr5/environments/master/home) (account access required)
- Instagram: [@stagecoffeeleeds](https://www.instagram.com/stagecoffeeleeds/)

## Site routes

- Home: [stagecoffee.com](https://stagecoffee.com)
- Events: [stagecoffee.com/#/events](https://stagecoffee.com/#/events)
- Jobs: [stagecoffee.com/#/jobs](https://stagecoffee.com/#/jobs)

The application uses hash-based routing so that its routes work when hosted on
GitHub Pages.

## Technology

- React 18
- Parcel 2
- Contentful
- React Router
- styled-components
- GitHub Pages

Contentful provides the homepage sections, banners, events, and job listings.
The application reads published content from the `master` environment in the
Stage Contentful space.

## Local development

Clone the repository and install its dependencies:

```bash
git clone git@github.com:stage-coffee/website.git
cd website
npm install
```

Copy the example environment file:

```bash
cp .env.example .env
```

Set these values in `.env`:

```dotenv
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_DELIVERY_TOKEN=your_delivery_access_token
CONTENTFUL_MANAGEMENT_TOKEN=your_management_access_token
```

The delivery token is used by the website to fetch published content. The
management token is only needed when importing the included Contentful setup.
Do not commit `.env` or any access tokens.

Start the development server:

```bash
npm run dev
```

## Build and deployment

Create a production build in `dist`:

```bash
npm run build
```

Deploy the build to the `gh-pages` branch and configure the custom domain as
`stagecoffee.com`:

```bash
npm run deploy
```

Deployment requires permission to push to the GitHub repository and should be
run with the production Contentful environment variables configured locally.

## Contentful setup

The `contentful/export.json` file contains an export of the expected Contentful
content model and initial content. To import it into the space configured in
`.env`, run:

```bash
npm run setup
```

This operation uses the Contentful Management API and can modify the configured
space, so confirm the target space before running it.
