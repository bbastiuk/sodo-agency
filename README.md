# SODO Agency

Boutique digital-agency landing — single-file static site with WebGL/Canvas effects, scroll-driven services & clients 3D scenes, iridescent cursor orb, custom typography, mobile-responsive.

**Live**: see GitHub Pages link in repo settings.

## Tech

- Vanilla HTML + inline JS, no build step
- Three.js (CDN) for the two pinned 3D scenes (services depth journey, clients horizontal gallery)
- Lenis (CDN) for smooth scroll
- Custom WebGL fragment shader for the cursor iridescent orb (oil-slick / soap-film thin-film interference)
- IntersectionObserver scroll reveals
- `sodo-services/*.png` — service card photos (7:9 aspect)

## Run locally

```
python -m http.server 8765
```

Open `http://localhost:8765/`.
