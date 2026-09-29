# Math Wonderland

A math adventure game for kids that plays in a phone browser. It uses pictures, numbers and sounds, so children who can't read English yet can play.

This is the first prototype: **Meadow**, the first of four worlds, with 17 stages and a boss:

| Stage | Skill |
|---|---|
| 🔢 | Count and compare to 20 |
| 🔁 | Patterns |
| 🍎 | Add and take away to 20 |
| 🔟 | Make 10 and doubles |
| 🧱 | Tens and ones to 100 |
| ➕ | Add and subtract to 100, no carrying |
| 🔄 | Add and subtract to 100, with carrying |
| 🧩 | Puzzle stop: missing signs, pyramids, balances, pairs |
| ×2 | Times tables 1, 2, 10 |
| ×5 | Times table 5 |
| ×3 | Times tables 3, 4 |
| ×7 | Times tables 6, 7 |
| ×9 | Times tables 8, 9 |
| ✖️ | Table mixer |
| 🔷 | Shapes: corners and sides, find every matching shape |
| 🦋 | Mirror pictures, 3D solids, counting triangles |
| 🧩 | Puzzle stop with times tables |
| 🧌 | Meadow boss, opens when every stage has a star |

## How it plays

- **Watch, then try.** The first time a stage opens, a hand shows how to answer.
- **Rounds** have 10 questions. Questions get harder after 3 right in a row and easier after a miss. Missed questions come back at the end of the round.
- **💡 hint** turns the numbers into a picture (ten-frames, blocks, arrays).
- **🔍 solution** appears beside ⓘ once a question is answered and opens a few picture steps showing how to solve it, plus what went wrong when the answer matches a common mistake. After a miss the game waits 4 seconds (⏭ skips the wait); the results screen lists every question of the round so any solution can be opened again. Solutions change no scores, gems or saves. Meadow has full solutions; the other worlds show the question solved with its hint picture and the ⓘ sentence until their own solutions are added (`sol` data in each generator, solvers in `js/sol-basic.js`, sentences in `js/sol-words.js`).
- **Stars** depend on first-try accuracy: 90% gives 3 stars, 70% gives 2, 50% gives 1. One star opens the next stage.
- **⚡ golden gate**: 8 hard questions. Getting 7 right clears the stage with 3 stars.
- **🚀 placement quest** for new players: questions get harder until the child struggles, then the child starts from that stage.
- **Rewards**: gems, streak multipliers (×2 at 5 in a row, ×3 at 10), a surprise chest after each cleared round (stickers, pet hats, gems), and a pet that hatches and grows when fed with gems.
- **Parent corner**: press and hold ⚙️ on the map. It shows progress, can open all stages, turns sound on or off, and deletes a player.

Up to 6 players can share a device; each child taps their own animal when the game opens. Progress is saved in the browser on the device, and can also be shared between devices with family sync.

## Family sync (optional)

Family sync shares players between phones and tablets. One device creates a family code, and every other device types the same code. The game keeps working offline and syncs when it's back online. It stores each player's animal, the name a parent typed (a first name or nickname is enough), stars, gems, pet and stickers. A child added separately on two devices with the same animal and name becomes one player after syncing.

It uses a free Firebase project. One-time setup:

1. Go to https://console.firebase.google.com, click **Create a project**, name it (for example `math-wonderland`) and turn Google Analytics off.
2. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable → Save.**
3. **Build → Firestore Database → Create database.** Pick a location near you and choose **production mode**.
4. In Firestore open the **Rules** tab, replace everything with the rules below and click **Publish**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /families/{code} {
         allow get, create, update: if request.auth != null && code.size() == 10;
       }
     }
   }
   ```

   Devices can only open a family whose code they know; nobody can list families or delete them.
5. **Project settings (⚙️ next to Project Overview) → General → Your apps → Web (`</>`).** Give it a nickname and click **Register app** (Firebase Hosting isn't needed).
6. From the config it shows, copy `apiKey` and `projectId` into `js/cloud-config.js`. These two values are public identifiers, not passwords.

Then, on the player screen, press and hold ⚙️ in the corner to open **Family sync**.

## Run it

It's a static site with no build step. Serve the folder with any web server, for example:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. On GitHub Pages, publish the `main` branch root.

## Code map

- `js/skills.js`: stages and their question generators
- `js/play.js`: a round (normal, golden gate, placement, boss) and the watch-then-try demo
- `js/main.js`: screens (players, map, results, pet, parent corner)
- `js/visuals.js`: picture aids
- `js/progress.js`: saving, players, pet growth
- `js/cloud.js`, `js/cloud-config.js`: family sync (Firebase REST, no SDK)
- `js/audio.js`: sound effects made with Web Audio
- `sw.js`: offline support
