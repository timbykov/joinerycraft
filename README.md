# Joinerycraft website

Static site for Joinerycraft (custom kitchens, wardrobes and joinery, Chipping Norton, Sydney). No build step: `index.html`, `css/styles.css`, `js/main.js` and `images/`.

## Hosting

Hosted on Netlify (preview: https://frolicking-blancmange-71623f.netlify.app/). The repo is linked to that Netlify site, so every push to `main` deploys automatically. `netlify.toml` publishes the repo root.

## Quote form

The quote form uses Netlify Forms (`data-netlify="true"`, form name `quote`). Submissions appear in Netlify under **Forms**; turn on email notifications there (Forms > Form notifications) so new leads reach your inbox. Successful submissions land on `thank-you.html`.

## Photos

Project photos live in `images/projects/` (full size, max 1400px) with smaller grid versions in `images/projects/thumbs/`. To add a project, add both files and copy one of the `<figure class="tile">` blocks in the Projects section, setting `data-cat` to `kitchens`, `wardrobes`, `bathrooms`, `living` or `commercial`.
