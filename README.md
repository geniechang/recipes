# 食譜 (Recipes)

A small read-and-cook web app for my own recipes, served by GitHub Pages at
https://geniechang.github.io/recipes/.

- **Data** lives in the private repo `geniechang/recipes-data` (`recipes.json`, spec v4.1).
  The app reads it through the GitHub contents API with a fine-grained access key stored on the device.
  The only thing the app writes back is bookmarks.
- **Covers** are AI-generated illustrations in `covers/<recipe id>.jpg` (4:3, 1000 px wide).
- **Source** is in `app/` (Vite + Svelte 5). The build writes the site to the repo root.

## Build

```sh
cd app
npm install
npm run build   # writes ../index.html, ../assets/, ../sw.js, icons and manifest
```

Commit the built files together with the source. GitHub Pages serves the root of `main`.

## Access key

Create a fine-grained personal access token with access to `recipes-data` only and
**Contents: Read and write**, then paste it on the app's Connect screen.
