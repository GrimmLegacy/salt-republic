# The Salt Republic

A prototype for a text-heavy narrative game inspired by the tone and structure of decadent, atmospheric story worlds, but built around an original setting and rules.

## Included prototype features

- vertical left sidebar navigation
- narrative locations with repeated daily actions
- stat-based challenge resolution
- an in-game resolution window with a rolling d100, suspense beat and the full outcome ledger (stats, XP, level ups, resources, afflictions, properties, chance drops)
- an affliction card is drawn at random from the tide deck and never replaces what you were saving
- playing an affliction card spends it: it leaves the hand on every use, so an affliction lasting several levels has to be fought one draw at a time
- an affliction card also leaves the hand the moment its malus is gone, cleared by a tide card or by anything else
- if an affliction grows after its card was spent, the card can be drawn again: a new affliction is a new matter
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
- optional online accounts (email/password and Google) with a Supabase-backed save, so a chronicle follows the player across devices; the game stays fully playable as a guest, and the account layer degrades to plain local play if it is not configured
- choice log kept in the UI
- readable, low-strain visual styling for story-heavy play

## Account online

Accounts are opt-in and the game never requires one: a guest plays exactly as
before, with the save in `localStorage`. Signing in adds an online copy of the
same save, so a chronicle follows the player between devices. Nothing else
changes: the local save stays the source of truth for a move, and the cloud is
a backup written a few seconds later. If Supabase is unreachable, or the
credentials below are left empty, `auth.enabled` stays false and every account
control quietly disappears. No error, no dead button.

### One-time setup

1. Create a project at [supabase.com](https://supabase.com) (the free tier is
   more than enough).
2. Open **SQL Editor**, paste the whole of `supabase-schema.sql`, and run it.
   This creates the `saves` table plus its Row Level Security policies.
3. Go to **Project Settings > API Keys** and copy the **Project URL** and the
   **Publishable key** (the one starting with `sb_publishable_`).
4. Open `auth.js` and fill in the two placeholders at the top:

   ```js
   const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   const SUPABASE_KEY = 'sb_publishable_...';
   ```

   Use the **publishable** key, never the secret ones. There are three kinds of
   key on that page and only one belongs in a browser:

   | Key | Prefix | Where it may go |
   | --- | --- | --- |
   | Publishable | `sb_publishable_` | in the browser, this is the one you want |
   | Anon (legacy) | `eyJ...` | in the browser, works the same way |
   | Secret / service_role | `sb_secret_`, `eyJ...` | **server only, never in a page** |

   The browser keys are public by design and this is not a mistake: what
   protects the data are the RLS policies in `supabase-schema.sql`, which limit
   every row to the account that owns it. A secret key in `auth.js` would hand
   the whole database to anyone who opens the page source.
5. Redeploy. The account panel is now on the **Profile** page.

### Login with Google

Email and password works as soon as step 4 is done. Google needs one extra step
on Google's side, because the consent screen has to know who is asking:

1. In the Google Cloud console, create a project and configure the OAuth
   consent screen (add a logo and app name while you are there, it is what the
   player sees in the popup).
2. Create an OAuth client of type **Web application** and add your redirect
   URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
3. In Supabase, go to **Authentication > Providers > Google**, paste the
   client id and client secret, and enable it.
4. Add the site's URL to **Authentication > URL Configuration > Redirect URLs**
   so the game can come back from Google.

### Notes on the design

- **Why the login is optional.** A text RPG that asks for an account before it
  shows you anything loses most of its audience at the door. Guest play is the
  default and the account is an upgrade, never a gate.
- **Conflicts.** `state.savedAt` is stamped inside `saveGame`, so every save
  path carries a timestamp. On login the local and remote saves are compared by
  time and the newer one wins, which stops two devices from overwriting each
  other in a loop.
- **Why saves are debounced.** `saveGame` runs on every game action; uploading
  each one would be a network request per move. `queueCloudSave` collapses
  bursts into a single write every 5 seconds with the latest state.
- **Why `state` is not fully re-validated when pulled from the cloud.** It went
  through `loadSave` before being stored, and `loadSave` sanitises every field
  on the way in and out, so a restored save is re-sanitised on the next boot.


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
