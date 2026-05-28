# Flag Rush iOS / Codemagic

## What is ready

- iOS Capacitor project: `ios/App/App.xcodeproj`
- Bundle id: `com.tipobenjamin.flagquiz`
- App name: `Flag Rush`
- iOS app icon and splash are set from the Flag Rush icon.
- Codemagic config: `codemagic.yaml`

## Codemagic workflows

### `ios-simulator`

Use this first. It does not need Apple signing and checks that the iOS project builds on a Mac.

Expected artifact:

- `FlagRush-simulator.app.zip`

### `ios-release`

Use this for a real App Store/TestFlight `.ipa`.

Before running it, configure iOS code signing in Codemagic:

- Apple Developer account connected to Codemagic
- App Store Connect API key or Apple integration
- iOS distribution certificate
- App Store provisioning profile for `com.tipobenjamin.flagquiz`

Expected artifact:

- `.ipa` in `build/ios/ipa/`

## Important

This folder is not currently a git repository. Codemagic normally builds from a connected Git repository, so push this project to GitHub/GitLab/Bitbucket first, then add that repository in Codemagic.

Local Windows can prepare and sync the iOS project, but it cannot build the final iOS app because iOS builds require macOS/Xcode. Codemagic handles that part.
