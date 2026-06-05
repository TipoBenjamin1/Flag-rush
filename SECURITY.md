# Security Policy

## Supported Versions

Flag Rush is early-stage software. Security fixes are applied to the `main` branch unless a release branch is explicitly created.

## Reporting a Vulnerability

Please do not post secrets, exploit details, or private user data in a public issue.

Report security concerns privately to the repository owner, or open a GitHub security advisory if the repository has private vulnerability reporting enabled.

Useful details:

- Affected platform: web, Android, or iOS.
- Steps to reproduce.
- Impact.
- Suggested fix, if known.

## Secret Handling

Never commit:

- `.env*` files.
- Android keystores or `keystore.properties`.
- Google service account files.
- App Store Connect API keys.
- Codemagic signing assets.
- Generated APK, AAB, IPA, or zipped app artifacts.
