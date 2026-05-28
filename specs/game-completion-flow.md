# Game Completion Flow

## Goal

When a player clears every country in the selected map, the run should feel finished instead of silently looping the same countries again.

## Requirements

- A correct answer that completes the deck must show a clear completion result.
- The game must not automatically create another question after the final country.
- Restarting the same map should require an explicit player action.
- The result and primary next/restart action should appear directly after the answer buttons so the player does not need an extra swipe.
- Normal correct answers should still advance to the next flag.
- Wrong answers and timeouts should still show the restart/exit choice.

## Verification

- Completing a deck leaves progress at `total/total`.
- Pressing the completion restart button starts a fresh run.
- Pressing `Next` on a non-final correct answer still advances normally.
