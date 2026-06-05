# Asset Provenance

This file summarizes known asset and data sources for Flag Rush. Keep it updated when assets are added, replaced, or regenerated.

## Application Assets

- `src/assets/app-icon.png`, Android launcher icons, iOS app icons, splash images, and `public/favicon*.png` are Flag Rush app branding assets.
- `src/assets/modes/*.png` are custom mode illustrations for Europe, Asia, Africa, Americas, Oceania, and World.
- `verification-game-screen.png` is a local verification screenshot.

Store listing assets such as a root-level `app-icon-512.png` or `feature-graphic.html` may be kept outside the first OSS commit unless they are intentionally added as release/listing materials.

If any branding or mode image is generated or commissioned, retain the prompt, source file, or license evidence outside the repository and summarize the source here.

## Fonts

- `src/assets/fonts/rubik-*.ttf` are bundled Rubik font files.
- `src/assets/fonts/nunito-sans-*.ttf` are bundled Nunito Sans font files.

Verify font licenses before redistribution and keep license notices with release materials when required.

## Country and Flag Data

- Country metadata comes from the `world-countries` npm package.
- Runtime flag images are loaded from FlagCDN using country codes.
- Curated country facts and translations live in `src/countryFacts.ts` and `src/providedFactTranslations.ts`.

## Generated Build Assets

- `dist/`, Android build outputs, iOS build outputs, APK, AAB, IPA, and zipped app artifacts are generated files and should not be committed unless a release process explicitly requires it.
