# Visual Refresh Themes

## Goal

Create a polished casual mobile-game variant for Flag Rush using the supplied dark and light theme references while preserving the app's bright, catchy Cyprus-boat energy.

## Scope

- Refresh the visual system for home, mode selection, gameplay, result/completion, profile, and settings screens.
- Keep the existing game mechanics, audio lifecycle fixes, app icon, splash icon, and completion flow intact.
- Support both existing themes:
  - Dark: deep navy play surface, glassy panels, yellow/orange primary actions, teal/green/red feedback.
  - Light: pale sky surface, clean white panels, soft shadows, the same energetic accent palette.
- Use the real app icon as the main brand object where it improves recognition.
- Use the supplied mode-icon reference as the source for map-picker icons: castle, pagoda, acacia tree, Statue of Liberty, island, and globe.
- Mode icons should feel integrated into each card through shared lighting, glow, and shadow treatment rather than looking like separate pasted PNGs.
- After the runner loading screen, show a standalone landing splash with Flag Rush branding, a Play Now action that opens the existing main menu, and a How to Play action with clear rules.
- The landing splash and main menu should share the same dark framed/glass UI language from the latest reference: deep navy background, rounded glass panels, diagonal texture, yellow primary CTA, teal/yellow corner accents, and compact premium game cards.
- The landing splash should closely match the tall reference composition: oversized 3D Flag Rush logo in the upper half, subtitle on a dark tag, landmarks sitting on a lower globe scene, a darker button dock at the bottom, and subtle idle animations for the flag, balloons, landmarks, button shine, and scene entrance.
- Landing music should try to start as soon as the Play Now landing screen appears, with audio enabled by default on fresh installs.
- Background music should continue through map selection and active gameplay. It should stop only when the player loses or clears the selected map; map clears play the separate victory jingle, and normal music resumes when the player starts another active run or returns to the lobby.
- English is the fresh-install default language, but settings must still allow switching to phone language or a manually selected language. Landing, how-to, result, settings, and mode labels must use the selected language rather than hardcoded English.
- The landing profile/star shortcut is removed from the top-right corner.
- Settings opened from the first landing splash must return to the landing splash when Back is tapped, while settings opened from the main menu must return to the main menu.
- The correct-answer state should overlay the gameplay panel instead of stacking underneath the answers: hide the answer buttons after a choice, avoid bright white backplates, keep the themed continent background, and show country identity, fact, combo reward, and a prominent Next action in one focused layer.
- Country facts should come from a minimum three-fact pool per country, avoiding dull capital/code filler and favoring geography quirks, island/landlocked traps, border puzzles, size extremes, language mix, and curated cultural hooks.
- Country facts should rotate per country after each correct attempt instead of being randomly repeated, and the pool must render in every supported app language: English, Russian, Spanish, French, German, and Romanian.
- The in-game menu should be a pause overlay, not an instant exit: Resume, Restart, Change Map, Settings, and Quit should appear in a compact premium panel styled like the game.
- Clearing a full continent/world should show a trophy-style finish screen with score, best, combo, accuracy, Play Again/Home actions, and a funny completion line for the selected map.
- Profile/league presentation should feel more ranked: each rank needs a visual badge/icon and a compact league card with progress and key stats.
- Profile continent progress must count unique cleared countries against the real country count for each continent. Correct-answer totals may exceed 194, but map completion progress must never use repeated attempts as if they were new countries.
- Keep buttons and flag-answer layout compact enough for mobile, with answers visible near the flag.

## Non-Goals

- No country dataset changes.
- No copy rewrite beyond visual labels already present in the app.
- No new external audio assets or streaming audio dependencies.
- No new monetization, accounts, or network features.

## Acceptance Criteria

- Home feels like a modern casual game lobby rather than an angular debug/prototype screen.
- Mode cards feel colorful and collectible without hiding the country counts or best-attempt text.
- Mode selection should closely match the provided reference: centered mobile panel, large readable single-column cards, illustrated left side, clear map name, country-count pill, visible continent description, and a round arrow affordance on the right.
- Gameplay keeps flag and answers high on the screen, with timer/progress/status below.
- Gameplay flags should use each loaded flag image's real aspect ratio so wide, square-ish, and unusual flags fill their own frame without empty side fields or forced distortion.
- Non-English fact pools must not show raw English fallback text; Russian, Spanish, French, German, and Romanian should use localized facts or localized generated fallback facts.
- If a provided fact is not fully localized, the app should skip it for non-English languages instead of showing mixed-language text; dull fallback facts about generic size or generic geography should not be part of the rotation.
- The provided 194-country fact list is the primary fact source: each country must rotate exactly three provided facts, localized for English, Russian, Spanish, French, German, and Romanian.
- Dark and light themes are visually distinct but clearly the same product.
- The light home screen keeps readable contrast for top controls, blitz cards, and league text instead of inheriting dark-theme text on dark panels.
- Build, Android sync, APK, AAB, and Vercel deployment still succeed after the refresh.
