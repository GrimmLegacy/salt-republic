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

## Notes

This is a prototype foundation. The next steps can include:

- wider world map and additional locations
- more card variants and unique story chains
- richer property and estate progression
- modular JSON-driven content for easier expansion
- richer art treatment and visual icons
