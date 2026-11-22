[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/heruruben-hub/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/heruruben-hub/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# heist-game

**Vaultfall** — a top-down stealth heist game in plain JavaScript and canvas. No build step, no assets, no network: every sprite is drawn in code and every sound is synthesized with WebAudio.

You are a thief inside the Meridian Bank after closing time. Cross each floor unseen, crack the vault, grab any loose gems on the way, and get back to the stairs before the alarm meter fills.

## How to play

- **Move** — WASD or the arrow keys.
- **Crack the vault** — stand beside it and hold **E**. Moving cancels the crack, and its progress drains.
- **Pause** — **P** or Esc. **Restart the floor** — **R**.
- Guards patrol waypoint loops and security cameras sweep back and forth; their vision cones stop at walls. Being seen fills the **alarm meter** — a guard who touches you, or a meter that hits 100%, ends the run.
- Dark dashed patches are shadow: inside them you are hidden and no cone can pick you up.
- Two floors in sequence: the Gallery, then the Vault Floor, with faster patrols, a third camera and a one-door vault room. Your loot and time carry over; the win screen totals both.

## Run it

```sh
node serve.ts
```

then open the printed address (http://localhost:8080). Any static file server over `game/` works just as well — `game/index.html` is the whole game.

To produce the hand-in output (a copy of the game, the screenshots and `dossier.json`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `game/index.html` — the page and the canvas.
- `game/src/config.js` — stage size, palette and tuning.
- `game/src/levels.js` — the two floors as data: walls, shadows, patrols, cameras, loot, vault.
- `game/src/world.js` — the simulation: movement, patrols, line of sight, the alarm, cracking.
- `game/src/render.js` — all drawing, including the HUD and the title / pause / win / lose screens.
- `game/src/input.js`, `game/src/audio.js` — keyboard state and synthesized sound effects.
- `game/src/shots.js` — the frozen scenes behind the screenshots (`?shot=1` … `?shot=4`).
- `main.ts` — the hand-in program; `vendor/makefun-game.ts` — the make.fun dossier library.

<sub>Entered on [make.fun](https://make.fun/?ref=kh6903y0&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
