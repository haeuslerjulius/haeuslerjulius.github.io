# How this site works

Everything you'll normally change is in two places: `_data/` and `_posts/`.
GitHub Pages rebuilds the site about a minute after every commit.

## Fill-in boxes

While `show_slots: true` is set in `_config.yml`, every empty spot shows a yellow
dashed box that tells you what goes there. Visitors see them too, so set
`show_slots: false` before you send the link to anyone. Empty spots then just
disappear.

## The four parts

| Part | File |
|---|---|
| Me (tagline, about, interests, next) | `_data/me.yml` |
| School (courses, grades, competitions, roles, work) | `_data/school.yml` |
| Builds | one file per project in `_posts/`, tagged `builds` |
| Drone services (pitch, story, fleet, reel, work) | `_data/drones.yml` |
| "Right now" strip at the top | `_data/now.yml` |

## Add a build

1. Make a folder `assets/projects/<name>/` and put 2–4 photos in it.
   Keep them under about 500 KB each (resize to 1600 px wide).
2. Create `_posts/YYYY-MM-DD-name.md`:

```
---
title: "Name of the build"
tags: [builds]
status: building        # done, building, paused, planning or designed
glyph: "AB"             # 1–4 characters shown when there's no cover photo
summary: "One sentence on what it is."
cover: /assets/projects/name/cover.jpg
gallery:
  - src: /assets/projects/name/bench.jpg
    caption: First version on the bench
specs:
  - k: Board
    v: ESP32
links:
  - label: Code on GitHub
    url: https://github.com/haeuslerjulius/...
---

What it is, why you built it, what went wrong, what you'd change.
```

## Add a log post

Same as before: `_posts/YYYY-MM-DD-title.md` with `tags: [home]`.
Anything not tagged `builds` shows up in the Log.

## Turnaround photo

Phone on a tripod at chest height, stand on one marked spot, turn about 15°
between shots: 24 photos for a full turn, same light (overcast or indoors).
Crop them all to the same 2:3 frame, name them `01.jpg` … `24.jpg`, put them in
`assets/me/turn/`, and set `turn_frames: 24` in `_data/me.yml`.
Visitors can drag across the photo to turn you; it also turns once on load.

## What stays where it was

The review pages (`/reviews/…`), the client pages (`/clients/…`), the
LEVEL / DOT / HOLD / PORTHOLE experiments (`/level….html`) and every old post
keep their addresses.

## Preview on your PC (optional)

With Ruby installed: `bundle install`, then `bundle exec jekyll serve`, then open
http://localhost:4000.
