# Math Wonderland

A math adventure game for kids that plays in a phone browser. It uses pictures, numbers and sounds, so children who can't read English yet can play.

This is the first prototype: **Meadow**, the first of four worlds, with 13 stages:

| Stage | Skill |
|---|---|
| 🔢 | Count and compare to 20 |
| 🔁 | Patterns |
| 🍎 | Add and take away to 20 |
| 🔟 | Make 10 and doubles |
| 🧱 | Tens and ones to 100 |
| ➕ | Add and subtract to 100, no carrying |
| 🔄 | Add and subtract to 100, with carrying |
| ×2 | Times tables 1, 2, 10 |
| ×5 | Times table 5 |
| ×3 | Times tables 3, 4 |
| ×7 | Times tables 6, 7 |
| ×9 | Times tables 8, 9 |
| ✖️ | Table mixer |

## How it plays

- **Watch, then try.** The first time a stage opens, a hand shows how to answer.
- **Rounds** have 10 questions. Questions get harder after 3 right in a row and easier after a miss. Missed questions come back at the end of the round.
- **💡 hint** turns the numbers into a picture (ten-frames, blocks, arrays).
- **Stars** depend on first-try accuracy: 90% gives 3 stars, 70% gives 2, 50% gives 1. One star opens the next stage.
- **⚡ golden gate**: 8 hard questions. Getting 7 right clears the stage with 3 stars.
- **🚀 placement quest** for new players: questions get harder until the child struggles, then the child starts from that stage.
- **Rewards**: gems, streak multipliers (×2 at 5 in a row, ×3 at 10), a surprise chest after each cleared round (stickers, pet hats, gems), and a pet that hatches and grows when fed with gems.
- **Parent corner**: press and hold ⚙️ on the map. It shows progress, can open all stages, turns sound on or off, and deletes a player.

Progress is saved in the browser on the device. Up to 4 players are supported.

## Run it

It's a static site with no build step. Serve the folder with any web server, for example:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. On GitHub Pages, publish the `main` branch root.

## Code map

- `js/skills.js`: stages and their question generators
- `js/play.js`: a round (normal, golden gate, placement) and the watch-then-try demo
- `js/main.js`: screens (players, map, results, pet, parent corner)
- `js/visuals.js`: picture aids
- `js/progress.js`: saving, players, pet growth
- `js/audio.js`: sound effects made with Web Audio
- `sw.js`: offline support
