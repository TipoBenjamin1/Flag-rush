# Flag Rush Submission Package

Last prepared: 2026-06-06

This file collects public, copy-ready material for submitting Flag Rush to open-source support programs and app stores. Keep private signing files, service-account credentials, generated APK/AAB/IPA outputs, and `.env.local` out of the repository.

## Project Links

- Repository: https://github.com/TipoBenjamin1/Flag-rush
- Google Play: https://play.google.com/store/apps/details?id=com.flagrush
- Release: https://github.com/TipoBenjamin1/Flag-rush/releases/tag/v0.1.0
- Issues: https://github.com/TipoBenjamin1/Flag-rush/issues
- License: MIT
- Android package: `com.flagrush`
- iOS bundle id: `com.flagrush`

## OpenAI Codex For OSS

Use `OSS_APPLICATION.md` as the full draft. Suggested short answers are also included there.

Use `OPENAI_OSS_FORM_READY.md` as the final copy-paste version for the application form.

Recommended final checks before submission:

- Public repository is visible and points to `https://github.com/TipoBenjamin1/Flag-rush`.
- Google Play listing is live at `https://play.google.com/store/apps/details?id=com.flagrush`.
- Release `v0.1.0` is published.
- CI is green for the latest pushed commit.
- Secrets, keystores, release artifacts, service-account files, and `.env.local` are not committed.
- `README.md`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `ROADMAP.md`, `CHANGELOG.md`, and release notes are present.

## Google Play Listing

Public listing URL:

```text
https://play.google.com/store/apps/details?id=com.flagrush
```

App name:

```text
Flag Rush
```

Short description:

```text
Beat the flag clock in a fast world flags quiz.
```

Full description:

```text
Flag Rush is a fast, mobile-first flag quiz game for learning country flags under pressure.

Pick a region or challenge the full world map, then race the timer to identify flags before the clock runs out. Build streaks, earn XP, climb ranks, and track your progress locally on your device.

Features:
- Europe, Asia, Africa, Americas, Oceania, and World modes
- 5, 10, and 15 second blitz rounds
- XP, ranks, streaks, best attempts, and local profile stats
- Country facts after correct answers
- Multilingual interface
- No account required
- No ads or analytics SDKs in the current app

Flag Rush is designed for quick practice, geography learning, and replayable flag challenges.
```

Category:

```text
Game / Trivia
```

Suggested tags:

```text
Flags, Geography, Quiz, Trivia, Education
```

Content notes:

```text
No user-generated content, no ads, no purchases, no account system, no social sharing, no location tracking.
```

Privacy summary:

```text
Flag Rush stores gameplay progress, settings, nickname, XP, ranks, and statistics locally on the device. The app does not use analytics, advertising SDKs, account registration, or a backend for gameplay data. Flag images are loaded from FlagCDN, so the device makes network requests for flag image files.
```

Privacy policy:

```text
Publish `privacy-policy.html` to a stable HTTPS URL before Play Console submission, then paste that URL into the listing.
```

## Google Play Assets

Upload files from `store-assets/google-play/`:

- App icon: `app-icon-512.png`
- Feature graphic: `feature-graphic.png`
- Phone screenshots:
  - `screenshots/01-home.png`
  - `screenshots/02-main-menu.png`
  - `screenshots/03-map-select.png`
  - `screenshots/04-gameplay.png`
  - `screenshots/05-correct-answer.png`

Verified screenshot properties:

- 1080x1920
- 24-bit RGB PNG
- Captured from the current local Flag Rush app

## Release Readiness Checks

Already passed on 2026-06-06:

- `npm.cmd run generate:country-data`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd audit`
- `npm.cmd pack --dry-run`
- `npm.cmd exec cap -- doctor` for Android, with Xcode missing on Windows
- `.\gradlew.bat assembleDebug testDebugUnitTest lintDebug`
- Manual/CDP smoke: landing, timer select, map select, gameplay, correct answer with country fact, wrong answer, restart

Run again before uploading a new build:

```powershell
npm.cmd run generate:country-data
npm.cmd run lint
npm.cmd run build
npm.cmd audit
npm.cmd pack --dry-run
Push-Location android
.\gradlew.bat assembleDebug testDebugUnitTest lintDebug
Pop-Location
git status --short --branch
```

## Remaining Manual Steps

- Publish the privacy policy at a stable HTTPS URL.
- Upload the final signed AAB in Play Console from the private release process, not from the repository.
- Complete Play Console Data safety answers consistently with `privacy-policy.html`.
- Confirm age/content rating answers in Play Console.
- Submit the OpenAI Codex for OSS form using `OSS_APPLICATION.md`.
