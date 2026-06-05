# Contributing

Thanks for helping improve Flag Rush. Please keep contributions focused on the real app in this repository.

## Local Setup

```sh
npm ci
npm run dev
```

Before opening a pull request, run:

```sh
npm run lint
npm run build
```

For platform work, also run the relevant sync command:

```sh
npm run android:sync
npm run ios:sync
```

## Development Guidelines

- Keep gameplay changes small and easy to test.
- Preserve existing player progress keys unless a migration is included.
- Do not commit `.env*`, keystores, signing profiles, service account files, or generated release builds.
- Keep UI text available in every supported language when adding a visible string.
- Update `ASSET_PROVENANCE.md` when adding or replacing visual assets, fonts, or external data sources.
- Update `README.md`, `CHANGELOG.md`, or release notes when the user-facing behavior changes.

## Pull Requests

Include:

- What changed.
- Why it changed.
- How it was tested.
- Screenshots or short recordings for visible UI changes.

## Issue Reports

For bugs, include:

- Platform: web, Android, or iOS.
- Browser, device, or OS version if relevant.
- Steps to reproduce.
- Expected behavior.
- Actual behavior.
