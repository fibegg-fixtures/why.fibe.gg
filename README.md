# why.fibe.gg

The single-page marketing site at **[why.fibe.gg](https://why.fibe.gg)** — six paths
into the same workshop, one for each kind of builder Fibe was made for.

## Structure

| Path                            | What it is                                                  |
| ------------------------------- | ----------------------------------------------------------- |
| `index.html`                    | The page. Hero, 2×2 matrix, six persona blocks, closing CTA. |
| `assets/style.css`              | All styles. "Phoenix Terminal": olive-graphite field, phosphor green × signal gold. |
| `assets/script.js`              | Scroll reveals, footer year, pointer tilt.                   |
| `img/`                          | Favicons, OG card. Mirrored from `whats.fibe.gg`.            |
| `CNAME`                         | Maps GitHub Pages to `why.fibe.gg`.                          |
| `site.webmanifest`              | PWA manifest.                                                |
| `robots.txt`, `sitemap.xml`     | Crawler & indexing hints.                                    |
| `.nojekyll`                     | Tells GitHub Pages not to run Jekyll.                        |
| `.github/workflows/deploy.yml`  | Publishes the repo root to GitHub Pages on every push to `main`. |

## Local preview

There is no build step. Serve the directory with any static server:

```sh
python3 -m http.server 5173
# or
npx --yes serve -p 5173 .
```

Then open <http://localhost:5173/>.

## The six personas

The page is organized around two axes — **development experience** × **domain expertise** —
plus two roles that don't fit a grid:

```
                    Development experience
                   No                Yes
              ┌────────────────┬──────────────────┐
              │ 01 Solve a     │ 03 Sharpen       │
       No     │    problem.    │    your tools.   │
Domain        ├────────────────┼──────────────────┤
expertise     │ 02 Build your  │ 04 Compete with  │
       Yes    │    craft.      │    the biggest.  │
              └────────────────┴──────────────────┘

       05 Researcher — sandbox, isolation, agent testing
       06 CTO / Head of Eng. — unblock the org & own the stack
```

**Creators** (game designers, animators, audio producers, video makers) are folded
into Persona 02 — they have deep domain expertise but typically not engineering chops.
The persona body explicitly addresses them, and two of the six slider cards
(`product/creator-pipeline`, `product/playable-link`) speak directly to creator
workflows.

**Self-hosters** (teams replacing per-seat SaaS with their own stack) are folded
into Persona 06 — they're a CTO/head-of-eng concern about cost and control.
Three slider cards (`cto/selfhost-chat`, `cto/selfhost-sso`, `cto/selfhost-docs`)
cover the self-host workflow.

## The sticky nav

A single-row sticky header: **brand · horizontal table-of-contents (Matrix + 6 path chips + Solutions) · Try Fibe button**. The chip strip auto-scrolls horizontally if the viewport is narrow, and the currently-in-view section's chip lights up with that persona's accent (rAF-throttled scroll listener in `assets/script.js`).

## "See it in action" gallery

Each persona block exposes a single dominant CTA — `▶ See it in action`. Clicking it swaps the persona's illustration for an inline gallery in the same spot. Inside the gallery:

- A header showing the gallery title (`Closer to your problem`, etc.).
- A single-card-at-a-time slider — prev/next chips overlay the bottom corners.
- A `×` close button (top right) restores the illustration.
- Each card is a `<button>` with `data-embed-src`. Clicking the card body still works as before — it swaps the poster for a Rumble `<iframe>` (or flashes "Preview coming soon" if the URL hasn't been filled in yet).

The persona block now has **only** the `See it in action` CTA — the
former primary/ghost buttons (Try Fibe, SDK & CLI, etc.) were removed
per design direction.

The gallery DOM is built on page load by `assets/script.js`: it moves each persona's `.persona__action` block into the visual aside and renames it to `.persona__gallery`, hidden until toggled. This keeps the source HTML easy to maintain (each persona's body and slider stay co-located) while the rendered layout overlays the gallery on the illustration.

## The Solutions section

Below the six personas, the page lists **10 abstract solution shapes** — the same
taxonomy used on `fibe.gg`'s Solutions menu. Each card has an icon, a title, a
one-liner, and a `boring → innovative` scale bar with a marker positioned by
the `data-novelty` attribute (and an inline `left: NN%` on `.solution__scale-mark`).

The 10 solutions, ordered by novelty:

1. Production deployment (15)
2. Staging & UAT (20)
3. Build & test in CI (30)
4. Internal tools (35)
5. Software distribution (45)
6. Self-hosted stacks (55)
7. Build in public (65)
8. Ephemeral environments (75)
9. Agent environments (90)
10. Vibe coding on steroids (95) — featured tile

## Editing copy

All persona copy lives inline in `index.html` under
`section.persona[id^="p-"]`. Each block has:

- an eyebrow (audience tag),
- a two-line headline,
- two paragraphs of body copy,
- three bullets of capability,
- three CTAs (primary + ghost + **"See it in action"**),
- a **slider** of four granular sub-paths, each linking to a Rumble video.

Keep the rhythm consistent across the six blocks — it's what gives the page
its cadence.

### Slider sub-paths

Each persona's slider lives in a `div.persona__action` immediately after
the `div.persona__inner` and gets multiple `article.slide` cards. Each card is:

```html
<article class="slide">
  <button class="slide__action" type="button"
          data-rumble-slug="problem/landing"
          data-embed-src="">
    <span class="slide__poster" aria-hidden="true">
      <span class="slide__play">▶</span>
      <span class="slide__duration">4:12</span>
    </span>
    <span class="slide__body">
      <h4 class="slide__title">Landing page in an afternoon</h4>
      <p class="slide__sub">Anya rebuilds her bakery's site on a Saturday.</p>
      <span class="slide__cta">▶ Play preview</span>
    </span>
  </button>
</article>
```

**Embedded video preview** — when the user clicks a slide:

- If `data-embed-src` is non-empty, the script swaps the poster with a
  16:9 `<iframe>` whose `src` is `data-embed-src`. A round close button (`×`)
  appears in the corner; clicking it puts the poster back. The iframe is
  set up with `allow="autoplay; encrypted-media; fullscreen; picture-in-picture"`
  and `allowfullscreen`, so Rumble's autoplay-on-click and fullscreen flows
  work without extra wiring.
- If `data-embed-src` is empty (the current placeholder state for every
  slide), the click flashes a brief "Preview coming soon" hint and does
  nothing else.

**To wire up the real videos:** set `data-embed-src` on each `<button>` to
the Rumble embed URL — that's the `https://rumble.com/embed/<id>/?pub=…`
variant, not the page URL. Keep `data-rumble-slug` intact — it's the stable
analytics handle. Slugs in use:

| Persona | Slugs |
| ------- | ----- |
| 01 Problem      | `problem/landing`, `problem/crm`, `problem/internal-tool`, `problem/portfolio` |
| 02 Product + Creators | `product/dental-schedule`, `product/trucker-dispatch`, `product/architect-portal`, `product/farm-log`, `product/creator-pipeline`, `product/playable-link` |
| 03 Sharpen      | `sharpen/clone-and-run`, `sharpen/clean-tests`, `sharpen/parallel`, `sharpen/mcp` |
| 04 Compete      | `compete/parallel-bets`, `compete/genie-swarm`, `compete/cd-tricks`, `compete/bazaar-fork` |
| 05 Researchers  | `research/agent-eval`, `research/benchmarks`, `research/agent-compare`, `research/artifacts` |
| 06 CTO + Self-host | `cto/qa-staging`, `cto/pm-preview`, `cto/audit`, `cto/byo-marquees`, `cto/selfhost-chat`, `cto/selfhost-sso`, `cto/selfhost-docs` |

Add more cards by appending more `<article class="slide">` blocks; the prev/next
buttons appear automatically when the row overflows, and hide when it doesn't.

## Design tokens — "Phoenix Terminal"

The palette lives in `:root` at the top of `assets/style.css`. The page base
(`--ink-1`) is a warm olive-graphite — deliberately neither black nor white —
and the cards (`--ink-2/3`) sit *darker* than the base, reading as recessed
instrument wells. Two strands dominate: phosphor green (`--brand-*`) and
signal gold (`--gold-*`) — the same pair as the hero's DNA helix, the matrix
axes (domain = green, development = gold), and the marquee ticker.

Purple is allowed in exactly one place: the `boring → innovative` scale bar
on the Solutions cards, where innovation deliberately sits off-palette.

Type: Chakra Petch (display; "Play" carries Cyrillic for `/uk/`),
IBM Plex Sans (body), JetBrains Mono (labels). The closing CTA carries a
pre-tinted phoenix ghost (`img/fibe-phoenix-ghost.png`, baked from
`/fibe.svg` — a live CSS filter on the full vector was too expensive to
composite).

Each persona gets a distinct accent used for its chip, list bullets, switch
tracks, and CTA:

| Persona | Accent                            |
| ------- | --------------------------------- |
| 01      | sprout green (`--accent-problem`) |
| 02      | honey gold (`--accent-product`)   |
| 03      | mint-teal (`--accent-sharpen`)    |
| 04      | solar yellow (`--accent-compete`) |
| 05      | emerald (`--accent-research`)     |
| 06      | ember (`--accent-cto`)            |
| 07      | tangerine (`--accent-fun`)        |

## License

© fibe.gg — all rights reserved (the published site).
