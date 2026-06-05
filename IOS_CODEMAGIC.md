# Flag Rush iOS / Codemagic

This project includes a Capacitor iOS app at `ios/App/App.xcodeproj` and Codemagic workflows in `codemagic.yaml`.

## App Identity

- App name: `Flag Rush`
- Bundle identifier: `com.flagrush`
- Web output directory: `dist`

## Workflows

### `ios-simulator`

Use this first. It does not require Apple signing and checks that the iOS project builds on a macOS runner.

Expected artifact:

- `FlagRush-simulator.app.zip`

### `ios-unsigned-device`

Builds an unsigned iPhoneOS app artifact for inspection. This is not an installable App Store release.

Expected artifacts:

- `FlagRush-unsigned.ipa`
- `FlagRush-unsigned.app.zip`

### `ios-release`

Builds a signed App Store/TestFlight IPA.

Before running it, configure iOS signing in Codemagic:

- Apple Developer account or App Store Connect integration.
- iOS distribution certificate.
- App Store provisioning profile for `com.flagrush`.
- Required Codemagic environment groups or secure variables.

Expected artifact:

- `.ipa` in `build/ios/ipa/`

## Local Notes

Windows can build the web app and sync the Capacitor iOS project, but final local iOS builds require macOS and Xcode.

```sh
npm ci
npm run ios:sync
```

Do not commit signing profiles, certificates, App Store Connect API keys, or generated IPA files.
