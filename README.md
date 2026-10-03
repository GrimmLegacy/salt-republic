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
- encounters declare when they happen: `when: 'day' | 'night' | { shift: 'dusk' }`, and the card says whether the hour is right
- the clock in Serenissima **is your own clock**. It is seeded from your machine the first time you open a chronicle, put in the year 1530, and then runs one to one with real time — including while the game is closed. Your Tuesday at 22:00 is the city's Tuesday at 22:00
- a shift is a named band of hours (`dawn`, `morning`, `midday`, `afternoon`, `dusk`, `first-watch`, `small-hours`), at least three hours wide. They are wide on purpose: with a clock that follows real time, a one-hour window is one hour a week
- a closed window always says when it reopens ("opens tonight at 21:00"), because with a real clock the only thing separating *I cannot* from *I cannot yet* is knowing the hour
- the calendar drawer browses months and seasons, opens a day sheet listing what that day holds, and lists what is **waiting on the hour** with the time it opens — which is what the line "weekly and dated events will be announced here" used to promise
- a night-only run of ten steps in the Belfry that goes one to ten and then starts again, resuming at the step it stopped on if the game is closed halfway
- repeatable night-only stories that pay a guild or a person rather than the power that governs the zone
- a card per faction body that unlocks from the deck at level 5 and another at level 15, so a standing curve is never a dead end
- a Materials section for stackable goods that are collected rather than worn
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

### Story threads and declared choices

The Lore page records what the city has proved about itself. The Chronicles page
records what **you** are building. The two are separate on purpose: one is
discovery, the other is construction.

A **thread** is an ongoing thing read as an ordered list of steps. The Brine-Farm
is step 1 to step 6, not six unrelated encounters scattered across two realms,
and the page collects them in the order they belong. Threads live in `threads.js`,
which `index.html` loads after `lore.js` and before `app.js`.

A thread keeps **no state of its own**. Every step names an encounter that
already exists, and the step's state is read back from that encounter's record in
`completedEvents`:

| Step state | Meaning |
| --- | --- |
| `done` | the encounter was resolved as a `Success` |
| `failed` | the encounter was attempted and failed; the step stays reopenable |
| `open` | the requirements are met and you can act on it now |
| `locked` | something is still missing. The path is still shown, never hidden |

### Two machines, and what "object after object" has to mean

There are three threads now. The Brine-Farm is a **lease**: you are given a place
that already exists and describe it in a document. The other two are
**constructions**, and they are built the same way on purpose:

| | The Deep Draft | The Escapement Wing |
| --- | --- | --- |
| what it is | a submersible | a clockwork wing |
| realm | Abyssal Depth, and the Grand Canal | Aether Heights, and the Salon |
| the parts come from | a wreck, a bench, a lens, a weigh-house | a room the guild stopped using |
| last step | a night descent, 00:00–05:00 | a night flight, 21:00–24:00 |

The chain is held together by a requirement type that had to be invented for it:

```js
requires: [{ type: 'item', item: 'draft-brass-spar' }]
```

`item` counts a piece in the satchet **or** already worn, and it names the encounter
that pays it when you do not have it yet — "not I cannot" but "not I cannot yet",
which is the difference between a gate and a wall. Both machines pay their parts
as `material: true`, so the parts go to the satchet instead of fighting over an
equipment slot, and both keep the last step on a `property`: four steps are about
objects, the fifth is about owning the finished thing.

Two rules the `story-check` harness enforces, because nothing else would notice
either:

- **the two machines share no parts.** If they did, "object after object" would
  quietly start applying to both vehicles at once.
- **they do not compete for the same night window.** One step per thread happens
  after dark, in a different shift. If they shared one, the two chains would each
  wait on the other.

### Runs: a chain that comes back around

A normal chain closes. Once the last step is done it stops offering work, which is
right for the Brine-Farm and wrong for a night shift that has to be done every
night. A **run** is a chain that returns to the top instead:

| Requirement | Meaning |
| --- | --- |
| `chainRun` | the step you name is the newest thing you did here, so it is this step's turn |
| `runEntry` | the run has not started yet, or it has reached the end, so this step opens |

Both read only the order of `completedEvents`, so a run saved halfway resumes at
the exact step it stopped on, with nothing to migrate and no counter to drift.
`tools/story-check.js` walks a whole run from step one to step ten and back,
rather than trusting that it would.

### Standing that belongs to nobody else

Working inside a zone makes you known to whoever governs it, which is the rule for
ordinary work. An encounter can instead name somebody else under
`success.standing`:

```js
success: { standing: { faction: 'iron-sister', points: 8, exclusive: true } }
```

Without `exclusive`, both accounts are paid: the zone's holder for the ground you
worked on, and the named body for the work itself. With it, only the named body is
paid. The flag exists because helping a guild that happens to stand inside
somebody else's territory is otherwise a quiet gift to that power, which is the
opposite of what "this body is in no rivalry with anyone" should mean.

A whole encounter can also stay out of every book with `noStanding: true`:

```js
noStanding: true,   // this work is entered in nobody's ledger
```

The night shifts use it. The four powers already have ordinary work every day, so
the belfry run pays experience, materials and ducats but no standing at all —
otherwise a night shift would quietly become the easiest way to farm a power.

### One calculation, two places

The line under **What this encounter can yield** and the reward granted when the
encounter passes come from the same function, `planStandingGrants`. They used to
be two separate calculations, and they disagreed: the card promised *The Council
of Ten +3, The Astronavigators −2* on an encounter that paid the Ledger, because
the preview had no idea the encounter had named somebody else. Anything that
splits them again has to fail `tools/story-check.js` first.

### Powers and other bodies

Four factions hold the four realms and are in rivalry with each other. Others do
not: a guild of assassins who trade in refusals, a network of canal children, and
one masked woman who has been holding a door shut since 1502. They declare
`rival: null` and no `principal`, and they live on the Chronicles under their own
heading rather than inside "the four powers", because the page should not tell the
player the city has seven powers when it has four.

The day has four more, and one of those pairs is a real choice:

| Body | Realm | Rival |
| --- | --- | --- |
| The Widow Duellist | Lagoon Heart | nobody |
| The Drowned Clergy | Aether Heights | **The Bohemian Court** |
| The Bohemian Court | Lagoon Heart | **The Drowned Clergy** |
| The Imperial Guard | Abyssal Depth | nobody |

Clergy and Court are the first pair in the catalogue where climbing one costs
the other, so the player ends up allied with one, the other, or neither. The
Guard is deliberately the third way: it takes orders from the Combine on
Tuesdays, from the church on nothing in particular and from whichever party
most recently laid claim to the Doge's chair, and has never been instructed by
all three at once. In this data model that is `rival: null` — it cannot be bought
and it is not bought.

**The throne is empty, and everybody is arguing about who gets to sit in it.**
The Doge went down into the lower chambers in 1502 and the Council has ruled the
palace vacant ever since. That vacancy is what the Clergy and the Court are
actually fighting over, and it is why their rivalry is about paperwork rather
than territory: the Church holds the register, a coronation that is not in the
register did not happen, and the Queen has been refused twice and knows that a
third request costs her the same nothing the second one did. Note that `monarchs`
was the original id here and it had to be renamed to `bohemian-court`: the
`loreFactions` table has carried a `monarchs` key since the Treaty of 1528,
where it means **the Tide Monarchs**, a drowned crown with no reputation curve.
Sharing the key would have shown two different names for one id — the standing
panel would read *The Tide Monarchs* while the reputation sheet read *The
Bohemian Court*, and any future `{type:'faction', id:'monarchs'}` gate would
have silently tested the treaty flag instead of the Court.

**A body is not a realm.** The four realms already have one power each, and that
is what `principal` marks. These seven sit inside the existing zones, which is why
their cards and their encounters are the way the player actually meets them.

Each body has two tide cards of its own: a common that joins the drawable pool at
level 5 and an uncommon at level 15. Note the shape differs from the four powers,
whose common cards are open from the first day and whose uncommon cards sit at
level 5 — the bodies start closed on both, so the first card is the reward for
having started the relationship at all.

```js
{
  id: 'uncommon-ledger-a-no-kept-exactly',
  rarity: 'uncommon',
  effects: { standing: { faction: 'black-ledger', points: 5 } },
  requires: [{ type: 'faction', faction: 'black-ledger', min: 15 }]
}
```

`tools/faction-check.js` opens each of the six on the exact level it declares and
on no level below, and checks that playing one moves that body's book and no
other. A card never pays a rival, so these cannot move a power's standing even by
accident.

One source of truth: an encounter cannot read as "resolved" in the chronicle and
"still open" in the thread, because there is only one place the answer lives.

A **decision** is the one thing a thread needs that an encounter cannot express.
An encounter rolls a die; a decision is *declared*. Flags are booleans, so they
can record "the Combine backed the farm" but not the difference between the
Combine backing it and the rows being leased out to the city. Decisions therefore
keep their answer in `state.player.decisions`, keyed by fork id:

```js
requires: { flags: ['brineFarmSigned'] },
options: [
  { id: 'sole',    title: 'Keep it in your own hands',  sets: { farmSoleKept: true },      /* ... */ },
  { id: 'combine', title: "Take the Combine's backing", sets: { farmCombineBacked: true }, /* ... */ },
  { id: 'open',    title: 'Open the rows to the city',  sets: { farmOpenToCity: true },    /* ... */ }
]
```

Every option writes **normal flags as well**, so the rest of the game only ever
needs a flag and already knows how to read one. Decisions are final: declaring a
second answer for the same fork is refused, because a choice you can take back is
not the story of a farm, it is a menu. `sanitizeStoryDecisions()` drops anything
the catalogue does not declare, so a hand-edited save cannot invent a fork or
push one to "resolved" with an option that does not exist.

A fork opens when its `requires` flags are set -- for the Brine-Farm, when the
lease is signed, *before* every step is done. You choose while the farm is still
empty, which is the only moment the choice is actually a choice. A shut fork
shows its own `shutHint` and never an excerpt of its `prompt`: the prompt talks
about a farm that is already yours, so reusing it as a preview would promise the
player something that has not happened yet.

### What a decision opens

A decision that only writes a flag changes nothing the player can actually do, so
every option is read back by the game as an ordinary gate. `app.js` grew a `flag`
requirement for it: the same type `lore.js` already used for lore gates, reading
the same field (`id`), so a fork and a lore entry do not need two grammars to say
the same thing.

```js
requires: [{ type: 'flag', id: 'farmSoleKept' }]
```

Each branch of the Brine-Farm opens exactly one repeatable encounter in
`leviathan-trench` and one uncommon tide card, and leaves the other two shut. The
three are deliberately not interchangeable -- if they shared an hour, a test and a
handout, the choice would be a label over one encounter:

| Option | Repeated work | Hour | Test | Pays |
| --- | --- | --- | --- | --- |
| `farmSoleKept` | Work the Rows Alone at the Turn of the Tide | any | Resolve | 1 phosphor amber, 1 ducat |
| `farmCombineBacked` | Deliver the Combine's Quota to the Weigh-House | night | Persuasion | 3 ducats |
| `farmOpenToCity` | Collect the Row Rents at the Customs House | day | Cunning | 2 ducats |

Encounters always pay faction standing on top, from the realm they happen in.
The three uncommon cards (`storyCards` in `app.js`) are gated the same way and are
the only ones that can disagree with that: they give standing to a faction only
where there is somebody to please. Keeping the farm in your own hands raises
nobody's opinion of you, because there is nobody left to convince.

### Art that belongs to the data

Two screens take their background from data rather than from a stylesheet rule:

- a thread may declare `art`, and `renderChronicles()` puts it on the panel as
  `--story-thread-art`. A thread without one keeps the plain panel background, so
  adding a thread still needs no CSS.
- the date card in the left sidebar shows `CLOCK_SKY.day` or `CLOCK_SKY.night`
  depending on `clock.isDay`, and takes an `is-day` / `is-night` class so the hour
  badge stops being a night badge at noon.

`tools/assets-check.js` checks both against the disk, so a renamed or missing
picture fails a check instead of showing an empty box.

#### One picture belongs to one thing

No card or encounter ever borrows another's picture. Until a piece of the world
has an image of its own it shows `immagini/default.jpg`, declared once as
`DEFAULT_ART` and used by encounter thumbnails, card faces, the card that turns
over in the draw window, the card you play, and story thread panels. The default
is checked against the disk like any other reference: a default that went missing
would turn every honest gap into a broken image.

New art goes in `immagini/carte/`, named after the card or encounter title, and
the object gets a matching `image:` line. Reference and file are one edit, and
`tools/assets-check.js` checks every one of them against the disk on the next run.

### What unlocks what

Regenerate these tables from the source with `node tools/update-lore-docs.js`, so
they cannot drift away from the gates the game actually uses.

<!-- FLAGS:START -->
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
| `farmSoleKept` | The Brine-Farm answers to you alone | helpful | **How the farm is run** (choosing *Keep it in your own hands*) |
| `farmCombineBacked` | The Combine bankrolls your Brine-Farm | helpful | **How the farm is run** (choosing *Take the Combine's backing*) |
| `farmOpenToCity` | The Brine-Farm is leased row by row | helpful | **How the farm is run** (choosing *Open the rows to the city*) |
| `deepdraftSigned` | A hull is signed in your name | helpful | **Get the Hull Signed Before the Council of Ten** (success) |
| `deepdraftFirstDive` | You went down in the Deep Draft | helpful | **Take Her Down at Night** (success) |
| `draftManifestSurvey` | The Deep Draft carries a Survey licence | helpful | **What the manifest says she carries** (choosing *Survey only — and file every reading*) |
| `draftManifestFreight` | The Deep Draft carries whatever is paid for | helpful | **What the manifest says she carries** (choosing *Freight for whoever is paying*) |
| `draftManifestQuiet` | The Deep Draft carries nothing but yours | helpful | **What the manifest says she carries** (choosing *Nobody's cargo — yours alone*) |
| `wingRegistered` | The Wing is signed in your name | helpful | **Register the Wing Before the Foreman** (success) |
| `wingFirstFlight` | You flew the Wing over the lagoon | helpful | **Fly It Over the Lagoon After Dark** (success) |
| `wingPurposeCharts` | The Wing flies for the Survey charts | helpful | **What hour you intend to be over the water** (choosing *Dawn — to re-draw the Survey charts from the air*) |
| `wingPurposeGuild` | The Wing carries the guild's business | helpful | **What hour you intend to be over the water** (choosing *Dusk — to carry what the guild has no ground for*) |
| `wingPurposeRats` | The Wing flies the rope-lines at night | helpful | **What hour you intend to be over the water** (choosing *The small hours — over the rope-lines, where nobody looks up*) |
<!-- FLAGS:END -->
<!-- LORE:START -->
| Id | Kind | Subject | Opens when | Chapters |
| --- | --- | --- | --- | --- |
| `place-spire` | Places | The Great Clockwork Belfry | from the start | 3 (1 flag-gated) |
| `person-fenn` | People | Fenn, of the Guild | from the start | 2 |
| `place-archives` | Places | The Sunk Archives of the Doge's Palace | from the start | 3 (2 flag-gated) |
| `person-scribe` | People | The Chief Scribe | flag `ledgerTrusted` | 2 (1 flag-gated) |
| `faction-council` | Factions | The Council of Ten | resolving **Take the Ledger Job at the Customs House** | 3 (2 flag-gated) |
| `faction-scholarium` | Factions | The Scholarium | resolving **Carry the Sealed Cargo Past the Checkpoint** | 2 (1 flag-gated) |
| `faction-black-ledger` | Factions | The Black Ledger | resolving **Carry the Refusal Back to the Second Book** | 2 |
| `faction-salt-rats` | Factions | The Salt Rats | resolving **Run the Word Along the Rope-Line** | 2 |
| `person-iron-sister` | People | The Iron Sister | resolving **sister-take-the-cold-door-shift** | 3 |
| `person-widow-duellist` | People | The Widow Duellist | resolving **Be Put on the Card** | 2 |
| `faction-clergy` | Factions | The Drowned Clergy | resolving **Carry the Bell Book Up the Stair** | 2 |
| `faction-bohemian-court` | Factions | The Bohemian Court | resolving **Stand in the Long Room Until You Are Fed** | 2 |
| `faction-imperial-guard` | Factions | The Imperial Guard | resolving **Take a Reading Where the Current Moves** | 2 |
| `place-deep-draft` | Places | The Deep Draft | flag `deepdraftSigned` | 2 (1 flag-gated) |
| `faction-weigh-house` | Factions | The Weigh-House | item | 2 (1 flag-gated) |
| `place-reject-room` | Places | The Reject Room | resolving **Take an Escapement Out of the Reject Room** | 2 (1 flag-gated) |
| `place-escapement-wing` | Places | The Escapement Wing | flag `wingRegistered` | 2 (1 flag-gated) |
| `place-salt-pans` | Places | The Abandoned Salt Pans | from the start | 3 (2 flag-gated) |
| `person-keeper` | People | The Last Keeper of the Pans | flag `pansLeased` | 2 (1 flag-gated) |
| `place-trench` | Places | The Leviathan Trench | from the start | 3 (1 flag-gated) |
| `event-drowning` | Events | The Drowning of Anno Domini 1502 | resolving **Take the Ledger Job at the Customs House** | 2 (1 flag-gated) |
| `place-salon` | Places | The Astronavigators' Salon | from the start | 3 (2 flag-gated) |
| `person-conductors` | People | The Masked Conductors | flag `railTimetable` | 2 (1 flag-gated) |
| `person-doge` | People | The Doge of the Drowned City | flag `brineFarmSigned` | 2 (1 flag-gated) |
<!-- LORE:END -->
<!-- CHAPTERS:START -->
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
| `faction-black-ledger` | The second book | with its subject |
| `faction-black-ledger` | What a refusal is worth | with its subject |
| `faction-salt-rats` | What a washing line is for | with its subject |
| `faction-salt-rats` | What they refuse to have | with its subject |
| `person-iron-sister` | What the iron is for | with its subject |
| `person-iron-sister` | The door she does not open | with its subject |
| `person-iron-sister` | The rota from 1502 | resolving **sister-take-the-cold-door-shift** |
| `person-widow-duellist` | The only licensed blade | with its subject |
| `person-widow-duellist` | Disputes nobody will take | with its subject |
| `faction-clergy` | What an office is | with its subject |
| `faction-clergy` | The twice-refused throne | with its subject |
| `faction-bohemian-court` | Eleven people, two years | with its subject |
| `faction-bohemian-court` | Fourteen plates | with its subject |
| `faction-imperial-guard` | Orders, and the days they arrive on | with its subject |
| `faction-imperial-guard` | Why two reports | with its subject |
| `place-deep-draft` | Why a boat is not a farm | with its subject |
| `place-deep-draft` | What is at the bottom of the charts | flag `deepdraftFirstDive` |
| `faction-weigh-house` | The only question he asks | with its subject |
| `faction-weigh-house` | Entered under amber | flag `deepdraftSigned` |
| `place-reject-room` | Not full of broken clocks | with its subject |
| `place-reject-room` | The one that runs | flag `wingRegistered` |
| `place-escapement-wing` | The guild does not give machines away | with its subject |
| `place-escapement-wing` | Why the keeper counts six | flag `wingFirstFlight` |
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
<!-- CHAPTERS:END -->
<!-- STANDING:START -->
| Faction | Ally if you hold | Hostile if you hold |
| --- | --- | --- |
| The Council of Ten | `councilRecords` | `checkpointBetrayal` |
| The Scholarium | `cargoCarried`, `ledgerTrusted` | `scholariumDebt` |
| The Guild of Clocksmiths | `railTimetable` | — |
| The Tide Monarchs | `treatyRead` | — |
<!-- STANDING:END -->

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
npm run check       # syntax check app.js, lore.js and threads.js
npm test            # run every harness in tools/
npm run docs:lore   # regenerate the unlock tables in this file from lore.js
```

The harnesses live in `tools/` and write their output to `tools/out/`, which is
git-ignored. They load the game through `tools/harness.js`, which owns the single
`GAME_SOURCES` list mirroring the order `index.html` uses. A harness must never
build its own file list: when a new data file is added to the page, it has to be
added in one place, not remembered in a dozen.

A single harness can be run on its own, for instance `node tools/story-check.js`
for the story threads and decisions.

## Notes

This is a prototype foundation. The next steps can include:

- wider world map and additional locations
- more card variants and unique story chains
- richer property and estate progression
- modular JSON-driven content for easier expansion
- richer art treatment and visual icons
