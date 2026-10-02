# The Salt Republic

A prototype for a text-heavy narrative game inspired by the tone and structure of decadent, atmospheric story worlds, but built around an original setting and rules.

## Included prototype features

- vertical left sidebar navigation
- narrative locations with repeated daily actions
- stat-based challenge resolution
- an in-game resolution window with a rolling d100, suspense beat and the full outcome ledger (stats, XP, level ups, resources, afflictions, properties, chance drops)
- your cards are never taken away: an affliction card is drawn at random from the tide deck and never replaces what you were saving
- an affliction card leaves the hand the moment its malus is gone, whether you cleared it by playing the card or with a tide card
- requirement-based unlocking for unique story paths
- every story event states how it became available: open from the start, unlocked by a stat, a property, a chain step or a resource
- encounters marked Unique (one-time story beats) or Repeatable (farmable)
- a resolved unique encounter leaves its realm and is kept in the profile as a deed already done
- encounter cards show the live pass chance next to the difficulty, and tide cards show their draw chance
- a four step opening chain that grants the Brine-Farm, so a new chronicle starts with no property
- a failed encounter never leaves its realm: unique encounters disappear only when passed, and only a passed one opens the next chain step
- a live calendar of Anno Domini 1530 that follows the real clock, with the season, the day or night hour and the monthly grid
- an interactive chart of realms: the four realms are clickable beacons placed directly on the map artwork, with hover labels, a survey readout, and drag-to-pan plus scroll/pinch and button zoom
- the chart is the whole page: there is no second list of realms below it, and a beacon drag never counts as travel
- encounters you cannot take yet are not shown at all, on the location page or in the calendar: a locked story stays hidden instead of appearing greyed out, so nothing is spoiled in advance
- a gear screen with slots for head, body, hands, boots, mantle, trinket and a companion; click a piece to wear it, click again to take it off
- worn gear adds real bonuses to the attributes, to the roll odds of a test, to Max Vigor and to resource pools, so equipping something changes the game and not just the look
- the companion slot holds a beast or a person who walks with you and grants their own bonuses
- gear only counts while worn, and the bonuses are recalculated from scratch, so nothing can drift out of sync
- encounters declare when they happen (`when: 'day' | 'night' | 'any'`) and the card says whether the hour is right
- the calendar drawer browses months and seasons and opens a day sheet listing what that day holds
- automatic local save after key decisions
- choice log kept in the UI
- readable, low-strain visual styling for story-heavy play

## The lore and how it unlocks

The Lore page is a record the player fills in, not a codex they read. A subject
stays closed until the chronicle has actually proved it, and it then opens one
chapter at a time, so a place you have only just walked into shows you its
surface and keeps its history shut. Nothing is ever spoiled in advance: a closed
subject shows that something exists and why it is out of reach, and that is all.

The data lives in `lore.js`, which `index.html` loads before `app.js`.

### How branching works

Choices write **flags**. An encounter declares them on its outcome:

```js
success: { sets: { cargoCarried: true, checkpointMercy: true }, /* ... */ },
failure: { sets: { checkpointBetrayal: true, scholariumDebt: true }, /* ... */ }
```

Lore gates and future encounters then read those flags with
`{ type: 'flag', id: 'cargoCarried' }`. Faction standing is **derived** from them
rather than stored, so it can never contradict the choices that produced it, and
two chronicles can end on opposite sides of the same faction.

Gate types available in lore entries and chapters: `always`, `flag`, `negFlag`,
`event`, `attempted`, `location`, `property`, `stat`, `faction`, `standing`,
`lore`, `chapter`, `companion`. An **entry** opens when *any* of its `unlocks` is
true; a **chapter** needs *all* of its own `requires`. That is what lets a vessel
surface on a single hint while its deeper history stays shut.

### What unlocks what

Regenerate these tables from the source with `node tools/update-lore-docs.js`, so
they cannot drift away from the gates the game actually uses.

| Flag | Meaning | Lean | Set by |
| --- | --- | --- | --- |
| `ledgerTrusted` | The customs house trusts you | helpful | **Take the Ledger Job at the Customs House** (success) |
| `cargoCarried` | You carried the Scholarium crate | helpful | **Carry the Sealed Cargo Past the Checkpoint** (success) |
| `pansLeased` | You lease the abandoned salt pans | helpful | **Bargain for the Abandoned Salt Pans** (success) |
| `brineFarmSigned` | The Brine-Farm lease is yours | helpful | **Sign the Brine-Farm Papers Before the Council** (success) |
| `treatyRead` | You read the Treaty of 1528 | helpful | **Decipher the Submerged Treaty of 1528** (success) |
| `councilRecords` | You hold Council of Ten records | helpful | **Converse Discretely with the Chief Scribe** (success) |
| `desaltinators` | The cold vents feed your farm | helpful | **Install Sub-Zero Desalinators** (success) |
| `cathedralScoured` | You walked the drowned nave | helpful | **Scour the Sunk Cathedral Nave** (success) |
| `railTimetable` | You found the lost departure | helpful | **Read the Stygian Rail’s Lost Timetable** (success) |
| `railPassage` | The Conductors stamped your ticket | helpful | **Win Passage from the Astral Conductors** (success) |
| `checkpointMercy` | You spared a name at the checkpoint | helpful | **Carry the Sealed Cargo Past the Checkpoint** (success) |
| `checkpointBetrayal` | You named someone at the checkpoint | hostile | **Carry the Sealed Cargo Past the Checkpoint** (failure) |
| `scholariumDebt` | The Scholarium holds a debt over you | hostile | **Carry the Sealed Cargo Past the Checkpoint** (failure) |
| Id | Kind | Subject | Opens when | Chapters |
| --- | --- | --- | --- | --- |
| `place-spire` | Places | The Great Clockwork Belfry | from the start | 3 (1 flag-gated) |
| `person-fenn` | People | Fenn, of the Guild | from the start | 2 |
| `place-archives` | Places | The Sunk Archives of the Doge's Palace | from the start | 3 (2 flag-gated) |
| `person-scribe` | People | The Chief Scribe | flag `ledgerTrusted` | 2 (1 flag-gated) |
| `faction-council` | Factions | The Council of Ten | resolving **Take the Ledger Job at the Customs House** | 3 (2 flag-gated) |
| `faction-scholarium` | Factions | The Scholarium | resolving **Carry the Sealed Cargo Past the Checkpoint** | 2 (1 flag-gated) |
| `place-salt-pans` | Places | The Abandoned Salt Pans | from the start | 3 (2 flag-gated) |
| `person-keeper` | People | The Last Keeper of the Pans | flag `pansLeased` | 2 (1 flag-gated) |
| `place-trench` | Places | The Leviathan Trench | from the start | 3 (1 flag-gated) |
| `event-drowning` | Events | The Drowning of Anno Domini 1502 | resolving **Take the Ledger Job at the Customs House** | 2 (1 flag-gated) |
| `place-salon` | Places | The Astronavigators' Salon | from the start | 3 (2 flag-gated) |
| `person-conductors` | People | The Masked Conductors | flag `railTimetable` | 2 (1 flag-gated) |
| `person-doge` | People | The Doge of the Drowned City | flag `brineFarmSigned` | 2 (1 flag-gated) |
| Subject | Chapter | Needs |
| --- | --- | --- |
| `place-spire` | Moved stone by stone | with its subject |
| `place-spire` | What the keepers are paid in | resolving **Adjust the Astronomical Chronometer** |
| `place-spire` | Why the pendulum drifts | flag `railTimetable` |
| `person-fenn` | The only name on the ladder | with its subject |
| `person-fenn` | The oil that was not paid for | resolving **Adjust the Astronomical Chronometer** |
| `place-archives` | The clerks in waders | with its subject |
| `place-archives` | The palace ruled vacant | flag `ledgerTrusted` |
| `place-archives` | Under the fourth step | flag `treatyRead` |
| `person-scribe` | The job as it is actually done | with its subject |
| `person-scribe` | The black ribbon | flag `councilRecords` |
| `faction-council` | How they take a decision | with its subject |
| `faction-council` | The checkpoint lists | flag `checkpointBetrayal` |
| `faction-council` | The line you left blank | flag `checkpointMercy` |
| `faction-scholarium` | What they ask in payment | with its subject |
| `faction-scholarium` | The mark you now carry | flag `scholariumDebt` |
| `place-salt-pans` | Abandoned in a single season | with its subject |
| `place-salt-pans` | The keeper who signed anyway | flag `pansLeased` |
| `place-salt-pans` | What the vent carries | flag `desaltinators` |
| `person-keeper` | The one condition | with its subject |
| `person-keeper` | The third tenant | flag `desaltinators` |
| `place-trench` | Glass domes and brass turbines | with its subject |
| `place-trench` | The nave that should not be here | resolving **Scour the Sunk Cathedral Nave** |
| `place-trench` | What the nursery is farming | flag `cathedralScoured` |
| `event-drowning` | A winter with no name | with its subject |
| `event-drowning` | The water is going down | flag `desaltinators` |
| `place-salon` | Routes that no longer exist | with its subject |
| `place-salon` | The Stygian Rail | flag `railTimetable` |
| `place-salon` | What the Rail is for | flag `railPassage` |
| `person-conductors` | Why the masks | with its subject |
| `person-conductors` | They knew your name | flag `railPassage` |
| `person-doge` | The winter of 1502 | with its subject |
| `person-doge` | The hand on the timetable | flag `railPassage` |
| Faction | Ally if you hold | Hostile if you hold |
| --- | --- | --- |
| The Council of Ten | `councilRecords` | `checkpointBetrayal` |
| The Scholarium | `cargoCarried`, `ledgerTrusted` | `scholariumDebt` |
| The Guild of Clocksmiths | `railTimetable` | — |
| The Tide Monarchs | `treatyRead` | — |

### Adding lore

Append an object to `loreEntries` in `lore.js`. Only `id`, `kind`, `title`,
`teaser`, `unlocks` and `chapters` are required; `realm`, `icon` and `lockedHint`
are optional. The harness in `tools/lore-check.js` will then verify that every
gate resolves, every chapter carries prose, and that nothing hidden leaks on a
fresh save.

## Run locally

Open the folder in a browser, or serve it with a small local server:

```bash
cd C:\Users\focas\source\salt-republic
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Development

Node 18 or newer is only needed for the checks and the harnesses; the game
itself has no runtime dependencies and no build step.

```bash
npm run check       # syntax check app.js and lore.js
npm test            # run every harness in tools/
npm run docs:lore   # regenerate the unlock tables in this file from lore.js
```

The harnesses live in `tools/` and write their output to `tools/out/`, which is
git-ignored. Each one loads `lore.js` before `app.js`, matching the order
`index.html` uses, so a save boot cannot fail on a missing lore binding.

## Notes

This is a prototype foundation. The next steps can include:

- wider world map and additional locations
- more card variants and unique story chains
- richer property and estate progression
- modular JSON-driven content for easier expansion
- richer art treatment and visual icons
