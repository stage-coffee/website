# Stage Espresso & Brewbar website

This guide explains how Stage staff can update, preview and publish website
content. For development, deployment and configuration details, see the
[technical README](TECHNICAL_README.md).

## Quick links

- Live website: [stagecoffee.com](https://stagecoffee.com)
- Draft preview: [stagecoffee.com/preview](https://stagecoffee.com/preview)
- Website admin: [stagecoffee.com/admin](https://stagecoffee.com/admin)
- Contentful: [Stage Website](https://app.contentful.com/spaces/cccc6mdhxqr5/environments/master/home)
- Instagram: [@stagecoffeeleeds](https://www.instagram.com/stagecoffeeleeds/)

## Previewing draft content

Content saved in Contentful can be checked before it is published:

1. Save your changes in Contentful or the Stage website admin.
2. Open [stagecoffee.com/preview](https://stagecoffee.com/preview).
3. Enter the shared password: `soupswimsale`.
4. Use the preview navigation to check the relevant page.
5. Refresh the page after making further changes in Contentful.

The preview shows saved drafts as well as published content. It is designed for
checking wording, images and content before publishing. The password is only a
simple deterrent, so do not put confidential or sensitive information in draft
website content.

The main preview pages are:

| Content     | Preview page                                                                               |
| ----------- | ------------------------------------------------------------------------------------------ |
| Homepage    | [stagecoffee.com/preview](https://stagecoffee.com/preview)                                 |
| Food menu   | [stagecoffee.com/preview/menu](https://stagecoffee.com/preview/menu)                       |
| Coffee menu | [stagecoffee.com/preview/menu?tab=coffee](https://stagecoffee.com/preview/menu?tab=coffee) |
| Events      | [stagecoffee.com/preview/events](https://stagecoffee.com/preview/events)                   |
| Jobs        | [stagecoffee.com/preview/jobs](https://stagecoffee.com/preview/jobs)                       |
| Blog index  | [stagecoffee.com/preview/blog](https://stagecoffee.com/preview/blog)                       |

Individual blog drafts use their slug, for example:
`https://stagecoffee.com/preview/blog?slug=my-blog-post`.

## Updating coffee and food menus

Open [stagecoffee.com/admin](https://stagecoffee.com/admin). You will be taken
to the Stage Website Admin app inside Contentful. Sign in with your own
Contentful account so changes are attributed to the correct person.

The admin has two areas:

- **Coffees:** create, edit, publish, remove and restore coffees. Choose every
  section where a coffee should appear: Espresso, Batch, Pour-over or Retail. A
  coffee can appear in more than one section.
- **Food menu:** edit the menu introduction and the complete food menu. Change
  its banner image from the Food Menu entry in Contentful when needed.

Coffee changes made through the admin are published immediately. Removing a
coffee safely unpublishes and archives it rather than deleting it permanently.
The public website may take several minutes to rebuild after publishing.

The food menu is written using simple Markdown:

```text
## Breakfast

### Homemade Granola Bowl (V/VGN) — £5.95

*Allergens: Gluten, milk.*

Greek yoghurt, berry compote, homemade granola and fruit.

**Available until 14:00.**
```

- `##` creates a menu section heading.
- `###` creates a dish heading.
- `*text*` makes allergen information italic.
- `**text**` highlights important information.
- Leave a blank line between separate pieces of content.

Preview menu changes before publishing at
[stagecoffee.com/preview/menu](https://stagecoffee.com/preview/menu).

## Updating other content in Contentful

Use the main [Contentful space](https://app.contentful.com/spaces/cccc6mdhxqr5/environments/master/home)
for homepage content, events, jobs, blogs and banner images.

The usual workflow is:

1. Open or create the entry.
2. Make the changes and press **Save**.
3. Review the saved draft on the appropriate preview page.
4. Make any corrections and refresh the preview.
5. Press **Publish** when the content is ready for customers.
6. Allow a few minutes for GitHub to rebuild the live website.
7. Check the published page on [stagecoffee.com](https://stagecoffee.com).

Publish newly uploaded images before publishing the entry that uses them. A
saved change to an already-published entry remains a draft until it is published
again.

## Website overview

### Homepage

The homepage contains:

- The main hero image and introductory message.
- A yellow **Join our team!** banner when a published job exists.
- An introduction to Stage.
- Food and Coffee image links leading to the appropriate Menu tab.
- The newest published blog post, when any blog posts exist.
- Opening Hours.
- Coffee at Home and retail information.
- Location and travel information.
- Feature cards such as Our Corner, Board Games and Dog Friendly.
- Additional ordered Contentful website sections.
- The contact form and Find us information.

The homepage Blog navigation link and latest-post feature are hidden when there
are no published blog posts. The jobs banner is hidden when there are no
published jobs.

### Food and coffee menus

[stagecoffee.com/menu](https://stagecoffee.com/menu) combines both menus in one
place. Food is the default tab. Coffee opens directly at
[stagecoffee.com/menu?tab=coffee](https://stagecoffee.com/menu?tab=coffee).

Coffee entries are grouped into Espresso, Batch, Pour-over and Retail. Customers
can expand a coffee to see its origin, process, other facts and prices.

### Events

[stagecoffee.com/events](https://stagecoffee.com/events) shows upcoming and past
events. Upcoming events are ordered chronologically. Past events are shown with
the most recent first.

An Event entry can include:

- Name, description and image.
- Start and end date/time.
- An optional Read more link.

The website automatically provides an Add to Calendar option for upcoming
events, supporting Google Calendar, Apple Calendar, Outlook and other calendar
apps.

Events remain upcoming until their end time has passed. Use accurate start and
end times so they move into Past Events at the right time.

### Blog

[stagecoffee.com/blog](https://stagecoffee.com/blog) lists published posts with
their cover image, title, introduction and date. Each post has its own URL based
on its slug, such as `/blog/my-blog-post`.

A Blog entry can include:

- Title and unique slug.
- Cover image.
- Published date and short introduction.
- Rich Text article content.
- An optional associated Event.

When the associated event has not ended, the blog card and article display an
Add to Calendar option. Blog pages also include sharing metadata, a Share button
and links to other posts. Changes to a slug also change the post URL, so avoid
changing a slug after sharing the original link.

### Jobs

Published Job entries appear on the Jobs page and activate the **Join our
team!** banner directly below the homepage hero. Unpublish the job when it is no
longer available.

### Website sections and homepage order

Website Section entries hold reusable homepage content and images. The Website
Order entry controls which Contentful sections appear and their order, as well
as the contact-form introduction. Some newer homepage cards are built into the
website and are not rearranged through Website Order.

### Images and accessibility

When uploading an image:

- Use a clear, good-quality original rather than a screenshot where possible.
- Give it a useful title.
- Add a description that explains what is visible; the website can use this as
  alternative text for customers using screen readers.
- Publish the image asset as well as the entry that refers to it.
- Check desktop and mobile preview pages to make sure the crop works well.

## When the live website does not update

Try these checks:

1. Confirm the entry and any new image assets say **Published**, not Draft or
   Changed.
2. Check that the saved draft looks correct on the preview website.
3. Wait several minutes for the website rebuild to finish.
4. Refresh the public page, or try a private/incognito browser window.
5. If the preview cannot find a draft, check its slug and that the Contentful
   entry was saved.

If publishing still does not update the website, tell Tom which entry was
changed, when it was published and which page should have changed.

## When to contact Tom

Contact Tom if you need:

- Changes to page layout, colours, spacing, fonts or responsive behaviour.
- New page types, content fields, menu sections or website features.
- Changes to how Contentful content is formatted or ordered.
- Help with a failed website rebuild, broken preview, admin access or an error.
- Advice before making a structural change to a Contentful content model.

For routine text, image, event, blog, job, food-menu and coffee updates, staff
can use Contentful, the preview website and the Stage Website Admin following
the instructions above.
