# Pattasu Vedikkum · DigiDiwali 2026
Concept and direction: **Kevin Lazarus** · Tech Enthusiast | Creative Thinker | Stranger Things Fan

An interactive Tamil village Diwali story with an original Upside Down-inspired gate. Static site, no build step.

## Run locally
Open `index.html` in a browser, or serve the folder:
`python3 -m http.server 8080` then visit http://localhost:8080

Three.js (r128) loads from cdnjs. For offline use, put `three.min.js` in `vendor/` (see `vendor/README.txt`); the page falls back to it.

## Deploy
- **Netlify:** drag the folder onto app.netlify.com/drop.
- **GitHub Pages:** push the folder to a repo, then Settings > Pages > deploy from branch (root).

## Structure
`index.html` · `css/style.css` · `js/` (core: audio + particles, env/env2: village + gate, people: villagers, world + world-story: scene and story, lab: 7-cracker lab, story + sections: navigation and interactions) · `assets/favicon.svg`

## Your photo
Save your photo as `assets/kevin.jpg` (square, about 600x600, lowercase name). The Creator card shows it directly.

## Notes
- All sound is synthesized live (Web Audio). Sound starts only after the first click.
- No WebGL: the page falls back to simple actions and a gradient sky. `prefers-reduced-motion` skips the opening film.
- Crackers are not banned here. The message is to use legal products, keep distance and protect people, animals and air.
- Original story inspired by the mood of Stranger Things. Not affiliated with its creators.
