# Flag Rush

Flag Rush is a fast flag quiz game built with React, TypeScript, Vite, and Capacitor. The app ships as a web build and as native Android/iOS projects generated from the same source.

Players choose a region or the full world map, answer timed flag questions, build streaks, earn XP, and track progress in a local profile.

## Features

- Region modes for Europe, Asia, Africa, Americas, Oceania, and World.
- Timed quiz rounds with streaks, XP rewards, ranks, and best attempts.
- Local player profile with nickname, play time, cleared countries, and region stats.
- Multilingual UI and country facts.
- Custom app icon, splash assets, mode artwork, and responsive mobile-first UI.
- Capacitor Android and iOS projects included.

## Tech Stack

- React 19
- TypeScript
- Vite
- Capacitor Android and iOS
- ESLint
- Generated country metadata derived from `world-countries`
- Flag images loaded at runtime from FlagCDN

## Getting Started

Requirements:

- Node.js 20 or newer
- npm
- Android Studio for Android builds
- macOS with Xcode for local iOS builds, or Codemagic for cloud iOS builds

Install dependencies:

```sh
npm ci
```

Run the web app locally:

```sh
npm run dev
```

Build the web app:

```sh
npm run build
```

Run lint:

```sh
npm run lint
```

Preview the production build:

```sh
npm run preview
```

## Android

Sync the web build into the Android project:

```sh
npm run android:sync
```

Open Android Studio:

```sh
npm run android:open
```

The Android application id is `com.flagrush`.

Release signing expects `android/keystore.properties` and signing material to stay local. Do not commit keystores, passwords, service account files, or generated release artifacts.

## iOS

Sync the web build into the iOS project:

```sh
npm run ios:sync
```

Open Xcode on macOS:

```sh
npm run ios:open
```

Codemagic workflows are defined in `codemagic.yaml`. See `IOS_CODEMAGIC.md` for details.

The iOS bundle identifier is `com.flagrush`.

## Repository Layout

- `src/` - React application, gameplay logic, UI, facts, translations, and local assets.
- `public/` - favicon and static browser assets.
- `android/` - Capacitor Android project.
- `ios/` - Capacitor iOS project.
- `scripts/` - maintenance scripts.
- `specs/` - product notes and implementation specs.

## Privacy

Flag Rush stores gameplay progress locally in the browser or app WebView. The project does not require a backend for the core game. Review `privacy-policy.html` before publishing a store build or public demo.

## Assets and Attribution

See `ASSET_PROVENANCE.md` and `THIRD_PARTY_NOTICES.md` for source, generated, and third-party asset notes. Keep those files current when replacing icons, screenshots, fonts, data sources, or externally loaded flag images.

## Contributing

Contributions are welcome. Start with `CONTRIBUTING.md`, run `npm run lint` and `npm run build`, and keep changes focused on the real Flag Rush app in this repository.

## License

MIT. See `LICENSE`.
