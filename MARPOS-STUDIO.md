# Margin in Marpos Studio

This English-language demo adapts [Margin by LiteInk](https://github.com/Liteink/margin). The original visual design and sample publication remain, with local media and two additional workflow examples.

## Open the demo

In Marpos Studio, choose **Add project** and select `marcelposdijk/marpos-studio-margin`. Studio installs the dependencies and discovers the Posts, Pages and Photos collections.

For an existing checkout, use Node.js 24.x and run `npm ci`, then choose **Open local repository** and select the project directory.

No CMS account, API token or database is required. Keep `contentMode` set to `local` in `src/config.json`.

## A short demonstration

1. Open **Posts → welcome-to-margin**. Change the title or description and edit a sentence in the visual story editor.
2. Open **Photos** to browse the six images, edit their details or upload a new image. Use the cover image field to select another local photo. Images use `{ src, alt }`, so Studio provides a media picker. Add descriptive alternative text.
3. Choose **Preview this page**. Check both the changed cover and story, then save or discard the temporary edits.
4. Open **a-story-in-progress**. Its `draft: true` article is visible in the local Astro development preview but excluded from the production build.
5. Add a Markdown article with title, description, publication date, author and category. Optional fields include image, tags, featured status and series order. New posts preview at `/posts/<identifier>`; pages preview at `/<identifier>`.
6. Review the changes, try undo/restore, and save an online draft or publish when ready. Studio publishing updates GitHub; a connected hosting service handles deployment.

Studio's online drafts and the article's `draft` field have different roles. Online drafts save work separately from the live branch. The article field decides whether an article is included in a production build.

## Content and media

- Posts: `src/content/posts/*.md`.
- Pages: `src/content/pages/*.md`.
- Schemas: `src/content.config.ts`, using Astro's native local `glob()` loaders.
- Library records: `content/photos/*.json`, with titles, alternative text, categories, credit, visibility and order.
- Library configuration: the project-root `.navigation.yml` sets `studio.mediaRoot` to `src/assets/images`. The `content/.navigation.yml` selects Photos for image choosers, and `content/photos/.navigation.yml` enables the media view and sets the upload directory to `library`.
- Media: `src/assets/images/library/`. Studio and content use source paths such as `/src/assets/images/library/photo-1476514525535-07fb3b4ae5f1.jpg`. Astro resolves them to public asset URLs.
- Categories, tags, author archives and series are derived from post fields. Authors are text fields, not a separate reference collection.
- Site identity and navigation are developer settings in `src/config.json`, outside Studio's content publishing scope.

Page routes query their native collections directly so Studio can infer preview prefixes, including for newly created documents. Bodies use plain Markdown and support Studio's visual editor. The original template's `image.url` frontmatter has been changed to `image.src` for Studio's image controls; the display adapter preserves the theme's existing card format.

Photo records are reusable assets, not public pages. Their preview opens the homepage; a photo does not appear there automatically when added to the library. Select it in a post cover or insert it in a story to use it. Visibility is library metadata; existing article image paths continue to render when a library record is hidden.

## GitHub Pages demo

The demo is deployed at https://marcelposdijk.github.io/marpos-studio-margin/ by the Deploy demo to GitHub Pages workflow on each push to `main`. A manual run is also available in GitHub Actions. The build includes the Pagefind search index. The workflow publishes only the generated static site, not unpublished content drafts.

To reproduce the GitHub Pages build locally:

```sh
SITE_URL=https://marcelposdijk.github.io BASE_PATH=/marpos-studio-margin npm run build
```

## Verify and deploy

```sh
npm ci
npm run dev
npm run build
npm run preview
```

The build generates the static site, optimizes local article images and then creates its Pagefind search index.

### Image optimization

Astro bundles library images from `src/assets/images/library/` into `dist/_astro/`. After Astro builds, `scripts/optimize-images.mjs` finds the local images in rendered covers, cards and Markdown stories. It writes content-hashed AVIF and WebP variants into `dist/_images/` at widths up to 320, 640, 960, 1280 and 1600 pixels, without enlarging smaller originals. Responsive `<picture>` sources let the browser choose a format and width. Dimensions reserve layout space. Cards and story images load lazily, while covers retain eager loading. GIFs and animated uploads keep their original behavior.

The next deployment build optimizes new uploads. Studio's development preview shows the originals, and the bundled original serves as the browser fallback and story lightbox image. `npm run test:images` checks preservation, responsive output, orientation, animation and repeated use across pages.

 Search requires a completed production build; it is not indexed by the development server.

Set `SITE_URL` in the hosting environment to the actual public origin before deployment, for example `https://magazine.your-domain.com`. The default `https://margin.example.org` is deliberately a placeholder. Deploy the generated `dist/` folder to a static host. Set `BASE_PATH` for subpath hosting. GitHub Pages configures both values automatically through `.github/workflows/deploy.yml` on each push to `main`. Local Studio previews use `/` by default and keep image paths in content independent of the hosting path.

Newsletter and contact forms are inherited presentation examples and are not connected to a service. The inherited third-party visitor counter is disabled in the footer. Google Fonts still loads fonts externally.

## Attribution

The upstream MIT license is retained in `LICENSE`; retain its copyright and license notice when redistributing this fork. `media-sources.json` records the upstream Unsplash source for each downloaded photo. These photographs remain third-party assets under their applicable terms.

The original template is preserved in the upstream Git history and README. This fork's setup is described here and in its README introduction.
