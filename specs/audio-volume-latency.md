# Audio Volume and Latency

## Goal

Make game audio clearly louder and remove the delayed first sound effect while keeping the existing generated WebAudio music and effects.

## Requirements

- Sound defaults remain enabled at full volume for new and migrated installs.
- Background music should start when the home menu is visible, without waiting for a game button press.
- Background music must stop immediately when the app is backgrounded, closed, or the page is hidden.
- Background music may resume only after the app returns to the foreground and the home menu is visible.
- The first user tap should unlock and resume WebAudio before game actions need sound.
- Click, correct, wrong, and music sounds should be louder without harsh clipping.
- Background music must not start multiple overlapping loops.
- Android WebView should allow media playback without requiring a user gesture.

## Verification

- Settings show sound `ON` and volume `100%` after a fresh/migrated launch.
- Production build and Android release bundle compile successfully.
- Fresh APK/AAB and Vercel deployment are produced after the change.
