# skybound-island-frontier

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/hqnsyhrn/skybound-island-frontier/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/hqnsyhrn/skybound-island-frontier/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

SKYBOUND: Island Frontier — an original 3D arcade flight adventure built with Three.js (vendored
locally, fully offline). Fly a bush plane over a procedurally generated tropical archipelago of 14
heightfield islands with volcanic peaks, animated ocean, drifting clouds and atmospheric fog.

- **Free Flight** — explore the archipelago, track distance flown.
- **Ring Challenge** — 12 glowing checkpoint rings, combo scoring, 120 s timer.
- **Precision Landing** — guided runway approach, touchdown speed/angle/position scoring.

Chase camera with banking follow, cockpit camera with a live ALT/SPD/THR/HDG instrument panel,
arcade flight physics (throttle, lift, stall, terrain collision, landing assessment), engine audio,
and a clean aviation-styled HUD. All artwork, names and code are original; the only dependency
(Three.js) is vendored under `game/vendor/` — no network requests at runtime.

## Run it

```sh
node serve.ts        # then open http://localhost:8080
```

or open `game/index.html` directly in a desktop browser — everything is local.

---

<sub>Entered on [make.fun](https://make.fun/?ref=modalmuseng&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
