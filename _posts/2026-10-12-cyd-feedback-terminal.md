---
title: "Table feedback terminal"
tags: [builds]
status: paused
glyph: "☺"
summary: "A small rating screen for restaurant tables. One per table, so the owner can see which tables and areas do well."
specs:
  - k: Board
    v: ESP32-2432S028R, 2.8" touch display
  - k: Firmware
    v: v2.5, written in C++ with PlatformIO
  - k: Backend
    v: Google Sheet + Apps Script, live dashboard and table map
  - k: Behaviour
    v: Screen stays dark, wakes every few minutes to ask, sleeps at night
  - k: Offline
    v: Queues up to 200 votes when the Wi-Fi drops
  - k: Case
    v: Snap-fit shell and 30° stand, modelled in CadQuery, printed on an A1 Mini
  - k: Status
    v: Works on the bench. Selling is on hold.
cover: /assets/projects/feedback-terminal/cover.jpg
gallery:
  - src: /assets/projects/feedback-terminal/parts.jpg
    caption: The two printed parts, snap-fit case and 30° stand
  - src: /assets/projects/feedback-terminal/side.jpg
    caption: Case out of the stand, rating screen on
  - src: /assets/projects/feedback-terminal/top.jpg
    caption: The four faces guests tap
---
