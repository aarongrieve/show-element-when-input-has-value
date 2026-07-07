# AIRON — official artist website

An immersive, single-page site for **Airon** (Aaron Grieve) — a singer-songwriter
making raw, cinematic indie-folk in **Cardigan / Aberteifi, Wales**. Built to
showcase the music and drive listeners to streaming platforms.

Live demo: open `index.html` in a browser, or serve the folder
(`npx serve site` / `python3 -m http.server`).

## What it does

- **Immersive hero** — kinetic "AIRON" wordmark (Fraunces) over a live `<canvas>`
  "sea & mist" background (layered waves + drifting motes that react to the cursor).
- **Latest release** — featured single (**Munkee**) with an animated waveform
  "player" and prominent streaming links.
- **The songs** — the full run of 11 singles as an interactive tracklist, each with
  its own colour wash and a *Stream* button.
- **Story** — the Cardigan / River Teifi narrative, Welsh-language nods, BBC
  Introducing in Wales, animated stat counters.
- **Listen** — a wall of platform buttons (Spotify, Apple Music, SoundCloud,
  YouTube Music, BBC Introducing, BandLab) plus a "next single" email capture.

## Motion / tech

- **GSAP + ScrollTrigger** — preloader, hero letter reveal, scroll-triggered line
  reveals, parallax, marquees, count-ups, and a 3D cover tilt.
- **Lenis** — buttery smooth scrolling, synced to ScrollTrigger.
- Custom cursor, grain + vignette overlays, animated waveform visualiser.
- Fully **self-contained** — GSAP, Lenis and the variable fonts (Fraunces,
  Space Grotesk) are vendored locally in `js/` and `assets/fonts/`, so the site
  works on any host with no external CDN calls.
- **Accessible & resilient** — respects `prefers-reduced-motion`, and if the JS
  libraries ever fail to load, all content still renders via CSS fallbacks.

## Structure

```
site/
├── index.html            # markup + content
├── css/style.css         # visual identity, layout, @font-face
├── js/
│   ├── main.js           # all interaction & motion
│   ├── gsap.min.js       # vendored
│   ├── ScrollTrigger.min.js
│   └── lenis.min.js
└── assets/fonts/         # self-hosted Fraunces + Space Grotesk (woff2)
```

## Customising

Streaming buttons currently point at **platform search URLs** so they work
immediately. Search the code for `TODO(airon)` and swap in the canonical URLs
once the profiles are confirmed:

- Latest-release links + per-track `Stream` links in `index.html`.
- The `.platforms` grid in the **Listen** section.
- To embed the real Spotify player, drop the `<iframe>` snippet (commented in
  `index.html`, in the release section) with your track/artist ID.
- The email form (`initSignup` in `main.js`) validates client-side only — wire the
  `POST` to your provider (Mailchimp, Buttondown, etc.) where the `TODO` is marked.

## Palette

| Token   | Hex       | Meaning              |
|---------|-----------|----------------------|
| ink     | `#070a0b` | nocturnal background |
| bone    | `#efe9dc` | warm off-white text  |
| teal    | `#5fb3a3` | the Teifi / the sea  |
| ember   | `#e0a05a` | lamplight / warmth   |
