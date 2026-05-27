# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
python3 serve.py
# Opens at http://localhost:8765/
# LAN URL printed on startup (e.g. http://10.x.x.x:8765/) — phones on the same WiFi can scan QR codes
```

The server reads `OPENAI_API_KEY` from `.env` and exposes it (plus `LOCAL_IP`, `LOCAL_PORT`) via `/config.js`. There is no build step — Babel transpiles JSX in the browser at load time.

Kill a hung server: `lsof -ti:8765 | xargs kill -9`

## Architecture

**No build toolchain.** React 18 + Babel standalone are loaded from CDN. All `.jsx` files are `<script type="text/babel">` tags loaded in order by `index.html`. Everything runs in the browser.

### File roles

| File | Role |
|---|---|
| `serve.py` | Python HTTP server. Injects API key + LAN IP into `/config.js`. Handles `POST /store` (saves discharge JSON, returns short UUID URL) and `GET /d/<id>` (serves `patient.html` with data embedded as `window.__DISCHARGE__`). |
| `app.jsx` | All four screens: `HomeScreen` (form) → `GeneratingScreen` (OpenAI call) → `PatientScreen` (editable review) → `QrScreen` (real QR). Contains `COMMON_DX` (~150 diagnoses), `callOpenAI`, `SYSTEM_PROMPT`, and the `App` root. |
| `patient-view.jsx` | `PatientView` component used inside `PatientScreen`. Supports tap-to-edit via `EditableText` (contentEditable). Exported as `window.PatientView`. |
| `patient.html` | Standalone page served at `/d/<id>` for patients to open after scanning the QR. Pure HTML/JS — reads `window.__DISCHARGE__` injected by the server and renders discharge instructions. |
| `qr.jsx` | Wraps `qrcode-generator` (global `window.qrcode`) into a React SVG component. High error correction (`H`) to allow the logo overlay. Exported as `window.FakeQR`. |
| `ios-frame.jsx` | `IOSDevice` phone frame shell + iOS UI primitives (`IOSStatusBar`, `IOSGlassPill`, etc.). All exported to `window`. |
| `tweaks-panel.jsx` | Floating dev panel. `useTweaks(defaults)` hook persists accent/screen state. Activated by `__activate_edit_mode` postMessage from a host frame. |

### Data flow

1. Doctor fills `HomeScreen` (sex, age range, diagnosis) → `callOpenAI` hits `gpt-4.1-mini` → returns JSON matching `{ diagnosisTitle, summary, care[], returnIf[], followUp, issuedAt }`.
2. `PatientScreen` renders `PatientView` in editable mode. Doctor taps text to correct AI output.
3. On confirm → `QrScreen` POSTs the final data to `POST /store` → gets back `{ id, url }` → renders real QR encoding that URL.
4. Patient scans → browser opens `/d/<id>` → server injects data into `patient.html` → static page renders.

### Result object shape

```js
{
  diagnosisTitle: string,   // Thai (English)
  summary: string,
  care: string[],           // 3–5 home-care instructions
  returnIf: string[],       // 3–5 return-to-ED warnings
  followUp: { when, where },
  medications: [],          // reserved, currently unused in UI
  patient: { sex, ageRange, age },
  issuedAt: string,         // Thai Buddhist Era date string from nowThai()
}
```

### Styling conventions

- CSS custom properties (`--bg`, `--surface`, `--ink`, `--ink-2`, `--ink-3`, `--line`, `--accent`, `--accent-soft`, `--warn`, `--warn-soft`) defined in `index.html`.
- `oklch()` color space for all accent/warn colors.
- All layout is inline styles. No CSS classes except `device-scroll` (hide scrollbar) and `mono` (JetBrains Mono font).
- `Stack` / `Row` are tiny inline helpers in `app.jsx` (flex column / flex row).

### Discharge store

`serve.py` keeps discharge data in a Python dict in process memory (`discharge_store`). Data is lost when the server restarts — this is intentional for a demo/dev tool.
