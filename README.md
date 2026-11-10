# Grok Bot weekly lessons

Published at [https://shea-nelson.github.io/grok-lessons/](https://shea-nelson.github.io/grok-lessons/).

Moved here from `Shea-Nelson/workout-app/grok-lessons/` on Nov 10, 2026; the lesson files now sit at the repo root (lesson pages link `../shelf/` and `../lessons.css`). The older single-page lesson from `workout-app/lesson/` is at `lesson/`.

- `index.html` — newest lesson first, then the archive.
- `YYYY-MM-DD/index.html` — one page per lesson.
- `lessons.json` — machine-readable index (`date`, `title`, `slug`, `fullText`). Append a new Monday lesson at the top.
- `guides/` — official xAI / SpaceXSI Grok and Grok Bot guides. The index links to the official URLs. Local copies are not saved; see the note on that page. `guides.json` stores `title`, `sourceUrl`, `localFile`, `retrievedDate`, and `contentHash` so a weekly run can detect new or updated guides and keep older hashes.

Last guides retrieval: 2026-11-10 (America/New_York).
