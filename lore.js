// ---------------------------------------------------------------------------
// THE LORE OF THE DROWNED SERENISSIMA
//
// Loaded before app.js. Kept in its own file because it is the largest body of
// prose in the project and will keep growing.
//
// Every entry is a "vessel": a locked box that fills up as the player proves
// things. `unlocks` decides when the entry surfaces at all; each
// `chapters[].requires` reveals the history one piece at a time, so a place you
// have only just walked into shows its surface and keeps its past shut.
//
// Branching lives in flags. An encounter's `sets` writes flags, and lore gates
// and future encounters read them with { type: 'flag' }. That is how two
// players end a chronicle as allies of the Council or marked in its book.
// ---------------------------------------------------------------------------

const loreFlags = {
  ledgerTrusted: { label: 'The customs house trusts you', tone: 'good' },
  cargoCarried: { label: 'You carried the Scholarium crate', tone: 'good' },
  pansLeased: { label: 'You lease the abandoned salt pans', tone: 'good' },
  brineFarmSigned: { label: 'The Brine-Farm lease is yours', tone: 'good' },
  treatyRead: { label: 'You read the Treaty of 1528', tone: 'good' },
  councilRecords: { label: 'You hold Council of Ten records', tone: 'good' },
  desaltinators: { label: 'The cold vents feed your farm', tone: 'good' },
  cathedralScoured: { label: 'You walked the drowned nave', tone: 'good' },
  railTimetable: { label: 'You found the lost departure', tone: 'good' },
  railPassage: { label: 'The Conductors stamped your ticket', tone: 'good' },
  checkpointMercy: { label: 'You spared a name at the checkpoint', tone: 'good' },
  checkpointBetrayal: { label: 'You named someone at the checkpoint', tone: 'bad' },
  scholariumDebt: { label: 'The Scholarium holds a debt over you', tone: 'bad' },
  // I tre esiti del bivio sulla fattoria. Sono flag come gli altri, non un
  // sistema a parte: e' il bivio a scrivere qui, e tutto il resto del gioco
  // continua a leggerli come qualsiasi altro flag.
  farmSoleKept: { label: 'The Brine-Farm answers to you alone', tone: 'good' },
  farmCombineBacked: { label: 'The Combine bankrolls your Brine-Farm', tone: 'neutral' },
  farmOpenToCity: { label: 'The Brine-Farm is leased row by row', tone: 'neutral' },
  // Il Deep Draft. Tre flag per tre cose diverse: la firma, la prima discesa, e il
  // manifesto. Il manifesto e' un bivio e non un traguardo, quindi i suoi tre esiti
  // sono tre flag separati e non uno solo: "che cosa trasporta" e' una domanda a
  // tre vie esattamente come "come e' gestita la fattoria".
  deepdraftSigned: { label: 'A hull is signed in your name', tone: 'good' },
  deepdraftFirstDive: { label: 'You went down in the Deep Draft', tone: 'good' },
  draftManifestSurvey: { label: 'The Deep Draft carries a Survey licence', tone: 'neutral' },
  draftManifestFreight: { label: 'The Deep Draft carries whatever is paid for', tone: 'neutral' },
  draftManifestQuiet: { label: 'The Deep Draft carries nothing but yours', tone: 'neutral' },
  // L'Escapement Wing. Come il sottomarino: la firma, la prima notte, e un
  // manifesto a tre vie. Le tre vie del Wing pero' sono tre ore diverse della
  // giornata, e non tre merci diverse: e' l'unico bivio dei due in cui la
  // risposta e' quando, non cosa.
  wingRegistered: { label: 'The Wing is signed in your name', tone: 'good' },
  wingFirstFlight: { label: 'You flew the Wing over the lagoon', tone: 'good' },
  wingPurposeCharts: { label: 'The Wing flies for the Survey charts', tone: 'neutral' },
  wingPurposeGuild: { label: 'The Wing carries the guild\'s business', tone: 'neutral' },
  wingPurposeRats: { label: 'The Wing flies the rope-lines at night', tone: 'neutral' }
};

const loreKinds = {
  place: { label: 'Places', icon: '\u2767' },
  person: { label: 'People', icon: '\u2766' },
  faction: { label: 'Factions', icon: '\u2726' },
  event: { label: 'Events', icon: '\u2756' }
};

const loreFactions = {
  council: { name: 'The Council of Ten', sigil: '\u2726' },
  scholarium: { name: 'The Scholarium', sigil: '\u2756' },
  clocksmiths: { name: 'The Guild of Clocksmiths', sigil: '\u2727' },
  monarchs: { name: 'The Tide Monarchs', sigil: '\u263e' }
};

const LORE_STANDING_FRIENDLY = {
  council: ['councilRecords'],
  scholarium: ['cargoCarried', 'ledgerTrusted'],
  clocksmiths: ['railTimetable'],
  monarchs: ['treatyRead']
};

const LORE_STANDING_HOSTILE = {
  council: ['checkpointBetrayal'],
  scholarium: ['scholariumDebt'],
  clocksmiths: [],
  monarchs: []
};

function getFactionStanding(factionId) {
  const anyFlag = (list) => (list || []).some((flag) => Boolean(state.player.flags?.[flag]));
  const isFriend = anyFlag(LORE_STANDING_FRIENDLY[factionId]);
  const isEnemy = anyFlag(LORE_STANDING_HOSTILE[factionId]);
  if (isFriend && isEnemy) return 'contested';
  if (isFriend) return 'ally';
  if (isEnemy) return 'enemy';
  return 'unknown';
}

// Lore entries. `unlocks` is the vessel gate; `chapters[].requires` reveals the
// history progressively. Text is written in the past tense: the player is
// reading a record, not hearing a narrator.
const loreEntries = [
  {
    id: 'place-spire',
    kind: 'place',
    realm: 'aether-heights',
    title: 'The Great Clockwork Belfry',
    icon: '⛭',
    teaser: 'A tower that keeps the hour for a city the sea has already taken.',
    unlocks: [{ type: 'always' }],
    chapters: [
      {
      id: 'moved',
      title: 'Moved stone by stone',
      requires: [{ type: 'always' }],
      text: 'San Marco did not always stand in the lagoon. It was carried up onto higher ground piece by piece, and the men who did the moving are buried under the foundations they raised. The bell tower went up last, and highest, and it has kept the hours ever since without once being told to.'
      },
      {
      id: 'whale-oil',
      title: 'What the keepers are paid in',
      requires: [{ type: 'event', id: 'adjust-chronometer' }],
      text: 'The Guild of Clocksmiths will not touch the escapement with anything but whale oil, and they will not say where the whales are. A keeper who asks is told that the oil is the price of the hour, and the hour is worth more than the asking.'
      },
      {
      id: 'drifting',
      title: 'Why the pendulum drifts',
      requires: [{ type: 'flag', id: 'railTimetable' }],
      text: 'The belfry has never once kept time with the stars, only with the tide. With the lost departure in hand the drift becomes legible: the pendulum is not broken, it is answering something the Astronavigators charted three hundred years ago, and it is waiting for the train.'
      }
    ]
  },
  {
    id: 'person-fenn',
    kind: 'person',
    realm: 'aether-heights',
    title: 'Fenn, of the Guild',
    icon: '✧',
    teaser: 'The keeper who oils the escapement, and answers no questions.',
    unlocks: [{ type: 'always' }],
    chapters: [
      {
      id: 'only-name',
      title: 'The only name on the ladder',
      requires: [{ type: 'always' }],
      text: 'Fenn has been the only keeper on the ladder for nineteen years. There is no roster. Asked about it, Fenn says the Guild sends whoever is needed and that this year it sent them. It is not a satisfying answer, and Fenn knows it.'
      },
      {
      id: 'unasked',
      title: 'The oil that was not paid for',
      requires: [{ type: 'event', id: 'adjust-chronometer' }],
      text: 'Fenn watched you work the catwalk and offered no hand to steady you. Afterwards they handed down oil without being asked, and would not take coin. "The hour is not yours to sell," they said, "but it is yours to keep." Nobody in the Guild has said anything like that in a decade.'
      }
    ]
  },
  {
    id: 'place-archives',
    kind: 'place',
    realm: 'lagoon-heart',
    title: 'The Sunk Archives of the Doge\'s Palace',
    icon: '❧',
    teaser: 'Water in the reading room, and every record still in its place.',
    unlocks: [{ type: 'always' }],
    chapters: [
      {
      id: 'waders',
      title: 'The clerks in waders',
      requires: [{ type: 'always' }],
      text: 'The water reached the fourth step in Anno Domini 1494 and has risen a finger-width a year since. The Doge ordered the clerks to keep transcribing rather than evacuate, because a city that stops writing its own history will be told its history by somebody else. They have been standing in the water ever since. The records are immaculate.'
      },
      {
      id: 'vacant',
      title: 'The palace ruled vacant',
      requires: [{ type: 'flag', id: 'ledgerTrusted' }],
      text: 'The Doge went down into the lower chambers in the winter of 1502 and was not seen again. The Council has ruled the palace vacant for twenty-eight years. The clerks still file a daily report to a desk no one sits at, because the alternative was to stop filing, and nobody told them that was one of the options.'
      },
      {
      id: 'fourth-step',
      title: 'Under the fourth step',
      requires: [{ type: 'flag', id: 'treatyRead' }],
      text: 'The Treaty of 1528 describes a chamber beneath the fourth step of the Doge\'s stair, and it describes it in the passive voice, as one describes a thing that was already there. The water above it is warm. It has never frozen, in a winter when the lagoon froze twice.'
      }
    ]
  },
  {
    id: 'person-scribe',
    kind: 'person',
    realm: 'lagoon-heart',
    title: 'The Chief Scribe',
    icon: '✒',
    teaser: 'They decide which records exist, and at what price.',
    unlocks: [{ type: 'flag', id: 'ledgerTrusted' }],
    lockedHint: 'The archive has not noticed you yet.',
    chapters: [
      {
      id: 'weighed',
      title: 'The job as it is actually done',
      requires: [{ type: 'always' }],
      text: 'The Chief Scribe does not keep the archive. They decide what the archive is allowed to be. Every page is weighed before filing, and pages that do not balance are destroyed quietly, at the tide, in the room at the back that has no window and no number.'
      },
      {
      id: 'ribbon',
      title: 'The black ribbon',
      requires: [{ type: 'flag', id: 'councilRecords' }],
      text: 'The records you now hold are sealed with black ribbon, which is not a colour but an instruction: this page was struck from the record by order of the Council of Ten. The Scribe will sell you another eventually. They will not sell this one back, and they will not say why they remembered your face.'
      }
    ]
  },
  {
    id: 'faction-council',
    kind: 'faction',
    realm: 'lagoon-heart',
    title: 'The Council of Ten',
    icon: '✦',
    teaser: 'Ten sealed voices. Nobody signs anything.',
    unlocks: [{ type: 'event', id: 'take-ledger-job' }],
    lockedHint: 'You have no standing with the Council, and none is offered to strangers.',
    chapters: [
      {
      id: 'four-voices',
      title: 'How they take a decision',
      requires: [{ type: 'always' }],
      text: 'Ten members, ten votes, and no minutes. A decision becomes real the moment four voices agree, which is how the Council ruled a palace vacant without ever stating that it had. They have never needed to explain a thing that four people already agree on.'
      },
      {
      id: 'checkpoint-list',
      title: 'The checkpoint lists',
      requires: [{ type: 'flag', id: 'checkpointBetrayal' }],
      text: 'You named someone at the drowned checkpoint, and the name you gave went into the list the Council reaches for when it needs a person to be guilty of something. There is no procedure for removing a name. Names are added, and then names are used.'
      },
      {
      id: 'blank-line',
      title: 'The line you left blank',
      requires: [{ type: 'flag', id: 'checkpointMercy' }],
      text: 'You carried the crate through and wrote nothing down. The Council knows, because the checkpoint clerks report every blank line. You are not in their favour. But for this season you are not in their book either, and in this city that is as close to safety as anyone gets.'
      }
    ]
  },
  {
    id: 'faction-scholarium',
    kind: 'faction',
    realm: 'lagoon-heart',
    title: 'The Scholarium',
    icon: '❖',
    teaser: 'They buy a name at any price. They hold a great many.',
    unlocks: [{ type: 'event', id: 'carry-sealed-cargo' }],
    lockedHint: 'You have not carried anything for the Scholarium yet.',
    chapters: [
      {
      id: 'names',
      title: 'What they ask in payment',
      requires: [{ type: 'always' }],
      text: 'The Scholarium deals in names, not souls as the dockside stories insist. A name placed in their record is authority for as long as the record holds, and they will extend that authority to you in exchange for a name you would rather not give up. The crate you carried had no manifest and a seal out of the Scholarium: somebody paid them in advance.'
      },
      {
      id: 'debt',
      title: 'The mark you now carry',
      requires: [{ type: 'flag', id: 'scholariumDebt' }],
      text: 'The crate reached the far side with a mark on it that was not there before. That mark is theirs. It does not hurt and it does not tire you, and the Scholarium does not need it to. The full meaning of the mark sits in a chapter of this record you have not yet earned.'
      }
    ]
  },
  // ---- I corpi che non presidiano nessun reame -----------------------------
  //
  // Non hanno una zona tutta loro e non sono in gara con nessuno: si trovano
  // dentro quelle delle altre, guardando sotto. Le due gilde sono societa' che
  // non chiedono permesso a nessuno; la terza e' una persona sola, con un conto
  // aperto dal 1502 che non ha mai chiuso.
  {
    id: 'faction-black-ledger',
    kind: 'faction',
    realm: 'lagoon-heart',
    title: 'The Black Ledger',
    icon: '✂',
    teaser: 'They keep the book of what was agreed instead of what was signed.',
    unlocks: [{ type: 'event', id: 'ledger-carry-the-refusal' }],
    lockedHint: 'You have not carried anything for them yet.',
    chapters: [
      {
      id: 'second-book',
      title: 'The second book',
      requires: [{ type: 'always' }],
      text: 'A drowned archive is not short of paper. It is short of paper anybody can produce. The Council of Ten strikes what does not suit them and keeps the struck pages in a different building, and the Black Ledger is what survives when the striking is done and nobody wants to be seen holding the result. They are not a syndicate so much as a filing habit with a knife in it.'
      },
      {
      id: 'refusals',
      title: 'What a refusal is worth',
      requires: [{ type: 'always' }],
      text: 'They will pay you to be refused. A signature can be bought from the person who gives it; a refusal cannot be sold without somebody being willing to be caught holding the other end of it. So they send people out to be told no, and they bring the no back word for word, and the accuracy is the entire product. Do not improve on the wording. An embellished no is worth less than a plain one, and they have lost money finding that out.'
      }
    ]
  },
  {
    id: 'faction-salt-rats',
    kind: 'faction',
    realm: 'lagoon-heart',
    title: 'The Salt Rats',
    icon: '⚓',
    teaser: 'Nobody elected them. Everybody consults them.',
    unlocks: [{ type: 'event', id: 'rats-run-the-word-along-the-rope' }],
    lockedHint: 'You have not run anything for them yet.',
    chapters: [
      {
      id: 'lines',
      title: 'What a washing line is for',
      requires: [{ type: 'always' }],
      text: 'After dark the laundresses hang their lines across the canal and leave them up until the water drops. Every one of those lines is a road. Messages go along them at the speed of somebody carrying a basket, they cost nothing, and no courier in the lagoon can beat them because the couriers have to go where the water is. The children know this and the adults have worked it out, in that order, which is the only sensible way round.'
      },
      {
      id: 'no-council',
      title: 'What they refuse to have',
      requires: [{ type: 'always' }],
      text: 'No membership, no charter, no minutes, no elected anything. Consultation was how it started, and by the time anyone thought to write down what they were doing it was too late to write down anything else. The adults have begun giving them titles, which is what adults do when they have already lost an argument and want a word for it.'
      }
    ]
  },
  {
    id: 'person-iron-sister',
    kind: 'person',
    realm: 'abyssal-depth',
    title: 'The Iron Sister',
    icon: '⛓',
    teaser: 'She was keeping the nursery before there was a farm to keep.',
    unlocks: [{ type: 'event', id: 'sister-take-the-cold-door-shift' }],
    lockedHint: 'You have not held a shift for her.',
    chapters: [
      {
      id: 'mask',
      title: 'What the iron is for',
      requires: [{ type: 'always' }],
      text: 'The mask is riveted, not hinged, and it covers the whole face. Under it, long brown curls that the salt has never managed to take. Her voice arrives through the metal rather than from behind it, so nobody has heard her laugh in four hundred years and nobody can tell you what it sounded like. She answers exactly what was asked. She has never once answered the question underneath, and the nursery runs better for it than any explanation would have.'
      },
      {
      id: 'cold-door',
      title: 'The door she does not open',
      requires: [{ type: 'always' }],
      text: 'There is a warm pipe behind the cold door and she has stood next to it for four centuries and has never opened it. When the frost on the sill is right you write the number down and go away, and when it is not right you write the number down and go away anyway, because that was never the part she was measuring. She has told you a temperature. She has never told you what the door is for, and the two facts have never once seemed inconsistent to her.'
      },
      {
      id: 'rota',
      title: 'The rota from 1502',
      requires: [{ type: 'event', id: 'sister-take-the-cold-door-shift' }],
      text: 'The same rota has kept the nursery running since the year the water came, without a missed night and without anyone above her ever asking where it came from. The Combine built an entire operation on top of that rota and has no idea it is four centuries old. She does not correct this. Being mistaken for the Combine would be a worse accident than the cold.'
      }
    ]
  },
  {
    id: 'person-widow-duellist',
    kind: 'person',
    realm: 'lagoon-heart',
    title: 'The Widow Duellist',
    icon: '⚔',
    teaser: 'She buried a husband and kept his name, and his debts, and his blade.',
    unlocks: [{ type: 'event', id: 'duellist-be-put-on-the-card' }],
    lockedHint: 'Nobody has put your name on a card yet.',
    chapters: [
      {
      id: 'the-licence',
      title: 'The only licensed blade',
      requires: [{ type: 'always' }],
      text: 'The lagoon licenses exactly one duelling blade and has licensed the same one for thirty years. It is hers, in the sense that nobody has replaced it. When the watch closes a street, that licence is what makes a blade lawful to carry at all, which is a fact she has never once raised and which everybody in the Lagoon Heart has worked out on their own.'
      },
      {
      id: 'the-floor',
      title: 'Disputes nobody will take',
      requires: [{ type: 'always' }],
      text: 'Claims too small for a magistrate and too large to lose are settled on her floor, because a verdict delivered by a blade is at least impossible to buy. She talks through every one of them, continuously, and the talking is not commentary. She believes she is explaining. Nobody has ever corrected her and she has never noticed that nobody has.'
      }
    ]
  },
  {
    id: 'faction-clergy',
    kind: 'faction',
    realm: 'aether-heights',
    title: 'The Drowned Clergy',
    icon: '✝',
    teaser: 'The throne is empty. The register is not.',
    unlocks: [{ type: 'event', id: 'clergy-carry-the-bell-book' }],
    lockedHint: 'You have not carried the bell book up.',
    chapters: [
      {
      id: 'the-office',
      title: 'What an office is',
      requires: [{ type: 'always' }],
      text: 'A burial is a document. The clergy write them, they keep them, and the copy in their book settles estates, ends claims and moves property. It is not signed by the court and it is not appealed, and the reason for that arrangement is four hundred years old and nobody alive can give you the reason.'
      },
      {
      id: 'the-refusal',
      title: 'The twice-refused throne',
      requires: [{ type: 'always' }],
      text: 'They have refused to crown the Bohemian Court twice. Both refusals are written, both are binding, and the Court has paid for the privilege of asking a third time without ever being answered. It cannot do anything else: a coronation that is not in their book did not happen, whatever is sat in the Doge\'s chair, and there has been nothing in the Doge\'s chair for twenty-eight years. The church does not explain itself and does not need to.'
      }
    ]
  },
  {
    id: 'faction-bohemian-court',
    kind: 'faction',
    realm: 'lagoon-heart',
    title: 'The Bohemian Court',
    icon: '♛',
    teaser: 'She is not beautiful. She is expensive.',
    unlocks: [{ type: 'event', id: 'monarchs-stand-in-the-long-room' }],
    lockedHint: 'You have not been let past the long room.',
    chapters: [
      {
      id: 'eleven-people',
      title: 'Eleven people, two years',
      requires: [{ type: 'always' }],
      text: 'She arrived with a court of eleven and had eleven thousand within two years, which is the only measurable thing about her. Everything she wants becomes law in four days. Nothing has ever been bought from her, because what she does is arrange for you to want to give it before she has finished asking, and a gift given early is a debt with better manners.'
      },
      {
      id: 'the-small-plate',
      title: 'Fourteen plates',
      requires: [{ type: 'always' }],
      text: 'A thousand people work in that palace doing the same job and fourteen of them ever see the smaller plate. The plate is the rank. Everything else about the hierarchy, including the titles, is decoration hung around the fact that you were fed before you were looked at, and the two things are not the same and the court has never pretended they are.'
      }
    ]
  },
  {
    id: 'faction-imperial-guard',
    kind: 'faction',
    realm: 'abyssal-depth',
    title: 'The Imperial Guard',
    icon: '⚑',
    teaser: 'We keep the order. We are not told whose.',
    unlocks: [{ type: 'event', id: 'guard-take-a-reading-in-the-current' }],
    lockedHint: 'You have not held a reading for them.',
    chapters: [
      {
      id: 'tuesdays',
      title: 'Orders, and the days they arrive on',
      requires: [{ type: 'always' }],
      text: 'They take orders from the Combine on Tuesdays, from the church on nothing in particular, and from whichever party most recently laid claim to the Doge\'s chair wherever a reading has to be held at depth. The chair has been empty for twenty-eight years and none of the three has ever stopped issuing orders about it. They have never once been instructed by all three at the same moment, which is not a rule anybody wrote. It is a coincidence of scheduling that has outlived everyone who knew it was a coincidence.'
      },
      {
      id: 'two-reports',
      title: 'Why two reports',
      requires: [{ type: 'always' }],
      text: 'A shift at depth produces one true number and three expected ones. The guard writes the true number and sends a second report that differs from it by a small fixed amount. The gap is not an error. It exists so that each of the three offices has something to be slightly wrong about, and an organisation with three slightly wrong offices never finds the one that is completely right.'
      }
    ]
  },
  {
    id: 'place-deep-draft',
    kind: 'place',
    realm: 'abyssal-depth',
    title: 'The Deep Draft',
    icon: '🌀',
    teaser: 'Forty centimetres of brass, one screw, one lens, one pallet of lead.',
    unlocks: [{ type: 'flag', id: 'deepdraftSigned' }],
    lockedHint: 'You have not had a hull signed for.',
    chapters: [
      {
      id: 'not-a-lease',
      title: 'Why a boat is not a farm',
      requires: [{ type: 'always' }],
      text: 'The farm could be leased because water that already exists can be described in a document. A boat cannot: somebody has to accept responsibility for a hull, and responsibility here is only ever transferred in writing, in a room with water on the floor, in front of ten sealed voices who are looking for the clause that will bind you later. So the Deep Draft has one owner on paper and no owner in the water, and the difference between those two things is the entire distance between a farm and a boat.'
      },
      {
      id: 'the-wall',
      title: 'What is at the bottom of the charts',
      requires: [{ type: 'flag', id: 'deepdraftFirstDive' }],
      text: 'Every trench chart in the Survey carries a mark at the deepest sounding that nobody has ever described in words, and the Surveyors have been drawing the same mark since before the water came. You went down there with a lamp of your own making and you saw it. It is not a wall. The nine lines of the dive log stop at the ninth because the person writing them stopped, and the tenth line is in a hand that is not yours, and the sheet has no blank after it, because whoever filled it in did not need another line.'
      }
    ]
  },
  {
    id: 'faction-weigh-house',
    kind: 'faction',
    realm: 'abyssal-depth',
    title: 'The Weigh-House',
    icon: '⚖',
    teaser: 'Thirty years, and he has never once asked what it is for.',
    unlocks: [{ type: 'item', id: 'draft-ballast-lead' }],
    lockedHint: 'You have never bought anything that was only weighed.',
    chapters: [
      {
      id: 'the-one-question',
      title: 'The only question he asks',
      requires: [{ type: 'always' }],
      text: 'Everything the Combine needs is counted rather than sold, and the count happens in a room where nothing has a name written on it. The weigh-master asks one question, which is under whose name, and then he writes down whatever you say, including names that have never existed. An invoice drawn on an invented company is not fraud. It is how the Combine records weight that is not trade, and the oilcloth on the pallet is not for the water: the oilcloth is for the ledger.'
      },
      {
      id: 'entered-under-amber',
      title: 'Entered under amber',
      requires: [{ type: 'flag', id: 'deepdraftSigned' }],
      text: 'Your lead went on the books as phosphor amber. He did not mistake it and he did not care: the whole point of the weigh-house is that the second column is the one the Combine actually keeps, and everything anybody says is the first column. You have now been inside that arrangement by accident, and there is a difference between a thing that was misfiled and a thing that was filed on purpose by somebody who was not you.'
      }
    ]
  },
  {
    id: 'place-reject-room',
    kind: 'place',
    realm: 'aether-heights',
    title: 'The Reject Room',
    icon: '⏱',
    teaser: 'Forty-one stopped clocks in a room with no window, and nobody may throw one away.',
    unlocks: [{ type: 'event', id: 'wing-take-the-reject-escapement' }],
    lockedHint: 'You have not been down the last ladder.',
    chapters: [
      {
      id: 'not-broken',
      title: 'Not full of broken clocks',
      requires: [{ type: 'always' }],
      text: 'The Guild does not repair these and does not sell these and has never permitted one to be thrown out, and the reason given is always the same sentence, delivered by the foreman in exactly the same tone: the room is not full of broken clocks, it is full of clocks that are waiting. Nobody has ever asked what they are waiting for, and the sentence has survived four hundred years without being finished, which in this city is the normal condition of a true thing.'
      },
      {
      id: 'the-one-that-runs',
      title: 'The one that runs',
      requires: [{ type: 'flag', id: 'wingRegistered' }],
      text: 'One of the forty-one is in perfect repair, and it is beating. Nothing in it is worn: the pallets are polished, the teeth are bright, the movement is immaculate inside a case full of dust. It has run against a stopped dial for longer than the guild has had a name for the tower it sits under, and it has never once needed winding. Fenn looked at it for a long time and said the only sentence anybody says about that room: that one is not ours. Nobody in the tower has ever explained which would be worse, that the room contains something that was never the guild\'s, or that the guild has been keeping it.'
      }
    ]
  },
  {
    id: 'place-escapement-wing',
    kind: 'place',
    realm: 'aether-heights',
    title: 'The Escapement Wing',
    icon: '✈',
    teaser: 'An escapement that runs, a spar out of the yoke, and the silk somebody else corrected.',
    unlocks: [{ type: 'flag', id: 'wingRegistered' }],
    lockedHint: 'You have not had a machine signed for in the belfry.',
    chapters: [
      {
      id: 'not-a-gift',
      title: 'The guild does not give machines away',
      requires: [{ type: 'always' }],
      text: 'A guild machine is yours because it is written down, and being written down means a foreman reads your intentions out loud in front of the apprentices and then signs them. That is a ceremony and not a formality: the guild has never once signed anything it was not willing to be responsible for, and has therefore never signed anything at all until now. Every part of the Wing came out of something the tower had already stopped using, which the foreman considers neither theft nor cleverness but bookkeeping, and the one part you paid for, the oil, is the one he keeps on his own bench and will not explain.'
      },
      {
      id: 'six-crossings',
      title: 'Why the keeper counts six',
      requires: [{ type: 'flag', id: 'wingFirstFlight' }],
      text: 'The keeper on the ladder will not let you land twice in the same place, and when you did it anyway once, long before anybody thought to sign anything, he landed you on a different roof and logged it as a second crossing and did not say why. He wrote six crossings in the book and you told him it was one flight, and he said six, and did not argue, and you did not argue either. The silk has the Salon handwriting on it. That is not decoration: it is a record, and a record in this city is the only thing anybody genuinely cannot take back.'
      }
    ]
  },
  {
    id: 'place-salt-pans',
    kind: 'place',
    realm: 'lagoon-heart',
    title: 'The Abandoned Salt Pans',
    icon: '▦',
    teaser: 'Flat water in squares, and one keeper who will not leave.',
    unlocks: [{ type: 'always' }],
    chapters: [
      {
      id: 'one-season',
      title: 'Abandoned in a single season',
      requires: [{ type: 'always' }],
      text: 'The pans were worked for two hundred years and then let go in one season, with no announcement and no closure order. The harvest failed in the water, not on the land: the brine went bitter from below, from a vent that opened under the third pan and has never once been found.'
      },
      {
      id: 'keeper-signed',
      title: 'The keeper who signed anyway',
      requires: [{ type: 'flag', id: 'pansLeased' }],
      text: 'The keeper signed you the lease on the condition that you never ask why they stayed. They signed it regardless, and they laughed first, which is not a thing people do when they are being lied to. It is a thing people do when they have been telling the truth for a long time and are tired of it.'
      },
      {
      id: 'nine-degrees',
      title: 'What the vent carries',
      requires: [{ type: 'flag', id: 'desaltinators' }],
      text: 'You tied your farm to the cold vents under the third pan, and the bitter brine has stopped rising, which nobody expected. What the vent truly carries runs nine degrees colder than the surrounding water in every season, and the Surveyors have quietly stopped filing reports on it.'
      }
    ]
  },
  {
    id: 'person-keeper',
    kind: 'person',
    realm: 'lagoon-heart',
    title: 'The Last Keeper of the Pans',
    icon: '☖',
    teaser: 'They stayed. They have an explanation, and you may not have it.',
    unlocks: [{ type: 'flag', id: 'pansLeased' }],
    lockedHint: 'You have never spoken with the keeper.',
    chapters: [
      {
      id: 'condition',
      title: 'The one condition',
      requires: [{ type: 'always' }],
      text: 'The keeper will lease the pans to a stranger with no papers on one condition: do not ask why they stayed. They have made the same offer to four people in nine years. Three of them are still alive, and none of them own the pans.'
      },
      {
      id: 'not-a-tenant',
      title: 'The third tenant',
      requires: [{ type: 'flag', id: 'desaltinators' }],
      text: 'After the vents, the keeper came to you unasked and told you the truth they had refused to sell: the bitter brine comes from the vent, and the vent is the reason they stayed. They are not a tenant of the pans. They are keeping something else alive down there, and the pans are how they afford to keep doing it.'
      }
    ]
  },
  {
    id: 'place-trench',
    kind: 'place',
    realm: 'abyssal-depth',
    title: 'The Leviathan Trench',
    icon: '☾',
    teaser: 'Eight hundred fathoms down, and the water is warm.',
    unlocks: [{ type: 'always' }],
    chapters: [
      {
      id: 'domes',
      title: 'Glass domes and brass turbines',
      requires: [{ type: 'always' }],
      text: 'The nursery sits under domes rated for a pressure no surface keel could survive. Everything down here was built by people who expected to keep it, and the domes are still in good repair, which is the part that ought to worry you. Nothing here has been abandoned. It has only stopped being visited.'
      },
      {
      id: 'nave',
      title: 'The nave that should not be here',
      requires: [{ type: 'event', id: 'scour-sunk-cathedral' }],
      text: 'A fourteenth-century cathedral nave stands in the trench, four miles from any recorded foundation, at a depth that puts it below the geological record of the basin itself. The silt inside is undisturbed and the door was not forced. It has been shut, and it has been waiting, for longer than the dome above it has been standing.'
      },
      {
      id: 'farming',
      title: 'What the nursery is farming',
      requires: [{ type: 'flag', id: 'cathedralScoured' }],
      text: 'The phosphor-orchids do not photosynthesise. There is no light at this depth and there never has been. They feed on something that arrives warm from below, which the Surveyors classify as thermal, and the classification is very old, and nobody has reopened the file since the water stopped rising.'
      }
    ]
  },
  {
    id: 'event-drowning',
    kind: 'event',
    realm: 'abyssal-depth',
    title: 'The Drowning of Anno Domini 1502',
    icon: '❖',
    teaser: 'The winter the water stopped rising, and the year it started.',
    unlocks: [{ type: 'event', id: 'take-ledger-job' }],
    lockedHint: 'You have not stood in the archive that dates it.',
    chapters: [
      {
      id: 'two-freezes',
      title: 'A winter with no name',
      requires: [{ type: 'always' }],
      text: 'The lagoon froze twice in the winter of 1502, which it had not done in living memory and has not done since. In the second freeze the Doge went down into the lower chambers. In the thaw that followed, the water stopped rising, and then began, very slowly, to fall.'
      },
      {
      id: 'receding',
      title: 'The water is going down',
      requires: [{ type: 'flag', id: 'desaltinators' }],
      text: 'Since you tied the cold vents into the vent under the third pan, the lagoon has dropped a finger-width a year. Nobody in the Council has remarked on it. The Surveyors have, privately, and their word is that the sea is not receding: it is being politely asked to, and it is being asked by something underneath.'
      }
    ]
  },
  {
    id: 'place-salon',
    kind: 'place',
    realm: 'astral-terminus',
    title: 'The Astronavigators\' Salon',
    icon: '✧',
    teaser: 'A dome for plotting routes through skies that drowned first.',
    unlocks: [{ type: 'always' }],
    chapters: [
      {
      id: 'routes',
      title: 'Routes that no longer exist',
      requires: [{ type: 'always' }],
      text: 'The Salon plots passage through the drowned skies and the black between stars. Most of the charts are for places that are no longer above water. The navigators keep plotting them anyway, because the routes were charted by people who are still, in some sense, expecting to arrive.'
      },
      {
      id: 'rail',
      title: 'The Stygian Rail',
      requires: [{ type: 'flag', id: 'railTimetable' }],
      text: 'Below the platform waits the Stygian Rail, on a timetable no living clerk remembers. It runs one departure per season, in the equinoctial deluge, and it stops at places the Salon has charts for and no land record has ever held. The passengers wear masks because the conductor reads the name from the inside.'
      },
      {
      id: 'purpose',
      title: 'What the Rail is for',
      requires: [{ type: 'flag', id: 'railPassage' }],
      text: 'You have passage. The seal on the ticket is black wax, which is what the Scholarium uses and what the Council does not. Somewhere beneath the Salon there is a place on this railway\'s chart and on no land record at all, and the conductor stamped you because your name was already on the passenger list, written before your birth, in a hand you have seen on the Doge\'s daily reports.'
      }
    ]
  },
  {
    id: 'person-conductors',
    kind: 'person',
    realm: 'astral-terminus',
    title: 'The Masked Conductors',
    icon: '◈',
    teaser: 'They check your name, and they seem to know it already.',
    unlocks: [{ type: 'flag', id: 'railTimetable' }],
    lockedHint: 'You have not read the timetable.',
    chapters: [
      {
      id: 'masks',
      title: 'Why the masks',
      requires: [{ type: 'always' }],
      text: 'The Conductors wear masks because the ticket is checked by name and the name has to be read from the inside. They are not hiding their faces. They are hiding which of them is holding the passenger list.'
      },
      {
      id: 'knew-your-name',
      title: 'They knew your name',
      requires: [{ type: 'flag', id: 'railPassage' }],
      text: 'When you failed to win passage, the conductor said your name as though reading it off a page, because it was on the list. The list is written before your birth. The hand is the Doge\'s, and the Doge has been under the fourth step since 1502, and the Rail has run to his timetable every season since without a single missed departure.'
      }
    ]
  },
  {
    id: 'person-doge',
    kind: 'person',
    realm: 'lagoon-heart',
    title: 'The Doge of the Drowned City',
    icon: '✦',
    teaser: 'Missing since 1502. The archive still files his reports.',
    unlocks: [{ type: 'flag', id: 'brineFarmSigned' }],
    lockedHint: 'You know the Doge is missing. You do not yet know why it matters to you.',
    chapters: [
      {
      id: 'missing',
      title: 'The winter of 1502',
      requires: [{ type: 'always' }],
      text: 'The Doge went down into the lower chambers in the winter of 1502 and did not come back. The palace has been ruled vacant for twenty-eight years. In all that time nobody has signed anything in his name, which has been very convenient for the Council of Ten and for no one else.'
      },
      {
      id: 'the-hand',
      title: 'The hand on the timetable',
      requires: [{ type: 'flag', id: 'railPassage' }],
      text: 'The hand that writes the daily reports of the palace archive and the hand that fills the Stygian Rail passenger list are one and the same, and the archive has never once recorded the Doge as absent. He is down there. He is writing. And he has been waiting for a chronicle to arrive that was worth writing down.'
      }
    ]
  }
];

// A gate answers one question: is this true for this player right now?
// Lore gates are intentionally more forgiving than encounter requirements -
// knowing someone counts as meeting them, because the point of the record is
// that you learned it.
function evaluateLoreGate(requirement) {
  if (!requirement || !requirement.type) return true;

  if (requirement.type === 'always') return true;
  if (requirement.type === 'flag') return Boolean(state.player.flags?.[requirement.id]);
  if (requirement.type === 'negFlag') return !state.player.flags?.[requirement.id];
  if (requirement.type === 'event') return hasSucceeded(requirement.id);
  if (requirement.type === 'attempted') return Boolean(getEventRecord(requirement.id));
  if (requirement.type === 'location') return (state.player.visitedLocations || []).includes(requirement.id);
  if (requirement.type === 'property') return state.player.properties.includes(requirement.value);
  if (requirement.type === 'stat') return getEffectiveStat(requirement.stat) >= requirement.min;
  if (requirement.type === 'faction') return getFactionStanding(requirement.id) === 'ally';
  if (requirement.type === 'standing') return getFactionStanding(requirement.id) === requirement.is;
  if (requirement.type === 'lore') return hasDiscoveredLore(requirement.id);
  if (requirement.type === 'chapter') return hasDiscoveredChapter(requirement.id, requirement.chapter);
  if (requirement.type === 'companion') return Boolean(state.player.equipment?.companion);
  // Un pezzo posseduto vale quanto un flag: la Weigh-House si apre quando hai
  // comprato il piombo, non quando hai firmato l'incontro. Senza questo gate il
  // tipo sconosciuto cade in fondo e vale `true`, e la voce si aprirebbe sempre.
  if (requirement.type === 'item') {
    const item = typeof findEquipmentItem === 'function' ? findEquipmentItem(requirement.id) : null;
    return Boolean(state.player.inventory?.includes(requirement.id)
      || (item && state.player.equipment?.[item.slot] === requirement.id));
  }

  return true;
}

// An entry opens when ANY of its gates is satisfied; a chapter needs ALL of
// its own requirements. That is what lets a vessel surface on one hint while a
// deeper chapter stays shut until a much later step.
function evaluateLoreGates(gates) {
  return (gates || []).some((gate) => evaluateLoreGate(gate));
}

function evaluateLoreRequires(requirements) {
  return (requirements || []).every((gate) => evaluateLoreGate(gate));
}

function findLoreEntry(entryId) {
  return loreEntries.find((entry) => entry.id === entryId) || null;
}

function getLoreState() {
  if (!state.player.lore) state.player.lore = { entries: {}, chapters: {} };
  if (!state.player.lore.entries) state.player.lore.entries = {};
  if (!state.player.lore.chapters) state.player.lore.chapters = {};
  return state.player.lore;
}

// Records why a thing became known, so the record can show the player the
// reason instead of the entry silently changing.
function discoverLore(entryId, reason = '') {
  const lore = getLoreState();
  const entry = findLoreEntry(entryId);
  if (!entry) return false;
  if (lore.entries[entryId]) return false;

  lore.entries[entryId] = { at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), reason };
  addLog(`${entry.title} enters the record.`, 'Lore', reason || `Opened by what you have done: ${entry.teaser}`);
  return true;
}

function discoverChapter(entryId, chapterId, reason = '') {
  const lore = getLoreState();
  const entry = findLoreEntry(entryId);
  const chapter = entry?.chapters.find((c) => c.id === chapterId);
  if (!chapter) return false;
  const key = `${entryId}:${chapterId}`;
  if (lore.chapters[key]) return false;

  lore.chapters[key] = { at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), reason };
  addLog(`${entry.title}: ${chapter.title}.`, 'Lore', reason || 'A fragment of the record you have earned.');
  return true;
}

// Walks every entry and opens whatever the player has now earned. Called after
// travel and after each resolved encounter, so the record grows on its own.
function refreshLoreDiscovery() {
  let changed = false;
  loreEntries.forEach((entry) => {
    if (!hasDiscoveredLore(entry.id) && evaluateLoreGates(entry.unlocks)) {
      changed = discoverLore(entry.id, describeLoreGate(entry.unlocks)) || changed;
    }
    if (!hasDiscoveredLore(entry.id)) return;
    entry.chapters.forEach((chapter) => {
      if (!hasDiscoveredChapter(entry.id, chapter.id) && evaluateLoreRequires(chapter.requires)) {
        changed = discoverChapter(entry.id, chapter.id, describeLoreGate(chapter.requires)) || changed;
      }
    });
  });
  return changed;
}

function describeLoreGate(gates) {
  const active = (gates || []).filter((gate) => evaluateLoreGate(gate));
  if (!active.length) return '';
  const parts = active.map((gate) => {
    if (gate.type === 'flag') return loreFlags[gate.id]?.label || gate.id;
    if (gate.type === 'event') return `resolving ${findActionById(gate.id)?.title || gate.id}`;
    if (gate.type === 'location') return `reaching ${locations[gate.id]?.realm || gate.id}`;
    if (gate.type === 'property') return `owning ${gate.value}`;
    if (gate.type === 'stat') return `${statNames[gate.stat] || gate.stat} ${gate.min}`;
    if (gate.type === 'faction' || gate.type === 'standing') return `standing with ${loreFactions[gate.id]?.name || gate.id}`;
    if (gate.type === 'lore') return `knowing ${findLoreEntry(gate.id)?.title || gate.id}`;
    if (gate.type === 'companion') return 'walking with a companion';
    return '';
  }).filter(Boolean);
  return parts.length ? `Opened by ${parts.join(', ')}.` : '';
}

// A locked entry shows only that it exists and why it is out of reach. The
// history stays shut; that is the whole point of a vessel.
function sanitizeLore(raw) {
  const clean = { entries: {}, chapters: {} };
  if (!raw || typeof raw !== 'object') return clean;
  const entries = raw.entries && typeof raw.entries === 'object' ? raw.entries : {};
  loreEntries.forEach((entry) => {
    if (entries[entry.id]) clean.entries[entry.id] = { at: entries[entry.id].at || '', reason: entries[entry.id].reason || '' };
  });
  const chapters = raw.chapters && typeof raw.chapters === 'object' ? raw.chapters : {};
  loreEntries.forEach((entry) => {
    entry.chapters.forEach((chapter) => {
      const key = `${entry.id}:${chapter.id}`;
      if (chapters[key]) clean.chapters[key] = { at: chapters[key].at || '', reason: chapters[key].reason || '' };
    });
  });
  return clean;
}

function sanitizeFlags(raw) {
  const clean = {};
  if (!raw || typeof raw !== 'object') return clean;
  Object.keys(loreFlags).forEach((flag) => {
    if (raw[flag]) clean[flag] = true;
  });
  return clean;
}

// La reputazione si pulisce come i flag: si tiene solo cio' che esiste davvero
// e si scarta tutto il resto. Serve per due motivi: un salvataggio vecchio non
// ha il campo e non deve rompersi, e un file importato a mano non deve poter
// piazzare numeri in fazioni che non esistono (che non mostrerebbero nulla e
// falserebbero il calcolo del livello).
function sanitizeReputation(raw) {
  const clean = {};
  if (!raw || typeof raw !== 'object') return clean;
  for (const faction of Object.values(factions)) {
    const value = Number(raw[faction.id]);
    if (Number.isFinite(value) && value !== 0) {
      clean[faction.id] = Math.max(FACTION_XP_FLOOR, Math.round(value));
    }
  }
  return clean;
}

function sanitizeVisited(raw) {
  const valid = new Set(Object.keys(locations));
  return Array.isArray(raw) ? raw.filter((id) => valid.has(id)) : [];
}

function markLocationVisited(locationId) {
  if (!state.player.visitedLocations) state.player.visitedLocations = [];
  if (state.player.visitedLocations.includes(locationId)) return false;
  state.player.visitedLocations.push(locationId);
  return true;
}

function getLoreProgress(entry) {
  const known = entry.chapters.filter((chapter) => hasDiscoveredChapter(entry.id, chapter.id)).length;
  return { known, total: entry.chapters.length, percent: entry.chapters.length ? Math.round(known / entry.chapters.length * 100) : 0 };
}

function getLoreTally() {
  const revealed = loreEntries.filter((entry) => hasDiscoveredLore(entry.id)).length;
  const chapters = loreEntries.reduce((total, entry) => total + getLoreProgress(entry).known, 0);
  const chaptersTotal = loreEntries.reduce((total, entry) => total + entry.chapters.length, 0);
  return { revealed, entries: loreEntries.length, chapters, chaptersTotal };
}

function hasDiscoveredLore(entryId) {
  return Boolean(getLoreState().entries[entryId]);
}

function hasDiscoveredChapter(entryId, chapterId) {
  return Boolean(getLoreState().chapters[`${entryId}:${chapterId}`]);
}