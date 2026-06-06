# Third-Party Notices

This file summarizes third-party software, data, fonts, and runtime services used by Flag Rush. Keep it updated when dependencies, fonts, data sources, or externally loaded assets change.

## Runtime Dependencies

- React, React DOM, Vite, TypeScript, ESLint, Capacitor, and related tooling are used under their respective open-source licenses as declared by their npm packages.
- Run `npm audit` and inspect package metadata before release changes.

## Country Data

- Country metadata is derived from the `world-countries` npm package.
- `world-countries` declares the Open Database License `ODbL-1.0`.
- Generated files derived from this data include `src/countryData.ts` and `src/countryFactNames.ts`.

## Flag Images

- Runtime flag images are loaded from FlagCDN using country codes.
- Flag images are not vendored into this repository as source assets.
- Review FlagCDN usage terms before changing hosting, caching, redistribution, or store listing claims around flag images.

## Fonts

- Bundled Rubik font files in `src/assets/fonts/rubik-*.ttf` are treated as Google Fonts / SIL Open Font License family assets.
- Bundled Nunito Sans font files in `src/assets/fonts/nunito-sans-*.ttf` are treated as Google Fonts / SIL Open Font License family assets.
- Preserve font license evidence with release materials when replacing or redistributing font files.

## App And Store Artwork

- Flag Rush branding assets, app icons, splash assets, mode artwork, feature graphic, and Google Play screenshots are project assets.
- `store-assets/google-play/feature-graphic.png` is rendered from the tracked HTML source in `store-assets/google-play/feature-graphic.html`.
- `store-assets/google-play/screenshots/*.png` are captured from the current local Flag Rush app UI.
