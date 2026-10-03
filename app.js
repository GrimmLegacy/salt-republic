const STORAGE_KEY = 'salt-republic-save-v1';
const VIGOR_MAX = 20;
const DRAW_RESERVE_MAX = 10;
const VIGOR_REGEN_INTERVAL = 5 * 60 * 1000;
const DRAW_REGEN_INTERVAL = 10 * 60 * 1000;
const DRAW_REGEN_MINUTES = DRAW_REGEN_INTERVAL / (60 * 1000);
const NAME_MAX_LENGTH = 40;
const MALUS_DRAW_WEIGHT = 55;
const GAME_YEAR = 1530;
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 18;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SEASONS = [
  { name: 'Deep Winter', months: [11, 0, 1] },
  { name: 'Thawing Spring', months: [2, 3, 4] },
  { name: 'High Summer', months: [5, 6, 7] },
  { name: 'Autumn (Equinoctial Deluge)', months: [8, 9, 10] }
];

const statNames = {
  vigilance: 'Vigilance',
  cunning: 'Cunning',
  audacity: 'Audacity',
  elegance: 'Elegance',
  persuasion: 'Persuasion',
  resolve: 'Resolve'
};

const resourceNames = {
  ducatsOfSalt: 'Ducats of Salt',
  whisperedSecrets: 'Whispered Secrets',
  phosphorAmber: 'Phosphor Amber',
  aetherCanister: 'Aether Canister'
};

const malusNames = {
  scandal: 'Scandal',
  wounds: 'Wounds',
  suspicion: 'Suspicion',
  nightmare: 'Nightmare',
  debt: 'Debt'
};

// `mapPoint` pins each realm onto "immagini/mappa del mondo.jpg" (1376x768) using
// percentages of the image box, so the markers stay glued to the artwork at any size.
// `mapAnchor` decides which side of the pin its label plate unfolds on.
const regions = [
  {
    id: 'aether-heights',
    name: 'Aether Heights',
    numeral: 'I',
    chartLabel: 'Belfry of San Marco',
    mapPoint: { x: 50.3, y: 23.2 },
    mapAnchor: 'below',
    locations: ['spire']
  },
  {
    id: 'lagoon-heart',
    name: 'Lagoon Heart',
    numeral: 'II',
    chartLabel: 'Sunken Palazzi',
    mapPoint: { x: 48.3, y: 65.1 },
    mapAnchor: 'above',
    locations: ['grand-canal']
  },
  {
    id: 'abyssal-depth',
    name: 'Abyssal Depth',
    numeral: 'III',
    chartLabel: 'Leviathan Trench',
    mapPoint: { x: 51.1, y: 79 },
    mapAnchor: 'above',
    locations: ['leviathan-trench']
  },
  {
    id: 'astral-terminus',
    name: 'Astral Terminus',
    numeral: 'IV',
    chartLabel: 'Astral Salon',
    mapPoint: { x: 84.7, y: 46.9 },
    mapAnchor: 'below',
    locations: ['astronavigators-salon']
  }
];

// Equipment slots. `key` is what gets stored in state.player.equipment.
// The companion slot holds a living ally rather than a worn object, so it is
// flagged: companions may grant bonuses too, but they are never "unequipped to
// a satchel", they are simply sent away and stay in the inventory.
const equipmentSlots = [
  { key: 'head', label: 'Head', icon: '♁', hint: 'Anything that covers the head: caps, circlets, deep hoods.' },
  { key: 'body', label: 'Body', icon: '❖', hint: 'The layer against the wet: coats, shrouds, salvaged armour.' },
  { key: 'hands', label: 'Hands', icon: '✋', hint: 'Gloves and gauntlets. Water and blood are hard on bare skin.' },
  { key: 'feet', label: 'Boots', icon: '⌂', hint: 'The flooded streets reward anything that keeps the ankles dry.' },
  { key: 'mantle', label: 'Mantle', icon: '❧', hint: 'Cloaks, capes and shawls worn over everything else.' },
  { key: 'trinket', label: 'Trinket', icon: '✦', hint: 'A single keepsake, seal or charm carried close to the skin.' },
  { key: 'companion', label: 'Companion', icon: '❦', hint: 'A beast, a person or a spirit that walks beside you. They rest in the satchel when sent away.', living: true }
];

// STARTER ITEMS - placeholders so the equipment screen can be tried out today.
// Real loot will arrive with the encounters. To add one later: give it an id, a
// slot (a key from equipmentSlots), and any of stats / vigor / resources /
// malusRelief / notes. Everything except id/name/slot is optional.
const equipmentItems = [
  {
    id: 'starter-diving-hood',
    name: 'Tarred Diving Hood',
    slot: 'head',
    rarity: 'common',
    icon: '🎩',
    stats: { vigilance: 1 },
    notes: 'Stitched from the coat of a courier who did not come back up.'
  },
  {
    id: 'starter-patched-coat',
    name: 'Patched Canal Coat',
    slot: 'body',
    rarity: 'common',
    icon: '🧥',
    stats: { resolve: 1 },
    notes: 'Four owners deep and still watertight at the shoulders.'
  },
  {
    id: 'starter-keeper-gloves',
    name: 'Tar-Tipped Keeper Gloves',
    slot: 'hands',
    rarity: 'common',
    icon: '🧤',
    stats: { cunning: 1 },
    notes: 'The fingertips stay sensitive even after weeks in the brine.'
  },
  {
    id: 'starter-copper-greaves',
    name: 'Copper-Buckled Greaves',
    slot: 'feet',
    rarity: 'common',
    icon: '🥾',
    stats: { audacity: 1 },
    vigor: 2,
    notes: 'Heavy, loud, and the only boots that kept the surveyors standing.'
  },
  {
    id: 'starter-reef-cloak',
    name: 'Cloak of the Broken Reef',
    slot: 'mantle',
    rarity: 'uncommon',
    icon: '🧣',
    stats: { persuasion: 1, vigilance: 1 },
    notes: 'Dyed in the black water off the reef; the salt never quite leaves it.'
  },
  {
    id: 'starter-council-seal',
    name: "Council's Broken Seal",
    slot: 'trinket',
    rarity: 'uncommon',
    icon: '🔱',
    stats: { elegance: 1 },
    resources: { whisperedSecrets: 2 },
    notes: 'Cracked across the sigil. The archive still answers to it.'
  },
  {
    id: 'starter-drowned-cat',
    name: 'Cartwheel the Tide Cat',
    slot: 'companion',
    rarity: 'uncommon',
    icon: '🐈',
    companion: true,
    companionKind: 'Beast',
    stats: { cunning: 1 },
    notes: 'Turned up in the nets three days running and refuses to be put back.'
  },
  {
    id: 'starter-lampwright',
    name: 'Old Lampwright',
    slot: 'companion',
    rarity: 'rare',
    icon: '🕯️',
    companion: true,
    companionKind: 'Ghost',
    stats: { persuasion: 1, elegance: 1 },
    vigor: 1,
    malusRelief: { suspicion: 1 },
    notes: 'He drowned in the fire of his own lamp a long time ago, and still walks the stairs he built. He will not be hurried.'
  },

  // ---- Oggetti che si guadagnano ripetendo il lavoro con una fazione --------
  //
  // Questi non si trovano in un cassone: si guadagnano facendo il mestiere di
  // quella citta' ancora e ancora. Ogni slot ha una sola risposta, perche' quello
  // che un posto ti insegna davvero e' come si lavora in quel posto.
  //
  // Sono tutti `common`, e tutti con un bonus piccolo. Non sono ricompense per la
  // riuscita, sono strumenti: il giocatore li mette perche' gli servono, non
  // perche' hanno numeri piu' alti.

  // Aether Heights — la corporazione degli orologi.
  {
    id: 'guild-bench-apron',
    name: 'Bench Apron of the Guild',
    slot: 'body',
    rarity: 'common',
    icon: '🧵',
    stats: { resolve: 1 },
    notes: 'Twelve pockets, all of them full of screws. The guild stops calling it out to anyone who asks, because it means you have been here a while.'
  },
  {
    id: 'guild-brass-loupe',
    name: 'Brass Loupe',
    slot: 'trinket',
    rarity: 'common',
    icon: '🔍',
    stats: { vigilance: 1 },
    notes: 'Ground for the guild, then pocketed by the guild, then found by the guild in a different pocket three months later.'
  },

  // Astral Terminus — il Salon degli navigatori.
  {
    id: 'salon-star-chart-sleeve',
    name: 'Chart Sleeve of the Salon',
    slot: 'mantle',
    rarity: 'common',
    icon: '📜',
    stats: { elegance: 1, persuasion: 1 },
    notes: 'Waxed against spray and against curiosity. It holds six folded charts and one that nobody will admit to owning.'
  },
  {
    id: 'salon-conductors-pin',
    name: 'Masked Conductor’s Pin',
    slot: 'trinket',
    rarity: 'common',
    icon: '🎖️',
    notes: 'No name on it. It is enough that they see it and stop checking your face.'
  },

  // Abyssal Depth — la fattoria idroponica.
  {
    id: 'combine-warm-waders',
    name: 'Warm Waders of the Farm',
    slot: 'feet',
    rarity: 'common',
    icon: '🥾',
    stats: { audacity: 1 },
    notes: 'Eight hundred fathoms down the water is warmer than the city, which is the only honest thing anyone will tell you about the place.'
  }
];

// STARTING KIT handed to a fresh chronicle, so the screen is usable at once.
// Remove or extend this when real loot starts dropping from encounters.
const startingEquipment = {
  head: 'starter-diving-hood',
  body: 'starter-patched-coat',
  hands: 'starter-keeper-gloves',
  feet: 'starter-copper-greaves',
  mantle: null,
  trinket: null,
  companion: null
};

const locations = {
  spire: {
    id: 'spire',
    realm: 'Aether Heights',
    name: 'The Spire of San Marco & Cloud Docks',
    shortName: 'The Great Clockwork Belfry of San Marco',
    description:
      'Thousands of feet above the drowned lagoons, massive bronze gears the size of galleons grind inside the clouds. Guild clocksmiths lubricate the escapement mechanisms with whale oil.',
    time: 'day',
    image: 'immagini/le 4 città principali/The Spire of San Marco & Cloud Docks.jpg',
    actions: [
      {
        id: 'adjust-chronometer',
        title: 'Adjust the Astronomical Chronometer',
        summary:
          'The Spire keeps the hour for a city the sea has already taken, and its escapement has begun to drift a full quarter-minute every day. Too far behind, and the tide tables the whole lagoon steers by go wrong; too far ahead, and the bells ring over streets that are not yet covered. You climb the catwalk hanging open over the void, oil the escapement by hand, and hold the great brass pendulum steady while you read it against the planetary alignments. The guild watches from the galleries below and marks down every hand that shakes.',
        appearanceReason: 'The Spire’s chronometer has begun drifting against the known tides, and its keepers need someone to inspect it.',
        image: "immagini/zone varie delle città/Smugglers' Anchorage at the Clouds' Edge.jpg",
        when: 'any',
        test: 'vigilance',
        difficulty: 5,
        chanceRewards: [{ resource: 'aetherCanister', amount: 1, chance: 0.5 }],
        success: {
          stats: { vigilance: 2 },
          resources: { ducatsOfSalt: 1 },
          log: 'You align the great brass pendulum with the tides of the higher heavens. The city’s bells cough awake and the air tastes of storm.'
        },
        failure: {
          resources: { scandal: 1 },
          log: 'The pendulum slips. Your grip falters and the clockwork alarms ring; a dozen gossiping officers notice your misstep.'
        },
        requires: []
      },
      {
        id: 'guild-oils-the-escapement',
        title: 'Oil the Escapement on Gallery Night',
        summary:
          'The guild does its real work at noon, when the light comes down through the belfry arches and you can see what you are doing. The escapement is the small brass brain that lets the bell let go of itself at the right second; it is also the only part anybody still oils by hand, because a machine that decides when the city wakes should not decide it with a machine that can be argued with. You climb the ladder with the can against your hip, take the escapement apart on the gallery bench under a cloth, and put it back together with fewer pieces than you took out. The foreman watches from the floor without climbing. When you come down he says nothing, and a different can is waiting on the rail, and this one is yours. It happens every day of the year and there is always somebody on the ladder.',
        appearanceReason: 'The escapement is oiled by hand at noon, every day, by whoever is on the ladder. The guild has started leaving your can on the rail.',
        image: 'immagini/carte/Oil the Escapement on Gallery Night.jpg',
        when: 'day',
        test: 'resolve',
        difficulty: 2,
        success: {
          stats: { resolve: 2, vigilance: 1 },
          resources: { ducatsOfSalt: 2 },
          items: ['guild-bench-apron', 'guild-brass-loupe'],
          log: 'The bell lets go at the right second and the gallery of apprentices applauds before they remember not to. The foreman leaves a can on the rail for you.'
        },
        failure: {
          resources: { wounds: 1 },
          log: 'A tooth skids on the third piece and puts a bright line across your palm. The bell is four seconds out and somebody upstairs is already writing it down.'
        },
        requires: [],
        repeatable: true
      }
    ]
  },
  'grand-canal': {
    id: 'grand-canal',
    realm: 'Lagoon Heart',
    name: 'The Grand Canal & Sunken Palazzi',
    shortName: 'The Sunk Archives of the Doge\'s Palace',
    description:
      'Half-submerged marble archways lead into the subterranean chambers of the Doge\'s Palace. Here, clerks in rubber waders transcribe century-old ledgers while dark canal water laps against the vellum shelves.',
    time: 'day',
    image: 'immagini/le 4 città principali/The Grand Canal & Sunken Palazzi.jpg',
    actions: [
      {
        id: 'take-ledger-job',
        title: 'Take the Ledger Job at the Customs House',
        summary:
          'The customs house hires whoever asks, which is precisely why nobody has asked. The post has stood open since the tide swallowed the lower stair, and what waits on the counter is the ledger nobody else will touch: a column of water-stained accounts kept by a clerk who has been dead, or drowned, or quietly promoted out of the record for the better part of a generation. You take the counter, the lamp, and the long hours that come with them, and you copy names into a second book while the water works patiently at the pages. Whoever signed this column last is the reason it cannot be read, and that is the part worth the wage.',
        appearanceReason: 'The customs house hires whoever asks. This post has stood open since the tide swallowed the lower stair, and no one else has come for it.',
        image: 'immagini/carte/Take the Ledger Job at the Customs House.jpg',
        when: 'day',
        test: 'cunning',
        difficulty: 4,
        success: {
          stats: { cunning: 2 },
          resources: { ducatsOfSalt: 3 },
          sets: { ledgerTrusted: true },
          log: 'You sign the ledger book with a hand that does not shake. The harbormaster pays you in advance and pretends not to watch you leave.'
        },
        failure: {
          resources: { suspicion: 1 },
          log: 'The column collapses into the water at your touch. A customs clerk mutters your name to the guard, and the ledger book goes to someone else.'
        },
        requires: [],
        repeatable: false
      },
      {
        id: 'carry-sealed-cargo',
        title: 'Carry the Sealed Cargo Past the Checkpoint',
        summary:
          'The Scholarium does not pay wages in coin. The ledger job came with a crate set down behind it: salt, sealed in wax, carrying no manifest and no declared weight. The checkpoint at the marble arch opens a sealed crate when the mood takes it, and the inspectors who do the opening are paid in names. You carry it through the half-light with a straight back and a boring face. If they break the seal, they take your name and the Scholarium takes their silence. If you do not, you are theirs for as long as the crate stays shut.',
        appearanceReason: 'The ledger job handed you a crate with no manifest and a seal out of the Scholarium. Carrying it is simply the price of being trusted with anything.',
        image: 'immagini/carte/Carry the Sealed Cargo Past the Checkpoint.jpg',
        when: 'any',
        test: 'audacity',
        difficulty: 5,
        chanceRewards: [{ name: 'Drowned Clerk’s Ledger Fragment', resource: 'whisperedSecrets', amount: 2, chance: 0.5 }],
        success: {
          stats: { audacity: 2 },
          resources: { ducatsOfSalt: 4 },
          sets: { cargoCarried: true, checkpointMercy: true },
          log: 'You shoulder the crate through the half-light of the checkpoint. The inspector looks at the seal, then at you, and waves you through.'
        },
        failure: {
          resources: { wounds: 1, scandal: 1 },
          sets: { checkpointBetrayal: true, scholariumDebt: true },
          log: 'The crate hits the flooded floor and splits. Salt pours out like a pale bell, and the inspectors take your name down in ink that will not wash.'
        },
        chain: { follows: 'take-ledger-job' },
        requires: [{ type: 'chain', action: 'take-ledger-job' }],
        repeatable: false
      },
      {
        id: 'bargain-salt-pans',
        title: 'Bargain for the Abandoned Salt Pans',
        summary:
          'The pans are flat water in stone squares and a keeper who will not leave them. Nobody leases them: the brine rises, the councils refuse, and the last man still out there has been tending water that yields nothing for a century. He has just admitted, to nobody, that no one else can work it. An admission like that is an opening, and openings in this city close fast. You talk your way past his refusal, his silence and his dignity, and you do it without papers, because papers are exactly what you do not have.',
        appearanceReason: 'The keeper admits aloud that the pans cannot be worked by anyone else. That admission is the opening you meant to use.',
        image: 'immagini/carte/Bargain for the Abandoned Salt Pans.jpg',
        when: 'day',
        test: 'persuasion',
        difficulty: 5,
        cost: { ducatsOfSalt: 5 },
        chanceRewards: [{ resource: 'phosphorAmber', amount: 1, chance: 0.35 }],
        success: {
          stats: { persuasion: 2 },
          resources: { ducatsOfSalt: 1 },
          sets: { pansLeased: true },
          log: 'The keeper laughs, then signs. The pans are yours for as long as the brine keeps rising, and the first tide already does.'
        },
        failure: {
          resources: { suspicion: 1, ducatsOfSalt: -5 },
          log: 'The keeper hears your offer, hears your name attached to it, and shuts the door. Your purse is lighter and the pans are not yours.'
        },
        chain: { follows: 'carry-sealed-cargo' },
        requires: [{ type: 'chain', action: 'carry-sealed-cargo' }],
        repeatable: false
      },
      {
        id: 'sign-brine-farm-papers',
        title: 'Sign the Brine-Farm Papers Before the Council',
        summary:
          'The keeper sent the papers upward and the Council of Ten agreed to hear you, which happens perhaps once in a decade. You stand in a flooded chamber before ten sealed voices and put your name to a lease on water nobody has farmed in a century, and they will read every line twice, looking for the clause that binds you to something you never intended to owe. Sign, and the Brine-Farm is yours in the record, which in this city is the only sense that matters. Fail, and the papers come back unopened and the pans go back to waiting.',
        appearanceReason: 'The keeper sent the papers upward. The Council meets tonight, and the salt pans have waited long enough for a name on them.',
        image: 'immagini/carte/Sign the Brine-Farm Papers Before the Council.jpg',
        when: 'night',
        test: 'resolve',
        difficulty: 6,
        chanceRewards: [{ name: 'Favor of the Scholarium', resource: 'whisperedSecrets', amount: 3, chance: 0.5 }],
        success: {
          stats: { resolve: 2 },
          resources: { ducatsOfSalt: 2 },
          properties: ['The Brine-Farm (La Fattoria 1)'],
          sets: { brineFarmSigned: true },
          log: 'The last clerk presses the seal into wet paper and the first row of the Brine-Farm becomes yours. Somewhere below, the nursery lights itself.'
        },
        failure: {
          resources: { scandal: 2 },
          log: 'A councillor reads your clause aloud twice and the room turns cold. The papers come back unopened, and the pans go back to waiting.'
        },
        chain: { follows: 'bargain-salt-pans' },
        requires: [{ type: 'chain', action: 'bargain-salt-pans' }],
        repeatable: false
      },
      {
        id: 'decipher-treaty',
        title: 'Decipher the Submerged Treaty of 1528',
        summary:
          'A scroll has surfaced in the Doge\'s archive with its seal already cracked and its ink still waking under the vellum, which after four hundred years should not be possible. It sets out a pact Venice struck with the Tide Monarchs and then spent two centuries agreeing never to mention, and the seal on it matches the drowned crown you have already handled. You read it the way the clerks do: slowly, by warmth and pressure, holding the page clear of the water. Whatever the ink has to say, it says it once and then crumbles to damp ash in your fingers.',
        appearanceReason: 'A waterlogged treaty has surfaced in the Doge’s archive, and its seal matches the drowned crown in your recent findings.',
        image: 'immagini/carte/Decipher the Submerged Treaty of 1528.jpg',
        when: 'day',
        test: 'vigilance',
        difficulty: 4,
        chanceRewards: [{ resource: 'whisperedSecrets', amount: 2, chance: 0.5 }],
        success: {
          stats: { vigilance: 2 },
          resources: { ducatsOfSalt: 1 },
          sets: { treatyRead: true },
          log: 'The ink wakes under your hands. The treaty reveals a buried promise between the lagoon and a drowned crown.'
        },
        failure: {
          resources: { scandal: 1 },
          log: 'The page crumbles to damp ash in your fingers. A clerk catches your fumbling and begins whispering your name.'
        },
        requires: []
      },
      {
        id: 'converse-scribe',
        title: 'Converse Discretely with the Chief Scribe',
        summary:
          'The Chief Scribe decides which records exist and what each of them is worth, and the Council\'s sealed ledgers are worth more than both. They are also not for sale to anyone who asks outright. What they will accept is a gratuity slipped across the counter, phrased as though you were asking about the weather, from a person who is leaving anyway. Buy the conversation and the private meetings of the Council of Ten become readable. Overpay, or read the room wrong, and the room reads you instead.',
        appearanceReason: 'The Chief Scribe controls the Council’s sealed ledgers, and a discreet payment may persuade them to share one.',
        image: 'immagini/carte/Converse Discretely with the Chief Scribe.jpg',
        when: 'day',
        test: 'cunning',
        difficulty: 5,
        cost: { ducatsOfSalt: 3 },
        success: {
          stats: { cunning: 2 },
          resources: { whisperedSecrets: 2 },
          sets: { councilRecords: true },
          log: 'The scribe smiles without warmth and passes you a ledger of secret meetings under the seal of a black ribbon.'
        },
        failure: {
          resources: { suspicion: 1, ducatsOfSalt: -3 },
          log: 'You overpay and underread the room. The clerk turns away, and suspicion settles over your coat like a wet stain.'
        },
        requires: []
      }
    ]
  },
  'leviathan-trench': {
    id: 'leviathan-trench',
    realm: 'Abyssal Depth',
    name: 'The Leviathan Trench & Abyssal Docks',
    shortName: 'The Submerged Hydroponics Nursery',
    description:
      'Under thick reinforced glass domes eight hundred fathoms deep, brass turbines pump oxygenated brine across terraced beds of bioluminescent kelp and phosphor-orchids.',
    time: 'day',
    image: 'immagini/le 4 città principali/The Leviathan Trench & Abyssal Docks.jpg',
    actions: [
      {
        id: 'harvest-orchids',
        title: 'Harvest Your Phosphor-Orchids',
        summary:
          'Your Brine-Farm\'s phosphor-orchids ripen on a schedule the turbines keep, and this is the window. You go down in a rubber apron and wade the illuminated glass vats with a cutting rig at your hip, clipping only what has gone fully luminous, because a bulb that is half lit will not hold its amber once it is cut. The warm glow spills around your hands and the farm answers your touch as though it has been waiting years for your return. The valves are older than the dome and they do not stop for the man who owns them.',
        appearanceReason: 'Your Brine-Farm has reached harvest time; this action appears while you own the first farm property.',
        image: 'immagini/zone varie delle città/The Brass Diving Bells of Saint Jude.jpg',
        when: 'any',
        test: 'vigilance',
        difficulty: 3,
        success: {
          stats: { vigilance: 1 },
          resources: { phosphorAmber: 2, ducatsOfSalt: 1 },
          log: 'The warm glow spills around your hands. The farm answers your touch as if it has been waiting years for your return.'
        },
        failure: {
          resources: { wounds: 1 },
          log: 'A broken valve hisses in your face and the blades of the harvest rig bite your sleeve. Blood and brine mingle in the dark.'
        },
        requires: [{ type: 'property', value: 'The Brine-Farm (La Fattoria 1)' }]
      },
      {
        id: 'install-desalinators',
        title: 'Install Sub-Zero Desalinators',
        summary:
          'A vein of abyssal cold vents runs under the lower basalt wall of your farm, cold enough to strip salt out of brine at a rate the surface nurseries never will manage. Breach the wall, thread the vents into the farm\'s heart, and the nursery doubles its capacity and begins yielding cryogenic pearls to anyone rich enough to want them. The frost goes through rubber like paper, the vents fight the fitting, and the abyss answers a successful connection with an iron hiss that divers four hundred fathoms up can hear.',
        appearanceReason: 'Your Brine-Farm can be expanded with the cold vents, and your Audacity is high enough to attempt the dangerous installation.',
        image: 'immagini/carte/Install Sub-Zero Desalinators.jpg',
        when: 'any',
        test: 'audacity',
        difficulty: 6,
        cost: { ducatsOfSalt: 8 },
        success: {
          stats: { audacity: 2, elegance: 1 },
          properties: ['The Brine-Farm (La Fattoria 2)'],
          sets: { desaltinators: true },
          log: 'You thread the cold vents into the farm\'s heart and the abyss answers with a deep, iron hiss. The nursery breathes easier.'
        },
        failure: {
          resources: { wounds: 2, ducatsOfSalt: -8 },
          log: 'The frost bites through your gloves. The vent tears loose and the ruined rig costs you more than the treasure it could have yielded.'
        },
        chain: { follows: 'harvest-orchids' },
        repeatable: false,
        requires: [{ type: 'property', value: 'The Brine-Farm (La Fattoria 1)' }, { type: 'stat', stat: 'audacity', min: 6 }]
      },
      {
        id: 'scour-sunk-cathedral',
        title: 'Scour the Sunk Cathedral Nave',
        summary:
          'A fourteenth-century nave lies under the silt off the nursery, and the falling tide has opened the transept long enough for somebody in a suit to get in and out. You go down in vulcanized rubber and tread the silt with the patience of a man reading a book, because a nave that has been under water this long keeps whatever was buried in it beneath a foot of grey. There are reliquaries down here, and salt, and possibly the reason the cathedral was built where the water could take it. The silt closes over the helmet torch the moment you stop moving.',
        appearanceReason: 'The cathedral nave remains unsearched, and the falling tide has opened a short route inside.',
        image: 'immagini/carte/Scour the Sunk Cathedral Nave.jpg',
        when: 'any',
        test: 'audacity',
        difficulty: 5,
        success: {
          stats: { audacity: 2 },
          resources: { ducatsOfSalt: 2, phosphorAmber: 1 },
          sets: { cathedralScoured: true },
          log: 'You emerge from the cathedral\'s black nave with silver relics and salt crusted in your beard. The deep remembers your name.'
        },
        failure: {
          resources: { wounds: 1, suspicion: 1 },
          log: 'The silt clutches you. A loose hinge drops on your shoulders and the returning bell rings too long in your ears.'
        },
        requires: []
      },
      {
        id: 'combine-walk-the-warm-terraces',
        title: 'Walk the Warm Terraces at First Light',
        summary:
          'Eight hundred fathoms down, the water is warmer than the city will ever be, and everything the farm grows depends on somebody noticing that before it becomes a problem. You take the terrace at first light, when the vents have been shut for the night and the phosphor still holds the glow in the water like something being decided. The Combine does not send anybody: it posts the round on a board, the round is the same every morning, and the person who walks it is whoever turned up. You read the temperature at each vat by hand, because a gauge is a thing you read and the water is a thing you feel, and the two disagree more often than anyone will admit. Nobody down here is paid for this and nobody down here stops doing it. The waders belong to whoever walks the round, and after a while there is no second pair in the rack, because there has not been a second person in a long time.',
        appearanceReason: 'The warm terraces are walked by hand at first light, every morning, and the round is open to whoever turns up for it.',
        image: 'immagini/carte/Walk the Warm Terraces at First Light.jpg',
        when: 'day',
        test: 'audacity',
        difficulty: 3,
        success: {
          stats: { audacity: 1, resolve: 2 },
          resources: { phosphorAmber: 2, ducatsOfSalt: 2 },
          items: ['combine-warm-waders'],
          log: 'The last vat holds its heat and the vents are shut on time. There is one pair of waders in the rack, and they are the ones you just walked back in.'
        },
        failure: {
          resources: { wounds: 1 },
          log: 'A valve you wrote off as tired seizes while you are reading the next vat, and the terrace spends the morning venting into the dark.'
        },
        requires: [],
        repeatable: true
      }
    ]
  },
  'astronavigators-salon': {
    id: 'astronavigators-salon',
    realm: 'Astral Terminus',
    name: "The Astronavigators' Salon & Observation Dome",
    shortName: 'The Astronavigators’ Salon',
    description:
      'Beneath a brass-ribbed dome, navigators plot routes through drowned skies and the black between stars. At the platform below, the Stygian Rail waits for a timetable no living clerk remembers.',
    time: 'night',
    image: "immagini/le 4 città principali/The Astronavigators' Salon & Observation Dome.jpg",
    actions: [
      {
        id: 'chart-stygian-rail',
        title: 'Read the Stygian Rail’s Lost Timetable',
        summary:
          'The Stygian Rail still keeps a timetable, and the timetable is not in the station: it is in the stars the navigators plot against every night. You lay the station clock over the dome\'s constellation charts and look for the departure belonging to no line the company acknowledges, the one that appears only during the equinoctial deluge when the sky is drowned at the horizon. Find it and the Rail answers from below with a single distant whistle, as though a timetable nobody has followed since 1502 has just been completed. Be caught looking, and the constellations will rearrange themselves while you watch.',
        appearanceReason: 'The observatory’s star charts align with a departure listed only during the equinoctial deluge.',
        image: 'immagini/zone varie delle città/The Celestial Terminus & Stygian Rail.jpg',
        when: 'night',
        test: 'vigilance',
        difficulty: 5,
        chanceRewards: [{ resource: 'aetherCanister', amount: 1, chance: 0.3 }],
        success: {
          resources: { whisperedSecrets: 2 },
          sets: { railTimetable: true },
          log: 'The impossible departure is there, inked between two stars. Somewhere below, the Stygian Rail answers with a single distant whistle.'
        },
        failure: {
          resources: { nightmare: 1 },
          log: 'The constellations rearrange themselves while you watch. By dawn, the timetable has forgotten your face.'
        },
        requires: []
      },
      {
        id: 'convince-astral-conductors',
        title: 'Win Passage from the Astral Conductors',
        summary:
          'The conductors check names before they check tickets, and tonight they are working through a passenger list written before your birth. Your name is on it, in a hand that is not yours, and they can tell you that much because the book is open in front of them. Getting past them means convincing a masked officer in formal black wax that you belong on a manifest older than you are, without ever explaining how you knew which name to look for. Ask one question too many about who wrote the list, and every masked passenger turns to watch you leave the platform.',
        appearanceReason: 'The conductors are checking names for the next Stygian Rail departure, creating a chance to negotiate passage.',
        image: 'immagini/carte/Win Passage from the Astral Conductors.jpg',
        when: 'night',
        test: 'persuasion',
        difficulty: 5,
        success: {
          stats: { persuasion: 1 },
          resources: { whisperedSecrets: 2 },
          sets: { railPassage: true },
          log: 'The conductor stamps your ticket with a seal of black wax. For one night, the stars make room for your name.'
        },
        failure: {
          resources: { suspicion: 1 },
          log: 'The conductor knows your name already, but refuses to say how. Every masked passenger turns to watch you leave.'
        },
        requires: []
      },
      {
        id: 'salon-copy-the-manifest',
        title: 'Copy the Manifest in the Reading Room',
        summary:
          'Nobody may read the platform timetable, and everybody has to write it out. That is the trick the Salon has been running since the company stopped telling its navigators where the departures go: the routes are kept in a room upstairs where they are copied, by hand, four times a day, and a name that appears on the copy desk long enough stops being checked. The ink is iron gall and it bites the paper, so the copies last exactly long enough to be useful and not one hour longer. You sit with the pen and the cold cup of coffee that is never refilled, and you do not hurry, because a hurried manifest is a manifest with a mistake in it, and a mistake in a manifest is how the Salon finds out that you have been reading. After a few days of this the clerk in the corner leaves a waxed sleeve on your bench without a word, and the waxed sleeve is how you will be handed your own name on a folded sheet.',
        appearanceReason: 'The Salon copies its timetable four times a day by hand. The desk takes anyone who can read and does not hurry.',
        image: 'immagini/carte/Copy the Manifest in the Reading Room.jpg',
        when: 'day',
        test: 'elegance',
        difficulty: 3,
        success: {
          stats: { elegance: 2, persuasion: 1 },
          resources: { ducatsOfSalt: 3 },
          items: ['salon-star-chart-sleeve'],
          log: 'The manifest is copied, signed and shelved. The clerk in the corner leaves a waxed sleeve on your bench without saying anything at all.'
        },
        failure: {
          resources: { suspicion: 1 },
          log: 'The iron gall eats a date you cannot scrape off. The copy is wrong, the Salon is disappointed, and the wrong page is filed under your name.'
        },
        requires: [],
        repeatable: true
      },
      {
        id: 'salon-inspect-the-dead-timetable',
        title: 'Inspect the Timetable in the Condemned Store',
        summary:
          'The old timetables cannot go in the furnace. Paper that has been read by a Salon navigator is paper somebody will one day be held to, and the Salon is careful enough to keep its own proof. So the condemned years go down to a store under the dome, shelved in oilcloth and racked by departure rather than by date, because a navigator asking for the wrong year is told there is no wrong year, only a shelf. You go down with a lamp and read the spines. Somewhere in this racking is the year that does not fit, the one the archivists will not bring up to the dome, and the reason the Stygian Rail can still be heard from a platform where no line has run since before anyone was born.',
        appearanceReason: 'The Salon keeps its old timetables rather than burning them. The condemned store is open to anyone the desk trusts with a lamp.',
        image: 'immagini/carte/Inspect the Timetable in the Condemned Store.jpg',
        when: 'day',
        test: 'vigilance',
        difficulty: 4,
        success: {
          stats: { vigilance: 2, cunning: 1 },
          resources: { whisperedSecrets: 2, ducatsOfSalt: 1 },
          items: ['salon-conductors-pin'],
          log: 'A spine with no year on it, filed between two that cannot both be right. On the way out, a masked officer notes your face and decides not to check it again.'
        },
        failure: {
          resources: { suspicion: 1, nightmare: 1 },
          log: 'The rack behind you is not where you left it, and the oilcloth has your fingerprints on a year that does not exist. The lamp goes out by itself.'
        },
        requires: [],
        repeatable: true
      }
    ]
  }
};

const defaultState = {
  progressionVersion: 4,
  player: {
    name: 'Aurelian Voss',
    stats: {
      vigilance: 1,
      cunning: 1,
      audacity: 1,
      elegance: 1,
      persuasion: 1,
      resolve: 1
    },
    resources: {
      ducatsOfSalt: 134,
      whisperedSecrets: 53,
      phosphorAmber: 6,
      aetherCanister: 0
    },
    vigor: 20,
    vigorLastRegenAt: Date.now(),
    drawTokens: 10,
    drawTokensLastRegenAt: Date.now(),
    malus: {
      scandal: 0,
      wounds: 0,
      suspicion: 0,
      nightmare: 0,
      debt: 0
    },
    malusSources: {},
    statXp: {
      vigilance: 0,
      cunning: 0,
      audacity: 0,
      elegance: 0,
      persuasion: 0,
      resolve: 0
    },
    hand: ['intellect', 'might', 'persuasion', 'veilcraft'],
    drawPile: [],
    discardPile: [],
    exhaustedCards: [],
    deckInitialized: false,
    properties: [],
    completedEvents: [],
    pendingMalus: [],
    // Carte afflizione gia' usate ma con malus ancora attivo: non tornano in
    // mano finche' l'afflizione non arriva a zero. Viene validato al caricamento
    // con gli stessi id ammessi in `pendingMalus`.
    dismissedMalus: [],
    // Which item id sits in each slot, and which items the player owns but has
    // not equipped. Both are validated on load so a stale or hand-edited save
    // can never inject an unknown item into the bonuses.
    equipment: { ...startingEquipment },
    inventory: [],
    // Reputazione con le fazioni: una voce per ogni fazione, in punti, che
    // possono anche essere negativi. Le chiavi ammesse sono controllate in
    // `sanitizeReputation`, cosi' un file importato non puo' iniettare numeri in
    // fazioni inesistenti.
    reputation: {},
    // Lore bookkeeping. `flags` are the branching record: encounters set them
    // and lore gates read them, so the same choice can make a faction an ally or
    // an enemy. `lore` remembers what has been discovered and why.
    flags: {},
    visitedLocations: [],
    lore: { entries: {}, chapters: {} },
    log: []
  },
  currentLocationId: 'grand-canal',
  time: 'day',
  isLoaded: false
};

let progressionMigrationPending = false;

// Lo stato parte vuoto e viene riempito in `boot()`, non qui.
//
// `loadSave()` non e' una funzione autosufficiente: per ripulire il salvataggio
// chiama `sanitizeReputation`, che legge FACTION_XP_FLOOR, e altre costanti che
// sono dichiarate migliaia di righe piu' in giu'. Se la chiamata stesse qui,
// durante la valutazione del modulo quelle `const` non esisterebbero ancora: il
// `catch` di loadSave() prenderebbe il ReferenceError e restituirebbe uno stato
// nuovo e vuoto. Il salvataggio era scritto e integro, ma nessuno lo leggeva mai,
// quindi ogni refresh ripartiva da zero. Lo stesso valeva per le altre tabelle
// usate dai sanitiser.
//
// Caricare in `boot()` sposta la lettura dopo che l'intero modulo e' stato
// valutato, quando tutte le costanti esistono.
let state = createDefaultState();
let currentView = 'tales';
let profileNotice = '';
let resetArmed = false;
let calendarMonthOffset = 0;
let calendarSelectedDay = null;

const trialCards = [
  {
    id: 'intellect',
    title: 'Trial of Intellect',
    rarity: 'common',
    rarityIcon: '✧',
    image: 'immagini/carte/Trial of Intellect.jpg',
    quote: 'The drowned city leaves its answers where only a patient eye can find them.',
    appearanceReason: 'Part of the initial four-card deal or drawn from the common reserve to fill an open hand slot.',
    effects: { statXp: { vigilance: 1 } }
  },
  {
    id: 'might',
    title: 'Trial of Might',
    rarity: 'common',
    rarityIcon: '✧',
    image: 'immagini/carte/Trial of Might.jpg',
    quote: 'A heavy canal mechanism yields only to deliberate force.',
    appearanceReason: 'Part of the initial four-card deal or drawn from the common reserve to fill an open hand slot.',
    effects: { statXp: { audacity: 1 } }
  },
  {
    id: 'persuasion',
    title: 'Trial of Persuasion',
    rarity: 'common',
    rarityIcon: '✧',
    image: 'immagini/carte/Trial of Persuasion.jpg',
    quote: 'A remembered name may open a door that a purse cannot.',
    appearanceReason: 'Part of the initial four-card deal or drawn from the common reserve to fill an open hand slot.',
    effects: { statXp: { persuasion: 1 } }
  },
  {
    id: 'veilcraft',
    title: 'Trial of Veilcraft',
    rarity: 'common',
    rarityIcon: '✧',
    image: 'immagini/carte/Trial of Veilcraft.jpg',
    quote: 'Slip through a dark passage without inviting the watchman’s gaze.',
    appearanceReason: 'Part of the initial four-card deal or drawn from the common reserve to fill an open hand slot.',
    effects: { statXp: { cunning: 1 } }
  }
];

// Le carte che fanno lavorare una fazione.
//
// Sono in due gruppi perche' il gioco le tratta in modo diverso:
//
// - le quattro carte comuni sono aperte dal primo giorno. Servono a dare al
//   giocatore un modo per capire che cosa sia la reputazione e per iniziare a
//   costruirla prima ancora di conoscere i titoli.
// - le quattro uncommon restano chiuse fino al livello 5 della loro fazione,
//   dichiarato in `requires`. Non per nascondere un premio, ma per dare a quel
//   livello una ricompensa che non sia solo un numero che sale: la carta porta
//   con se' la storia di chi ti ha accettato, e arriva quando quella storia e'
//   gia' iniziata.
//
// L'effetto si chiama `standing` e contiene la fazione e i punti:
//
//     effects: { standing: { faction: 'clockwrights', points: 3 } }
//
// I punti sono gli stessi che usano gli incontri in citta', non una scala nuova:
// una carta deve valere quanto il lavoro che ti ha fatto accettare, senno' il
// giocatore sceglie di giocare solo carte e smette di uscire dalle porte.
const factionCards = [
  {
    id: 'common-clockwright-deed',
    title: 'A Job on the Gallows',
    rarity: 'common',
    rarityIcon: '✧',
    symbol: '⛭',
    image: 'immagini/carte/A Job on the Gallos.jpg',
    quote: 'The guild does not ask who you are. It hands you a rag and points at the rust.',
    appearanceReason: 'A common tide card. Once the guild knows your face, the bell-winders start leaving work on the gallery rail for you.',
    effects: { statXp: { vigilance: 1 }, standing: { faction: 'clockwrights', points: 3 } }
  },
  {
    id: 'common-council-copy',
    title: 'Copying a Debt Three Times',
    rarity: 'common',
    rarityIcon: '✧',
    symbol: '✍',
    image: 'immagini/carte/Copying a Debt Three Times.jpg',
    quote: 'Three clerks make the same mistake and only one of them is paid for it.',
    appearanceReason: 'A common tide card. The clerks hire whoever is willing to read the same page until their hand stops shaking.',
    effects: { statXp: { resolve: 1 }, standing: { faction: 'council', points: 3 } }
  },
  {
    id: 'common-combine-shifts',
    title: 'Six Hours on the Vats',
    rarity: 'common',
    rarityIcon: '✧',
    symbol: '☾',
    image: 'immagini/carte/Six Hours on the Vats.jpg',
    quote: 'The phosphor needs clipping and the clipping cannot be done by people who will not come back tomorrow.',
    appearanceReason: 'A common tide card. The farm posts shifts on a board and nobody signs them twice until they have proved they will not leave.',
    effects: { statXp: { resolve: 1 }, standing: { faction: 'brine-combine', points: 3 } }
  },
  {
    id: 'common-salon-timetable',
    title: 'Copying the Timetable by Hand',
    rarity: 'common',
    rarityIcon: '✧',
    symbol: '◈',
    image: 'immagini/carte/Copying the Timetable by Hand.jpg',
    quote: 'Nobody may read the platform timetable. Somebody must still write it out.',
    appearanceReason: 'A common tide card. The Salon outsources its handwriting to whoever cannot be trusted with a route and can be trusted with a pen.',
    effects: { statXp: { elegance: 1 }, standing: { faction: 'astral-salon', points: 3 } }
  },
  {
    id: 'uncommon-guild-escapement-key',
    title: 'The Escapement Key That Is Not On the List',
    rarity: 'uncommon',
    rarityIcon: '✦',
    symbol: '⚙',
    image: 'immagini/carte/The Escapement Key That Is Not On the List.jpg',
    quote: 'There is a key to the great bell that appears in no inventory, and the foreman has begun leaving it where you will find it.',
    appearanceReason: 'An uncommon tide card. It comes out of the reserve only once the guild has you at level 5: by then they have stopped inventing reasons to leave things lying about.',
    effects: { statXp: { vigilance: 2, resolve: 1 }, standing: { faction: 'clockwrights', points: 5 } },
    requires: [{ type: 'faction', faction: 'clockwrights', min: 5 }]
  },
  {
    id: 'uncommon-council-red-clause',
    title: 'The Clause Underlined Twice',
    rarity: 'uncommon',
    rarityIcon: '✦',
    symbol: '❖',
    image: 'immagini/carte/The Clause Underlined Twice.jpg',
    quote: 'Someone underlined your sentence and then, ten years later, someone underlined that they had underlined it.',
    appearanceReason: 'An uncommon tide card. The archive only shows this one to a name it has already decided to keep.',
    effects: { statXp: { cunning: 2, persuasion: 1 }, standing: { faction: 'council', points: 5 } },
    requires: [{ type: 'faction', faction: 'council', min: 5 }]
  },
  {
    id: 'uncommon-combine-rising-water',
    title: 'The Warm Water Rises Another Hand',
    rarity: 'uncommon',
    rarityIcon: '✦',
    symbol: '≋',
    image: 'immagini/carte/The Warm Water Rises Another Hand.jpg',
    quote: 'The vents have been opened without your asking. The Combine does that now, and does not explain itself.',
    appearanceReason: 'An uncommon tide card. It surfaces in the deck only when the farm has begun to take your measure.',
    effects: { statXp: { audacity: 2, resolve: 1 }, standing: { faction: 'brine-combine', points: 5 } },
    requires: [{ type: 'faction', faction: 'brine-combine', min: 5 }]
  },
  {
    id: 'uncommon-salon-last-name',
    title: 'The Name That Was Already on the List',
    rarity: 'uncommon',
    rarityIcon: '✦',
    symbol: '✺',
    image: 'immagini/carte/The Name That Was Already on the List.jpg',
    quote: 'You wrote your own name into a passenger list dated before you were born. The Salon has stopped mentioning it.',
    appearanceReason: 'An uncommon tide card. It does not come out early: the Salon lets you find this one yourself, once you are known.',
    effects: { statXp: { elegance: 2, cunning: 1 }, standing: { faction: 'astral-salon', points: 5 } },
    requires: [{ type: 'faction', faction: 'astral-salon', min: 5 }]
  }
];

const rarityCards = [
  {
    id: 'uncommon-brass-compass',
    title: 'The Brass Compass',
    rarity: 'uncommon',
    rarityIcon: '✦',
    symbol: '⌖',
    image: 'immagini/carte/The Brass Compass.jpg',
    quote: 'Its needle points toward a place you have not yet dared to name.',
    appearanceReason: 'An uncommon tide card, drawn from the reserve according to its rarity.',
    effects: { statXp: { vigilance: 2, resolve: 1 } }
  },
  {
    id: 'rare-moonlit-pass',
    title: 'The Moonlit Pass',
    rarity: 'rare',
    rarityIcon: '✧',
    symbol: '☾',
    image: 'immagini/carte/The Moonlit Pass.jpg',
    quote: 'A conductor’s seal grants one passage through the drowned stations.',
    appearanceReason: 'A rare tide card, drawn from the reserve according to its rarity.',
    effects: { statXp: { elegance: 2, persuasion: 1 }, resources: { ducatsOfSalt: 2 } }
  },
  {
    id: 'epic-drowned-oath',
    title: 'The Drowned Oath',
    rarity: 'epic',
    rarityIcon: '✷',
    symbol: '♜',
    image: 'immagini/carte/The Drowned Oath.jpg',
    quote: 'The old promise answers only to someone willing to pay its price.',
    appearanceReason: 'An epic tide card, drawn from the reserve according to its rarity.',
    effects: { statXp: { resolve: 2, audacity: 1 }, malusChanges: { nightmare: -1 } }
  },
  {
    id: 'legendary-doges-seal',
    title: 'The Doge’s Last Seal',
    rarity: 'legendary',
    rarityIcon: '✹',
    symbol: '♛',
    image: 'immagini/carte/The Doges Last Seal.jpg',
    quote: 'One impression can still open the doors of the drowned palace.',
    appearanceReason: 'A legendary tide card, drawn from the reserve according to its rarity.',
    effects: { statXp: { elegance: 2, cunning: 1 }, malusChanges: { scandal: -1 } }
  },
  {
    id: 'unique-first-light',
    title: 'The First Light Beneath the Sea',
    rarity: 'unique',
    rarityIcon: '✺',
    symbol: '☼',
    image: 'immagini/carte/The First Light Beneath the Sea.jpg',
    quote: 'For one impossible instant, the drowned city remembers the morning.',
    appearanceReason: 'The unique tide card surfaced from the deepest reserve; no second copy exists.',
    effects: { statXp: { vigilance: 3, resolve: 3 }, malusChanges: { nightmare: -1, wounds: -1 } }
  }
];

const rarityWeights = {
  common: 70,
  uncommon: 17,
  rare: 8,
  epic: 3.5,
  legendary: 1.2,
  unique: 0.3
};

const rarityNames = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  unique: 'Unique'
};

const allTideCards = [...trialCards, ...rarityCards, ...factionCards];

const malusCards = [
  {
    id: 'scandal',
    label: 'Scandal',
    asset: 'scandal',
    rarity: 'common',
    title: 'The Slanderous Broadsheet',
    trigger: 'Drawn while Scandal is active',
    description: 'Your notoriety has inspired opportunistic satirists to mock you across the Rialto marketplace.'
  },
  {
    id: 'wounds',
    label: 'Wounds',
    asset: 'wound',
    rarity: 'common',
    title: 'A Body Out of Joint',
    trigger: 'Drawn while Wounds are active',
    description: 'Every stair, rope and cold canal reminds you that the body keeps its own account.'
  },
  {
    id: 'suspicion',
    label: 'Suspicion',
    asset: 'suspicius',
    rarity: 'common',
    title: 'Eyes Behind the Shutters',
    trigger: 'Drawn while Suspicion is active',
    description: 'You have begun to notice the same faces at every bridge, doorway and turning.'
  },
  {
    id: 'nightmare',
    label: 'Nightmare',
    asset: 'nightmare',
    rarity: 'common',
    title: 'The Drowned Dream',
    trigger: 'Drawn while Nightmare is active',
    description: 'Sleep brings the sound of bells from a city that has no air left to ring them.'
  },
  {
    id: 'debt',
    label: 'Debt',
    asset: 'Debt',
    rarity: 'common',
    title: 'A Note Beneath the Door',
    trigger: 'Drawn while Debt is active',
    description: 'The creditor’s seal is fresh. The date beneath it is not.'
  }
];

function createDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function findEquipmentItem(itemId) {
  return equipmentItems.find((item) => item.id === itemId) || null;
}

function getEquipmentSlot(slotKey) {
  return equipmentSlots.find((slot) => slot.key === slotKey) || null;
}

// Rebuilds state.player.equipment from whatever was saved, dropping anything that
// no longer exists in the catalogue or that belongs in a different slot. An
// absent save gets the starting kit, so older chronicles gain the new slots.
function sanitizeEquipment(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : startingEquipment;
  const clean = {};
  equipmentSlots.forEach((slot) => {
    const candidate = source[slot.key];
    const item = typeof candidate === 'string' ? findEquipmentItem(candidate) : null;
    clean[slot.key] = item && item.slot === slot.key ? item.id : null;
  });
  return clean;
}

function sanitizeInventory(raw, equipped) {
  const seen = new Set();
  const equippedIds = new Set(Object.values(equipped).filter(Boolean));
  const source = Array.isArray(raw) ? raw : [];
  return source
    .filter((id) => typeof id === 'string')
    .filter((id) => {
      if (!findEquipmentItem(id) || equippedIds.has(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

// NOTA: qui un tempo c'era `grantMissingStarterItems`, che infilava in inventario
// ogni oggetto del catalogo senza che il giocatore lo avesse ottenuto. Era uno
// impalcatura scritta quando gli oggetti non si guadagnavano davvero, perche' la
// pagina dei pezzi non doveva restare vuota.
//
// Ha smesso di essere innocua quando gli incontri hanno cominciato a consegnare
// roba: regalava anche quella, e la riga dei premi diceva "gia' tuo" per pezzi che
// non avevi mai visto. Se la schermata dei pezzi torna vuota in una partita nuova,
// il problema e' altrove e va risolto lì: non si risolve riaprendo questa porta.

function getEquippedItems() {
  return Object.values(state.player.equipment)
    .filter(Boolean)
    .map(findEquipmentItem)
    .filter(Boolean);
}

// Adds up every bonus from what is worn and carried. Gear only ever adds here:
// bonuses are recomputed on read, never stored, so they cannot drift out of
// sync when something is taken off.
function getEquipmentBonuses() {
  const totals = {
    stats: Object.fromEntries(Object.keys(statNames).map((stat) => [stat, 0])),
    resources: {},
    vigor: 0,
    malusRelief: {}
  };
  getEquippedItems().forEach((item) => {
    Object.entries(item.stats || {}).forEach(([stat, amount]) => {
      if (stat in totals.stats) totals.stats[stat] += Number(amount) || 0;
    });
    Object.entries(item.resources || {}).forEach(([key, amount]) => {
      totals.resources[key] = (totals.resources[key] || 0) + (Number(amount) || 0);
    });
    Object.entries(item.malusRelief || {}).forEach(([key, amount]) => {
      totals.malusRelief[key] = (totals.malusRelief[key] || 0) + (Number(amount) || 0);
    });
    totals.vigor += Number(item.vigor) || 0;
  });
  return totals;
}

function getEquipmentStatBonus(stat) {
  return getEquipmentBonuses().stats[stat] || 0;
}

// Base level plus what the worn gear adds. Rolls and unlock checks read this,
// so equipping a cloak genuinely changes the odds.
function getEffectiveStat(stat) {
  return (state.player.stats[stat] || 0) + getEquipmentStatBonus(stat);
}

// Vigor ceiling rises with gear. Reading it in one place keeps the sidebar, the
// regen timer and the spend check from disagreeing with each other.
function getVigorMax() {
  return VIGOR_MAX + getEquipmentBonuses().vigor;
}

function describeItemBonuses(item) {
  const parts = [];
  Object.entries(item.stats || {}).forEach(([stat, amount]) => {
    if (amount && statNames[stat]) parts.push(`${statNames[stat]} +${amount}`);
  });
  if (item.vigor) parts.push(`Max Vigor +${item.vigor}`);
  Object.entries(item.resources || {}).forEach(([key, amount]) => {
    if (amount) parts.push(`${resourceNames[key] || key} ${amount > 0 ? '+' : ''}${amount}`);
  });
  Object.entries(item.malusRelief || {}).forEach(([key, amount]) => {
    if (amount) parts.push(`Eases ${malusNames[key] || key} by ${amount}`);
  });
  return parts;
}

function loadSave() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return createDefaultState();
  }

  try {
    const parsed = JSON.parse(saved);
    const defaults = createDefaultState();
    const savedVersion = parsed.progressionVersion || 0;
    const legacyProgression = savedVersion < 2;
    const savedScandalSource = parsed.player?.malusSources?.scandal;
    const savedScandalLevel = parsed.player?.malus?.scandal ?? defaults.player.malus.scandal;
    const hadStarterScandal = savedVersion < 4 && (
      savedScandalSource?.event === 'A past indiscretion'
      || (!savedScandalSource && savedScandalLevel === 1)
    );
    progressionMigrationPending = savedVersion < 4;
    const savedMalus = { ...defaults.player.malus, ...(parsed.player?.malus || {}) };
    const savedMalusSources = { ...defaults.player.malusSources, ...(parsed.player?.malusSources || {}) };
    if (hadStarterScandal) {
      savedMalus.scandal = 0;
      delete savedMalusSources.scandal;
    }
    return {
      ...defaults,
      ...parsed,
      progressionVersion: 4,
      // Non sanificata come numero: se per errore contenesse qualcos'altro,
      // il confronto con `updated_at` deve semplicemente dare 0 (cronaca locale
      // vecchia) invece di produrre NaN e far vincere sempre il server.
      savedAt: Number.isFinite(parsed.savedAt) ? Number(parsed.savedAt) : 0,
      player: {
        ...defaults.player,
        ...parsed.player,
        stats: legacyProgression ? { ...defaults.player.stats } : { ...defaults.player.stats, ...(parsed.player?.stats || {}) },
        resources: { ...defaults.player.resources, ...(parsed.player?.resources || {}) },
        vigor: Math.min(VIGOR_MAX, Math.max(0, Number(parsed.player?.vigor ?? defaults.player.vigor))),
        vigorLastRegenAt: Number(parsed.player?.vigorLastRegenAt || defaults.player.vigorLastRegenAt),
        drawTokens: Math.min(10, Math.max(0, Number(parsed.player?.drawTokens ?? defaults.player.drawTokens))),
        drawTokensLastRegenAt: Number(parsed.player?.drawTokensLastRegenAt || defaults.player.drawTokensLastRegenAt),
        malus: Object.fromEntries(Object.entries(savedMalus).map(([key, value]) => [key, Math.min(6, Math.max(0, Number(value) || 0))])),
        malusSources: savedMalusSources,
        statXp: legacyProgression ? { ...defaults.player.statXp } : { ...defaults.player.statXp, ...(parsed.player?.statXp || {}) },
        hand: Array.isArray(parsed.player?.hand) ? parsed.player.hand : defaults.player.hand,
        drawPile: Array.isArray(parsed.player?.drawPile) ? parsed.player.drawPile : [],
        discardPile: Array.isArray(parsed.player?.discardPile) ? parsed.player.discardPile : [],
        exhaustedCards: Array.isArray(parsed.player?.exhaustedCards) ? parsed.player.exhaustedCards : [],
        completedEvents: Array.isArray(parsed.player?.completedEvents) ? parsed.player.completedEvents.filter((entry) => entry && entry.id) : [],
        pendingMalus: Array.isArray(parsed.player?.pendingMalus) ? parsed.player.pendingMalus.filter((key) => typeof key === 'string') : [],
        dismissedMalus: Array.isArray(parsed.player?.dismissedMalus)
          ? parsed.player.dismissedMalus
            .filter((entry) => entry && typeof entry === 'object' && malusCards.some((card) => card.id === entry.id))
            .map((entry) => ({ id: entry.id, level: Math.min(6, Math.max(0, Number(entry.level) || 0)) }))
          : [],
        equipment: sanitizeEquipment(parsed.player?.equipment),
        inventory: sanitizeInventory(parsed.player?.inventory, sanitizeEquipment(parsed.player?.equipment)),
        flags: sanitizeFlags(parsed.player?.flags),
        reputation: sanitizeReputation(parsed.player?.reputation),
        visitedLocations: sanitizeVisited(parsed.player?.visitedLocations),
        lore: sanitizeLore(parsed.player?.lore),
        deckInitialized: Boolean(parsed.player?.deckInitialized)
      }
    };
  } catch (error) {
    return createDefaultState();
  }
}

// Stato della memoria del browser, per poter dire al giocatore la verita'
// invece di fingere che vada tutto bene.
//
// `localStorage` puo' fallire in silenzio in tre modi che capitano spesso: il
// browser lo blocca (modalita' privata, impostazioni del sito), il limite di 5 MB
// e' stato raggiunto, oppure la pagina e' aperta da `file://` dove l'origine e'
// opaca. In tutti e tre i casi `setItem` solleva un'eccezione, e senza questo
// controllo il gioco riporterebbe al giocatore una partita che non e' mai stata
// scritta: si ricarica la pagina, sparisce tutto, e non c'e' nessun indizio del
// perche'.
let storageProblem = '';

// Verifica che la memoria sia davvero utilizzabile, scrivendo e rileggendo una
// chiave di prova. Scrivere non basta: alcuni browser accettano la scrittura e
// poi la perdono al riavvio della pagina.
function diagnoseStorage() {
  const probeKey = `${STORAGE_KEY}-probe`;
  try {
    localStorage.setItem(probeKey, '1');
    const readBack = localStorage.getItem(probeKey);
    localStorage.removeItem(probeKey);
    if (readBack !== '1') return 'This browser accepted a test save and then lost it.';
    return '';
  } catch (error) {
    const name = error?.name || '';
    if (name === 'QuotaExceededError') return 'This browser has run out of storage space.';
    if (name === 'SecurityError') return 'This browser is blocking local storage for this page.';
    return 'This browser refused to store anything on this page.';
  }
}

function saveGame() {
  // `savedAt` serve al conflitto cloud: al login si confronta la cronaca di
  // questo dispositivo con quella sul server e vince la piu' recente. Mettendo
  // il timestamp qui, dentro saveGame, resta valido per ogni percorso di
  // salvataggio senza doverlo ripetere a ogni chiamante.
  state.savedAt = Date.now();

  // La scrittura non deve mai far cadere la chiamata: `saveGame` sta in fondo a
  // ogni azione di gioco, e un'eccezione qui lascerebbe a meta' una mossa che il
  // giocatore ha gia' fatto. Il problema viene invece segnalato, perche' una
  // partita che non viene scritta e' una partita che il giocatore perde al primo
  // refresh, e deve dirglielo.
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageProblem = '';
  } catch (error) {
    storageProblem = diagnoseStorage();
  }

  const saveStatus = document.getElementById('saveStatus');
  if (saveStatus) {
    if (storageProblem) {
      saveStatus.textContent = 'Not saving';
      saveStatus.title = storageProblem;
    } else {
      saveStatus.textContent = 'Autosave complete';
    }
  }
  queueCloudSave();
}

// === Salvataggio online =====================================================
//
// localStorage resta sempre la copia di lavoro: e' sincrona e non puo' fallire,
// il che lo rende l'unico modo affidabile per non perdere una mossa se il
// browser si chiude di colpo. Il cloud e' una copia di sicurezza che si affianca.
//
// `queueCloudSave` non blocca mai il chiamante e non invia a ogni singola
// mossa: `saveGame` gira decine di volte al minuto durante una partita, e un
// upload per mossa costerebbe una richiesta di rete ogni volta. Si accumula
// invece in un flag e parte una volta sola ogni CLOUD_SAVE_DEBOUNCE_MS, con
// l'ultimo stato, cosi' la scrittura rispecchia sempre il punto di arrivo.
const CLOUD_SAVE_DEBOUNCE_MS = 5000;
let cloudSaveTimer = null;

function queueCloudSave() {
  const service = typeof auth !== 'undefined' ? auth : null;
  if (!service || !service.enabled || !service.user) return;
  if (cloudSaveTimer) return;
  // `setTimeout` viene risolto su window per poter essere stubbato dai test,
  // che costruiscono un oggetto window minimale senza timer.
  const schedule = (typeof window !== 'undefined' && window.setTimeout)
    ? window.setTimeout.bind(window)
    : setTimeout;
  cloudSaveTimer = schedule(() => {
    cloudSaveTimer = null;
    const current = typeof auth !== 'undefined' ? auth : null;
    if (!current || !current.enabled || !current.user) return;
    current.pushSave(state).then((outcome) => {
      if (outcome && outcome.ok) {
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus) saveStatus.textContent = 'Saved online';
      }
      // Un errore qui non viene mostrato di proposito: la copia locale e' gia'
      // al sicuro, e spammare un avviso a ogni salvataggio sarebbe peggio
      // del silenzio. L'errore vero e proprio resta in console.
      if (outcome && !outcome.ok && !outcome.skipped) console.warn('[auth] cloud save failed', outcome.reason);
    });
  }, CLOUD_SAVE_DEBOUNCE_MS);
}

function addLog(message, prefix = 'Chronicle', reason = '') {
  state.player.log.unshift({ prefix, message, reason, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
  state.player.log = state.player.log.slice(0, 12);
}

function getStatXpToNextLevel(level) {
  return Number((10 * Math.pow(1.2, level - 1)).toFixed(2));
}

function addStatExperience(stat, amount) {
  if (!(stat in state.player.stats) || amount <= 0) return 0;
  state.player.statXp[stat] = (state.player.statXp[stat] || 0) + amount;
  let levelsGained = 0;
  while (state.player.statXp[stat] >= getStatXpToNextLevel(state.player.stats[stat])) {
    state.player.statXp[stat] -= getStatXpToNextLevel(state.player.stats[stat]);
    state.player.stats[stat] += 1;
    levelsGained += 1;
  }
  state.player.statXp[stat] = Number(state.player.statXp[stat].toFixed(2));
  return levelsGained;
}

function advanceTimedResource(resourceKey, timestampKey, cap, interval, now = Date.now()) {
  const current = Math.max(0, Number(state.player[resourceKey]) || 0);
  let lastUpdated = Number(state.player[timestampKey]) || now;
  if (current >= cap) return { changed: false, remaining: 0 };
  if (lastUpdated > now) lastUpdated = now;

  const elapsed = now - lastUpdated;
  const recovered = Math.floor(elapsed / interval);
  let changed = false;
  if (recovered > 0) {
    state.player[resourceKey] = Math.min(cap, current + recovered);
    lastUpdated += recovered * interval;
    if (state.player[resourceKey] >= cap) lastUpdated = now;
    changed = state.player[resourceKey] !== current;
  }

  state.player[timestampKey] = lastUpdated;
  const progress = Math.max(0, now - lastUpdated) % interval;
  return { changed, remaining: interval - progress };
}

function refreshTimedResources(now = Date.now()) {
  const vigor = advanceTimedResource('vigor', 'vigorLastRegenAt', getVigorMax(), VIGOR_REGEN_INTERVAL, now);
  const draws = advanceTimedResource('drawTokens', 'drawTokensLastRegenAt', DRAW_RESERVE_MAX, DRAW_REGEN_INTERVAL, now);
  return { vigor, draws, changed: vigor.changed || draws.changed };
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatDrawReserve() {
  return `${state.player.drawTokens}/${DRAW_RESERVE_MAX}`;
}

function describeDrawTimer(timer) {
  const cadence = `1 card every ${DRAW_REGEN_MINUTES} min`;

  return state.player.drawTokens >= DRAW_RESERVE_MAX
    ? `Draw reserve full · ${cadence}`
    : `Next card in ${formatCountdown(timer.remaining)} · ${cadence}`;
}

function consumeVigor() {
  refreshTimedResources();
  if (state.player.vigor < 1) return false;
  if (state.player.vigor >= getVigorMax()) state.player.vigorLastRegenAt = Date.now();
  state.player.vigor -= 1;
  return true;
}

function consumeDrawToken() {
  refreshTimedResources();
  if (state.player.drawTokens < 1) return false;
  if (state.player.drawTokens >= DRAW_RESERVE_MAX) state.player.drawTokensLastRegenAt = Date.now();
  state.player.drawTokens -= 1;
  return true;
}

function renderResourceTimers() {
  renderGameClock();
  const vigorDisplay = document.getElementById('vigorDisplay');
  const vigorTimer = document.getElementById('vigorTimer');
  if (vigorDisplay) vigorDisplay.textContent = `${state.player.vigor} / ${getVigorMax()}`;
  if (vigorTimer) {
    const timer = advanceTimedResource('vigor', 'vigorLastRegenAt', getVigorMax(), VIGOR_REGEN_INTERVAL);
    vigorTimer.textContent = state.player.vigor >= getVigorMax() ? 'FULL' : `+1 in ${formatCountdown(timer.remaining)}`;
  }
  const drawTimer = document.getElementById('drawTimer');
  if (drawTimer) {
    const timer = advanceTimedResource('drawTokens', 'drawTokensLastRegenAt', DRAW_RESERVE_MAX, DRAW_REGEN_INTERVAL);
    drawTimer.textContent = describeDrawTimer(timer);
  }
}

function grantExperience(statExperience = {}) {
  const levelUps = [];
  Object.entries(statExperience).forEach(([stat, amount]) => {
    const levels = addStatExperience(stat, amount);
    if (levels) levelUps.push(`${statNames[stat]} +${levels} level${levels === 1 ? '' : 's'}`);
  });
  return levelUps;
}

function queueMalusCard(malusKey) {
  const cardId = `malus-${malusKey}`;
  if (state.player.hand.includes(cardId)) return;
  if (state.player.pendingMalus.includes(malusKey)) return;
  state.player.pendingMalus.push(malusKey);
}

// Fa usare la carta malus e poi la toglie dalla mano, SEMPRE.
//
// La scelta e' deliberata: la carta non e' uno strumento che tieni, e' il
// costo di una lotta. Usarla la consuma, e per abbassare un'afflizione a livello
// alto serve pescarla di nuovo: il gioco ti mette il prezzo davanti, e il prezzo
// e' che il prossimo pescato potrebbe non essere quella.
//
// Prima la carta restava finche' l'afflizione non arrivava a zero, il che
// rendeva il primo uso gratis e gli altri no. Il README promise gia' da prima
// che "your cards are never taken away", quindi la frase andava corretta: qui si
// intende che una carta AFFLIZIONE viene pescata solo per il malus che porta e
// non sostituisce mai una carta tua.
function pruneMalusCard(malusKey) {
  state.player.pendingMalus = state.player.pendingMalus.filter((key) => key !== malusKey);
  state.player.hand = state.player.hand.filter((id) => id !== `malus-${malusKey}`);
}

// Tiene la mano coerente con il mondo intorno.
//
// Il punto delicato e' `dismissed`. Una carta afflizione, quando la si usa,
// sparisce dalla mano anche se l'afflizione resta attiva: va ripescata per
// abbassarla ancora. Senza questo registro, la riga sotto la rimetterebbe in
// coda a ogni sincronizzazione e la carta ricomparirebbe subito, rendendo la
// consumazione inutile.
//
// Il registro ricorda, per ogni afflizione consumata, il livello che aveva
// quando la carta e' stata usata. Se il malus torna a salire (per un incontro o
// una carta), il livello supera quello memorizzato e la carta torna
// disponibile: un'afflizione nuova e' un affare nuovo e non deve ereditare la
// carta gia' spesa. Scendere non basta invece: l'abbassamento e' proprio quello
// che la carta consumata sta ancora pagando.
function syncHandWithActiveMalus() {
  const normalIds = new Set(allTideCards.map((card) => card.id));
  const malusIds = new Set(malusCards.map((card) => `malus-${card.id}`));
  const knownCards = new Set([...normalIds, ...malusIds]);

  state.player.hand = [...new Set(state.player.hand)].filter((id) => knownCards.has(id));

  if (!Array.isArray(state.player.dismissedMalus)) state.player.dismissedMalus = [];
  const validIds = new Set(malusCards.map((card) => card.id));
  state.player.dismissedMalus = state.player.dismissedMalus.filter((entry) => entry && validIds.has(entry.id) && (state.player.malus[entry.id] || 0) > 0);
  // Rimuove i record il cui malus non e' piu' attivo, e cancella dalle mano e
  // dalla coda le carte delle afflizioni chiuse.
  state.player.dismissedMalus.forEach((entry) => pruneMalusCard(entry.id));

  Object.keys(state.player.malus).forEach((key) => {
    const level = state.player.malus[key] || 0;
    if (level <= 0) {
      pruneMalusCard(key);
      // L'afflizione e' sparita: la carta non e' piu' "consumata", e se il
      // malus tornasse a salire la si potrebbe pescare di nuovo.
      state.player.dismissedMalus = state.player.dismissedMalus.filter((entry) => entry?.id !== key);
      return;
    }
    if (state.player.dismissedMalus.some((entry) => entry?.id === key && level <= (entry.level ?? 0))) return;
    // Il malus e' salito oltre il livello segnato: e' un'afflizione nuova, la
    // carta torna disponibile anche se ne avevi gia' speso una.
    state.player.dismissedMalus = state.player.dismissedMalus.filter((entry) => entry?.id !== key);
    queueMalusCard(key);
  });

  const inHand = new Set(state.player.hand);
  state.player.pendingMalus = [...new Set(state.player.pendingMalus)].filter((key) => state.player.malus[key] > 0 && !inHand.has(`malus-${key}`));
  state.player.drawPile = [...new Set(state.player.drawPile)].filter((id) => normalIds.has(id) && !inHand.has(id));
}

// Segna una carta afflizione come usata, insieme al livello che aveva in questo
// momento: dopo questa chiamata non torna in mano finche' il malus non supera
// quel livello. Va chiamata subito dopo averla giocata.
function dismissMalusCard(malusKey) {
  if (!Array.isArray(state.player.dismissedMalus)) state.player.dismissedMalus = [];
  const level = state.player.malus[malusKey] || 0;
  const at = { id: malusKey, level };
  const existing = state.player.dismissedMalus.findIndex((entry) => entry?.id === malusKey);
  // Se una carta identica era gia' stata consumata, si tiene solo la consumazione
  // piu' recente: e' quella che conta, perche' riflette l'afflizione ancora aperta.
  if (existing === -1) state.player.dismissedMalus.push(at);
  else state.player.dismissedMalus[existing] = at;
  pruneMalusCard(malusKey);
}

// Allinea la cronaca di un giocatore al catalogo attuale del gioco.
//
// Il problema che risolve: il gioco cresce, ma una partita vecchia e' uno
// snapshot di com'e' stato quando l'hai iniziata. Aggiungere una carta, un
// incontro, una fazione o una voce di cronaca non la raggiunge, e il giocatore
// continua a giocare a un mondo incompleto senza saperlo. Ogni volta che si
// aggiunge contenuto si dovrebbe ricordare di sistemare anche le partite aperte:
// sono due elenchi da tenere allineati a mano, ed e' il tipo di promessa che si
// dimentica.
//
// Qui invece il catalogo e' l'unica fonte di verita' e questa funzione legge
// quello, non una lista di carte nuove scritta a parte. Aggiungere contenuto e'
// sufficiente: non c'e' niente da ricordare.
//
// Cosa allinea, e perche' una cosa sola vale per tutte: la differenza fra "il
// giocatore non ha ancora visto" e "il giocatore non ha mai potuto vedere".
//
// - carte nel mazzo: una carta nuova non entra nel mucchio se il mucchio e' stato
//   riempito una volta sola, al primo avvio;
// - cronaca: si riscrive a ogni partenza e si scopre da sola in base a quello che
//   il giocatore ha ottenuto, quindi una voce nuova e' subito raggiungibile;
// - malus e fazioni: derivano dal catalogo, non vanno toccati, ma vengono
//   comunque verificati perche' il chiamante e' generico.
//
// Quello che NON deve fare e' spostare contenuto gia' giocato: una carta in mano
// resta in mano, un incontro superato resta superato, una voce di cronaca letta
// resta letta. Il giocatore non deve perdere nulla perche' il gioco e' cresciuto
// mentre lui non guardava.
function syncContentWithCatalog() {
  const player = state.player;
  const report = { cardsAdded: 0 };

  // Il mazzo, che e' l'unica collezione che congela. Una carta manca se non e'
  // gia' in mano, non e' nella pila degli scarti e non e' fra le esaurite: chi e'
  // esaurita non torna indietro, e chi e' in mano non deve duplicarsi.
  const inPlay = new Set([
    ...player.hand,
    ...player.drawPile,
    ...player.discardPile,
    ...player.exhaustedCards
  ]);
  const missing = allTideCards.map((card) => card.id).filter((id) => !inPlay.has(id));
  if (missing.length) {
    player.drawPile = [...player.drawPile, ...missing];
    report.cardsAdded = missing.length;
  }

  return report;
}

function initializeTideDeck() {
  if (!state.player.deckInitialized) {
    const cardsInHand = new Set(state.player.hand);
    state.player.drawPile = allTideCards.map((card) => card.id).filter((id) => !cardsInHand.has(id));
    state.player.deckInitialized = true;
  }
  syncContentWithCatalog();
  syncHandWithActiveMalus();
}

// Una carta e' nel mazzo, ma e' ancora chiusa.
//
// Le carte possono dichiarare `requires` con gli stessi requisiti degli
// incontri: se ne dichiarano, si applicano come per un incontro. Una carta senza
// requisiti e' sempre aperta.
//
// Il controllo vale sul pescato, non sul mazzo: una carta chiusa resta nel
// mucchio e si apre da sola quando il livello arriva. Toglierla dal mazzo la
// farebbe sparire, che e' il contrario di un premio.
function isCardAvailable(cardId) {
  const card = allTideCards.find((entry) => entry.id === cardId);
  if (!card || !Array.isArray(card.requires) || !card.requires.length) return true;
  return card.requires.every((requirement) => describeRequirement(requirement).met);
}

function drawTideCard() {
  refreshTimedResources();
  syncHandWithActiveMalus();
  if (state.player.hand.length >= 4) return;
  if (state.player.drawTokens < 1 || state.player.vigor < 1) return;
  if (!state.player.drawPile.length) {
    state.player.drawPile = [...new Set(state.player.discardPile)].filter((id) => !state.player.exhaustedCards.includes(id));
    state.player.discardPile = [];
  }

  // Una carta chiusa non entra nel sorteggio, ma resta nel mazzo: e' il premio di
  // un livello che ancora non e' stato raggiunto, e toglierla dal mucchio la
  // farebbe sparire per sempre. Il filtro e' sul momento del pescato e non sullo
  // stato del mazzo, cosi' la carta si apre da sola quando il livello arriva.
  const available = state.player.drawPile.filter((id) => isCardAvailable(id));
  const eligible = available.map((id) => allTideCards.find((card) => card.id === id)).filter(Boolean);
  const pendingMalus = state.player.pendingMalus.filter((key) => state.player.malus[key] > 0);
  const availableRarities = [...new Set(eligible.map((card) => card.rarity))];
  const normalWeight = availableRarities.reduce((sum, rarity) => sum + rarityWeights[rarity], 0);
  const malusWeight = pendingMalus.length * MALUS_DRAW_WEIGHT;
  if (!normalWeight && !malusWeight) return;

  const totalWeight = normalWeight + malusWeight;
  const roll = Math.random() * totalWeight;
  let malusDraw = null;
  let drawnCard = null;

  if (malusWeight && roll < malusWeight) {
    const index = Math.min(pendingMalus.length - 1, Math.floor((roll / malusWeight) * pendingMalus.length));
    malusDraw = malusCards.find((card) => card.id === pendingMalus[index]);
  }

  if (!malusDraw) {
    let rarityRoll = roll - malusWeight;
    const selectedRarity = availableRarities.find((rarity) => {
      rarityRoll -= rarityWeights[rarity];
      return rarityRoll < 0;
    }) || availableRarities[availableRarities.length - 1];
    const rarityPool = eligible.filter((card) => card.rarity === selectedRarity);
    drawnCard = rarityPool[Math.floor(Math.random() * rarityPool.length)];
  }

  if (!malusDraw && !drawnCard) return;
  if (!consumeVigor() || !consumeDrawToken()) return;

  if (malusDraw) {
    state.player.hand.push(`malus-${malusDraw.id}`);
    state.player.pendingMalus = state.player.pendingMalus.filter((key) => key !== malusDraw.id);
    const odds = Math.round((MALUS_DRAW_WEIGHT / totalWeight) * 100);
    addLog(`${malusDraw.title} surfaced in your hand.`, 'Card Drawn', `${malusDraw.trigger} It came out of the deck only because ${malusDraw.label} is upon you; playing it lowers the affliction by one level.`);
    saveGame();
    render();
    openResolution({
      eyebrow: 'An affliction card, drawn',
      title: malusDraw.title,
      subtitle: malusDraw.description,
      tone: 'neutral',
      draw: {
        image: `immagini/carte/malus ${malusDraw.asset} low.jpg`,
        detail: `${malusDraw.label} · ${odds}% of this draw`
      },
      narrative: 'The tide gives up something you would rather not hold. Still, it is in your hand now.',
      rows: [{ tone: 'gold', label: 'Hand slot', value: `${state.player.hand.length} of 4` }],
      note: 'Playing it costs 1 Vigor and lowers the affliction by one level. The card is spent when you play it, so an affliction lasting several levels has to be fought one draw at a time.'
    });
    return;
  }

  state.player.drawPile = state.player.drawPile.filter((id) => id !== drawnCard.id);
  state.player.hand.push(drawnCard.id);
  const poolOdds = Math.round((rarityWeights[drawnCard.rarity] / totalWeight) * 100);
  addLog(`${drawnCard.title} entered your hand.`, 'Card Drawn', `${drawnCard.appearanceReason} Base rarity chance: ${rarityWeights[drawnCard.rarity]}%.`);
  saveGame();
  render();

  openResolution({
    eyebrow: 'Drawn from the tide deck',
    title: drawnCard.title,
    subtitle: drawnCard.quote,
    tone: 'neutral',
    draw: {
      image: drawnCard.image,
      sigil: drawnCard.symbol,
      detail: `${rarityNames[drawnCard.rarity]} · ${poolOdds}% of the pool you drew from`
    },
    narrative: 'The current turns the card and gives it to you.',
    rows: [{ tone: 'gold', label: 'Hand slot', value: `${state.player.hand.length} of 4` }],
    note: `Base rarity chance ${rarityWeights[drawnCard.rarity]}%. Drawing costs 1 Vigor and 1 draw reserve.`
  });
}

function discardTideCard(cardId) {
  if (cardId.startsWith('malus-')) return;
  if (state.player.malus[cardId] !== undefined) return;
  const cardIndex = state.player.hand.indexOf(cardId);
  if (cardIndex === -1) return;
  if (!consumeVigor()) {
    addLog('You are too exhausted to discard a card.', 'Vigor', 'Discarding a card costs 1 Vigor; Vigor returns by 1 point every 5 minutes.');
    render();
    return;
  }
  const [card] = state.player.hand.splice(cardIndex, 1);
  state.player.discardPile.push(card);
  const cardData = allTideCards.find((entry) => entry.id === cardId);
  addLog(`${cardData.title} was discarded from your hand.`, 'Card Discarded', 'You chose to discard this non-malus card. Affliction cards cannot be discarded; to get rid of one you must play it and lower the malus it carries.');
  saveGame();
  render();
}

function playTideCard(cardId) {
  const activeMalus = malusCards.find((card) => `malus-${card.id}` === cardId);
  if (activeMalus) {
    const currentLevel = state.player.malus[activeMalus.id] || 0;
    if (!currentLevel) return;
    if (!consumeVigor()) {
      addLog('You are too exhausted to confront this affliction.', 'Vigor', 'Playing any card costs 1 Vigor; Vigor returns by 1 point every 5 minutes.');
      render();
      return;
    }
    const snapshot = snapshotPlayer();
    state.player.malus[activeMalus.id] = Math.max(0, currentLevel - 1);
    if (state.player.malus[activeMalus.id] === 0) {
      delete state.player.malusSources[activeMalus.id];
    }
    // Usare la carta la consuma a ogni uso, non solo quando l'afflizione arriva
    // a zero. Se il livello e' ancora > 0 la carta torna disponibile solo con un
    // nuovo pescato.
    const afflictionLifted = state.player.malus[activeMalus.id] === 0;
    dismissMalusCard(activeMalus.id);
    const resolveLevels = addStatExperience('resolve', 1);
    const levelText = afflictionLifted
      ? 'The affliction has lifted and its card is gone from your hand.'
      : `The affliction falls to level ${state.player.malus[activeMalus.id]}, and the card is spent: you would have to draw it again to push it lower.`;
    addLog(`${activeMalus.title} is played. ${levelText}`, 'Affliction Played', `You chose to confront ${activeMalus.label}; playing the card costs 1 Vigor, reduces its malus by one level, spends the card and grants 1 Resolve XP${resolveLevels ? ', increasing Resolve by one level' : ''}.`);
    syncHandWithActiveMalus();
    saveGame();
    render();

    openResolution({
      eyebrow: 'Menace affliction played',
      title: activeMalus.title,
      subtitle: activeMalus.description,
      tone: 'neutral',
      die: { text: '−1', detail: `${activeMalus.label} reduced by one level` },
      narrative: levelText,
      rows: diffSnapshots(snapshot, state.player),
      note: 'Playing any card costs 1 Vigor. Affliction cards are spent when played: draw them again to keep working on the same malus.'
    });
    return;
  }

  const cardIndex = state.player.hand.indexOf(cardId);
  const card = allTideCards.find((entry) => entry.id === cardId);
  if (cardIndex === -1 || !card) return;
  if (!consumeVigor()) {
    addLog('You are too exhausted to play a card.', 'Vigor', 'Playing any card costs 1 Vigor; Vigor returns by 1 point every 5 minutes.');
    render();
    return;
  }
  const snapshot = snapshotPlayer();
  state.player.hand.splice(cardIndex, 1);
  const levelUps = grantExperience(card.effects?.statXp);
  const malusChanges = [];
  Object.entries(card.effects?.malusChanges || {}).forEach(([malus, change]) => {
    const previousLevel = state.player.malus[malus] || 0;
    const nextLevel = Math.min(6, Math.max(0, previousLevel + change));
    state.player.malus[malus] = nextLevel;
    if (nextLevel === 0) delete state.player.malusSources[malus];
    if (nextLevel !== previousLevel) malusChanges.push(`${malus} ${change > 0 ? '+' : ''}${nextLevel - previousLevel} level`);
  });
  Object.entries(card.effects?.resources || {}).forEach(([resource, amount]) => {
    state.player.resources[resource] = (state.player.resources[resource] || 0) + amount;
  });
  // La reputazione guadagnata dalla carta. I punti si sommano a quello che aveva
  // gia', letto sulla copia fatta all'inizio, non a quello appena modificato.
  const standingResult = applyCardStanding(card, snapshot);
  if (card.rarity === 'unique') state.player.exhaustedCards.push(card.id);
  else state.player.discardPile.push(card.id);
  const rewardText = Object.entries(card.effects?.statXp || {}).map(([stat, amount]) => `${statNames[stat]} +${amount} XP`).join(', ');
  const levelText = [...levelUps, ...malusChanges].join('; ');
  const standingText = standingResult ? ` ${standingResult.faction.name} +${standingResult.gained} standing.` : '';
  addLog(`${card.title} is played. ${rewardText}${levelText ? ` (${levelText})` : ''}.${standingText}`, 'Card Played', `${card.appearanceReason} Playing a card costs 1 Vigor.`);
  syncHandWithActiveMalus();
  saveGame();
  render();

  openResolution({
    eyebrow: `${card.rarityIcon} ${rarityNames[card.rarity]} tide card`,
    title: card.title,
    subtitle: card.quote,
    tone: 'neutral',
    die: { text: rarityNames[card.rarity], detail: `${rarityWeights[card.rarity]}% base rarity` },
    narrative: card.quote,
    // La riga di standing entra insieme alle altre: il giocatore deve vedere
    // subito che cosa gli ha fatto guadagnare, non indovinarlo dalla pagina
    // delle fazioni dopo.
    rows: [...diffSnapshots(snapshot, state.player), ...describeCardStanding(standingResult)],
    note: `Playing a card costs 1 Vigor.${card.rarity === 'unique' ? ' This unique card is now exhausted and cannot return.' : ''}`
  });
}

// Le righe che la finestra mostra per la reputazione guadagnata da una carta.
//
// Stessa forma di `describeStandingChange`, che e' quella degli incontri in
// citta': le due sono la stessa notizia detta in due momenti diversi, e se
// dicessero cose diverse il giocatore non saprebbe quale delle due sia quella
// vera.
function describeCardStanding(standing) {
  if (!standing || !standing.gained) return [];
  const rows = [{ tone: 'gold', label: `${standing.faction.name} standing`, value: `+${standing.gained}` }];
  if (standing.promoted) {
    rows.push({ tone: 'gold', label: 'Standing', value: `Level ${standing.levelBefore} to ${standing.levelAfter}` });
  }
  if (standing.newTitle) {
    rows.push({ tone: 'gold', label: 'They call you', value: standing.tier.title });
  }
  return rows;
}

function canAccessAction(action) {
  return describeActionUnlock(action).met;
}

function canAfford(cost) {
  if (!cost) return true;

  return Object.entries(cost).every(([key, value]) => {
    if (key in state.player.resources) {
      return state.player.resources[key] >= value;
    }
    return true;
  });
}

function spendCost(cost) {
  if (!cost) return;

  Object.entries(cost).forEach(([key, value]) => {
    if (key in state.player.resources) {
      state.player.resources[key] = (state.player.resources[key] || 0) - value;
    }
  });
}

function applyReward(reward, source = null) {
  if (!reward) return;

  // Branching flags live on the outcome itself, so success and failure can pull
  // the chronicle in different directions. Recording them here means a choice is
  // remembered even if the player never opens the lore page.
  if (reward.sets) {
    Object.entries(reward.sets).forEach(([flag, value]) => {
      if (flag in loreFlags) state.player.flags[flag] = Boolean(value);
    });
  }

  if (reward.stats) {
    Object.entries(reward.stats).forEach(([key, value]) => {
      addStatExperience(key, value);
    });
  }

  if (reward.experience) {
    grantExperience(reward.experience);
  }

  if (reward.resources) {
    Object.entries(reward.resources).forEach(([key, value]) => {
      if (key in state.player.resources) {
        state.player.resources[key] = (state.player.resources[key] || 0) + value;
      } else if (key in state.player.malus) {
        const previousLevel = state.player.malus[key] || 0;
        const nextLevel = Math.min(6, Math.max(0, previousLevel + value));
        state.player.malus[key] = nextLevel;
        if (nextLevel > previousLevel && source?.action) {
          const sourceReward = source.outcome === 'Failure' ? source.action.failure : source.action.success;
          state.player.malusSources[key] = {
            event: source.action.title,
            outcome: source.outcome,
            reason: sourceReward?.log || `${source.action.title} left a lasting mark.`
          };
        } else if (nextLevel === 0) {
          delete state.player.malusSources[key];
        }
      }
    });
  }

  if (reward.properties) {
    reward.properties.forEach((property) => {
      if (!state.player.properties.includes(property)) {
        state.player.properties.push(property);
      }
    });
  }

  // Oggetti. L'id si risolve sul catalogo: se un incontro nomina un oggetto che
  // non esiste, o che e' stato tolto dal catalogo in un aggiornamento, l'incontro
  // resta giocabile e semplicemente non dà niente. Fermare il gioco per un dato
  // rotto sarebbe molto peggio che perderlo.
  //
  // Un oggetto non si duplica in inventario: quello che si possiede gia' resta
  // quello, e non viene conteggiato due volte. Il caso vero pero' e' l'esaurito:
  // un oggetto consumato non torna.
  if (reward.items) {
    reward.items.forEach((itemId) => {
      const item = findEquipmentItem(itemId);
      if (!item) return;
      if (state.player.equipment[item.slot] === item.id) return;
      if (state.player.inventory.includes(item.id)) return;
      state.player.inventory.push(item.id);
    });
  }
}

const RESOLUTION_ROLL_MS = 1300;
const RESOLUTION_SETTLE_MS = 900;
const SUSPENSE_LINES = [
  'The die turns…',
  'The lagoon holds its breath…',
  'Fate weighs itself…',
  'A moment decides everything…',
  'The water waits for an answer…',
  'Nothing is decided yet…'
];

let resolutionTimers = [];

function snapshotPlayer() {
  return {
    stats: { ...state.player.stats },
    statXp: { ...state.player.statXp },
    resources: { ...state.player.resources },
    malus: { ...state.player.malus },
    // Anche la reputazione, perche' una carta puo' darla: senza questa copia la
    // finestra di risoluzione non avrebbe con cosa mostrare il guadagno.
    reputation: { ...(state.player.reputation || {}) },
    // Inventario ed equipaggiamento servono al confronto di `diffSnapshots` per
    // capire quale oggetto e' appena finito in borsa: senza la copia di prima, la
    // finestra di risoluzione non avrebbe modo di distinguere una novita' da un
    // pezzo che il giocatore aveva gia'.
    inventory: [...state.player.inventory],
    equipment: { ...state.player.equipment },
    properties: [...state.player.properties]
  };
}

// La reputazione che una carta concede, se concede.
//
// Non chiama `awardFactionStanding`: quello e' legato al lavoro svolto in una
// zona, prende la fazione dal luogo e toglie punti all'avversaria. Una carta e'
// un'altra cosa. Qui la fazione e' scritta sulla carta, i punti sono quelli
// dichiarati, e l'avversaria non paga nulla: la carta e' una cortesia del mazzo,
// non un impegno nella citta'. Se il mazzo potesse spendere il favore di un
// rivale, il giocatore potrebbe comprare la neutralita' a prezzo.
function applyCardStanding(card, before) {
  const effect = card.effects?.standing;
  if (!effect) return null;
  const faction = factions[effect.faction];
  // Una carta che nomina una fazione inesistente e' un dato rotto: si ignora
  // l'effetto invece di fermare il gioco, cosi' la carta resta giocabile e il
  // problema si vede in un test e non in una partita.
  if (!faction) return null;

  const points = Number(effect.points) || 0;
  const beforeXp = (before?.reputation?.[faction.id] ?? 0);
  const beforeLevel = factionLevelFromXp(beforeXp);
  setFactionXp(faction.id, beforeXp + points);
  const afterXp = getFactionXp(faction.id);
  const afterLevel = factionLevelFromXp(afterXp);

  return {
    faction,
    points,
    gained: Math.round(afterXp - beforeXp),
    levelBefore: beforeLevel,
    levelAfter: afterLevel,
    promoted: afterLevel > beforeLevel,
    tier: factionTierForLevel(faction, afterLevel),
    newTitle: factionTierForLevel(faction, afterLevel).level !== factionTierForLevel(faction, beforeLevel).level
  };
}

function diffSnapshots(before, after) {
  const rows = [];

  Object.entries(statNames).forEach(([stat, label]) => {
    const levels = after.stats[stat] - before.stats[stat];
    const xp = Math.round(((after.statXp[stat] || 0) - (before.statXp[stat] || 0)) * 100) / 100;
    if (levels) {
      rows.push({ tone: 'good', label, value: `Level +${levels}${xp > 0 ? ` · ${xp} XP` : ''}` });
    } else if (xp > 0) {
      rows.push({ tone: 'good', label, value: `${xp} XP` });
    }
  });

  Object.entries(resourceNames).forEach(([key, label]) => {
    const delta = (after.resources[key] || 0) - (before.resources[key] || 0);
    if (delta) rows.push({ tone: delta > 0 ? 'good' : 'bad', label, value: `${delta > 0 ? '+' : ''}${delta}` });
  });

  Object.entries(malusNames).forEach(([key, label]) => {
    const delta = (after.malus[key] || 0) - (before.malus[key] || 0);
    if (delta) rows.push({ tone: delta > 0 ? 'bad' : 'good', label, value: `${delta > 0 ? '+' : ''}${delta} level${Math.abs(delta) === 1 ? '' : 's'}` });
  });

  after.properties.filter((property) => !before.properties.includes(property)).forEach((property) => {
    rows.push({ tone: 'gold', label: 'Property claimed', value: property });
  });

  // Gli oggetti devono comparire nella finestra di risoluzione. Un pezzo appena
  // finito in borsa senza che nessuno lo dica e' la parte migliore della riuscita
  // che sparisce: il giocatore vede il dado e i numeri, esce dalla finestra, e non
  // sa che gli e' capitato qualcosa fra le mani.
  //
  // Il confronto e' fra la copia di prima e lo stato di adesso, e guarda l'unica
  // cosa che conta: un id che non era posseduto prima e che e' posseduto adesso.
  // Non si controlla se l'oggetto e' "nuovo" nel catalogo, perche' un oggetto
  // vecchio che il giocatore non aveva e' una novita' esattamente come uno appena
  // scritto.
  const ownedBefore = new Set([
    ...(before.inventory || []),
    ...Object.values(before.equipment || {}).filter(Boolean)
  ]);
  const ownedNow = [
    ...Object.values(state.player.equipment).filter(Boolean),
    ...state.player.inventory
  ];
  const freshItems = ownedNow.filter((itemId) => !ownedBefore.has(itemId));

  freshItems.forEach((itemId) => {
    const item = findEquipmentItem(itemId);
    if (!item) return;
    const slotLabel = equipmentSlots.find((slot) => slot.key === item.slot)?.label || item.slot;
    rows.push({ tone: 'good', label: 'Item gained', value: `${item.name} (${slotLabel})` });
  });

  return rows;
}

function getTestChance(action) {
  const statValue = getEffectiveStat(action.test);
  const difficulty = action.difficulty || 0;

  return Math.min(95, Math.max(25, 60 + (statValue - difficulty) * 8));
}

function chanceTone(chance) {
  if (chance >= 70) return 'good';
  if (chance >= 45) return 'mid';

  return 'bad';
}

function rollTest(action) {
  const chance = getTestChance(action);
  const roll = Math.floor(Math.random() * 100) + 1;

  return { roll, chance, success: roll <= chance };
}

function renderResolutionDie(die) {
  if (!die) return '';

  if (die.text) {
    return `
      <div class="resolution-die is-text">
        <div class="die-face"><span class="die-text">${die.text}</span></div>
        ${die.detail ? `<p class="die-detail">${die.detail}</p>` : ''}
      </div>
    `;
  }

  const filled = Math.min(100, die.value);
  const threshold = Math.min(100, die.threshold);

  return `
    <div class="resolution-die">
      <div class="die-face"><span class="die-value">${die.value}</span></div>
      <p class="die-detail">${die.detail}</p>
      <div class="die-track" aria-hidden="true"><i style="width:${filled}%"></i><b style="left:${threshold}%"></b></div>
    </div>
  `;
}

function renderResolutionDraw(draw) {
  if (!draw) return '';

  const art = draw.image
    ? `<img src="${draw.image}" alt="" />`
    : `<span class="draw-sigil" aria-hidden="true">${draw.sigil || '✦'}</span>`;

  return `
    <div class="resolution-draw">
      <div class="draw-card">
        <div class="draw-card-inner">
          <div class="draw-face draw-back" aria-hidden="true"><span class="draw-back-mark">✦</span></div>
          <div class="draw-face draw-front">${art}</div>
        </div>
      </div>
      ${draw.detail ? `<p class="die-detail">${draw.detail}</p>` : ''}
    </div>
  `;
}

function buildResolutionMarkup(payload) {
  const rows = (payload.rows || []).map((row) => `
    <div class="resolution-row tone-${row.tone}">
      <span class="resolution-row-label">${row.label}</span>
      <span class="resolution-row-value">${row.value}</span>
    </div>
  `).join('');

  return `
    <div class="resolution-window tone-${payload.tone || 'neutral'}" role="dialog" aria-modal="true" aria-labelledby="resolutionTitle">
      <p class="eyebrow">${payload.eyebrow}</p>
      <h2 class="resolution-title" id="resolutionTitle">${payload.title}</h2>
      ${payload.subtitle ? `<p class="resolution-subtitle">${payload.subtitle}</p>` : ''}
      ${payload.draw ? renderResolutionDraw(payload.draw) : renderResolutionDie(payload.die)}
      <p class="resolution-suspense" data-suspense>${SUSPENSE_LINES[0]}</p>
      <div class="resolution-body" data-body>
        <p class="resolution-narrative">${payload.narrative || ''}</p>
        ${rows ? `<div class="resolution-rows" data-rows>${rows}</div>` : ''}
        ${payload.note ? `<p class="resolution-note">${payload.note}</p>` : ''}
      </div>
      <button type="button" class="resolution-close" data-resolution-close disabled>Continue</button>
    </div>
  `;
}

function clearResolutionTimers() {
  resolutionTimers.forEach((timer) => clearTimeout(timer));
  resolutionTimers = [];
}

function closeResolution() {
  const overlay = document.getElementById('resolutionOverlay');
  if (!overlay || overlay.hidden) return;
  clearResolutionTimers();
  overlay.classList.remove('is-open');
  overlay.hidden = true;
  overlay.innerHTML = '';
}

function openResolution(payload) {
  const overlay = document.getElementById('resolutionOverlay');
  if (!overlay) return;
  clearResolutionTimers();

  overlay.innerHTML = buildResolutionMarkup(payload);
  overlay.hidden = false;
  overlay.classList.add('is-open', 'is-rolling');

  SUSPENSE_LINES.forEach((line, index) => {
    if (!index) return;
    resolutionTimers.push(setTimeout(() => {
      const suspense = overlay.querySelector('[data-suspense]');
      if (suspense) suspense.textContent = line;
    }, 220 * index));
  });

  resolutionTimers.push(setTimeout(() => {
    overlay.classList.remove('is-rolling');
    overlay.classList.add('is-revealed');
  }, RESOLUTION_ROLL_MS));

  resolutionTimers.push(setTimeout(() => {
    overlay.classList.add('is-settled');
    const closeButton = overlay.querySelector('[data-resolution-close]');
    if (closeButton) closeButton.disabled = false;
  }, RESOLUTION_ROLL_MS + RESOLUTION_SETTLE_MS));
}

function resolveAction(actionId) {
  const location = locations[state.currentLocationId];
  const action = location.actions.find((entry) => entry.id === actionId);

  if (!action) {
    return;
  }

  if (!canAccessAction(action)) {
    addLog(`A locked path blocks your way: ${action.title}.`, 'Locked', getActionLockReason(action));
    render();
    return;
  }

  if (!canAfford(action.cost)) {
    addLog(`Your purse is not sufficient for ${action.title}.`, 'Economy', `${summarizeUnlock(action)} You cannot afford its listed cost yet.`);
    render();
    return;
  }

  if (!consumeVigor()) {
    addLog('You are too exhausted to take another action.', 'Vigor', 'Every city action costs 1 Vigor; Vigor returns by 1 point every 5 minutes.');
    render();
    return;
  }

  spendCost(action.cost);
  const snapshot = snapshotPlayer();
  const test = rollTest(action);
  const { success } = test;
  const outcomeReward = success ? action.success : action.failure;
  const explicitStatXp = outcomeReward.stats || {};
  const eventXp = explicitStatXp[action.test] || (success ? 3 : 1);
  const xpGains = { ...explicitStatXp, [action.test]: eventXp };
  const startingStats = { ...state.player.stats };
  if (!(action.test in explicitStatXp)) addStatExperience(action.test, eventXp);
  const experienceText = Object.entries(xpGains).map(([stat, amount]) => `${statNames[stat]} +${amount} XP`).join('; ');
  let dropped = [];
  // Il risultato della reputazione, mostrato nella finestra di risoluzione.
  // Resta null se il fallimento o se la zona non ha una fazione: in quel caso
  // la finestra semplicemente non ne parla.
  let standing = null;

  if (success) {
    applyReward(action.success, { action, outcome: 'Success' });
    dropped = grantChanceRewards(action);
    standing = awardFactionStanding(action, state.currentLocationId);
    const levelChanges = Object.entries(statNames).filter(([stat]) => state.player.stats[stat] > startingStats[stat]).map(([stat, label]) => `${label} +${state.player.stats[stat] - startingStats[stat]} level${state.player.stats[stat] - startingStats[stat] === 1 ? '' : 's'}`);
    addLog(`${action.success.log || `${action.title} succeeds.`} ${experienceText}${levelChanges.length ? `; ${levelChanges.join(', ')}` : ''}.${describeChanceOutcome(dropped)}${standing ? ` ${standing.faction.name} remembers you as ${standing.tier.title}.` : ''}`, 'Success', `${summarizeUnlock(action)} ${action.appearanceReason}`);
  } else {
    applyReward(action.failure, { action, outcome: 'Failure' });
    const levelChanges = Object.entries(statNames).filter(([stat]) => state.player.stats[stat] > startingStats[stat]).map(([stat, label]) => `${label} +${state.player.stats[stat] - startingStats[stat]} level${state.player.stats[stat] - startingStats[stat] === 1 ? '' : 's'}`);
    addLog(`${action.failure.log || `${action.title} fails and leaves a mark upon you.`} ${experienceText}${levelChanges.length ? `; ${levelChanges.join(', ')}` : ''}.`, 'Failure', `${summarizeUnlock(action)} ${action.appearanceReason}`);
  }

  recordEventCompletion(action, success ? 'Success' : 'Failure');
  syncHandWithActiveMalus();
  // Fresh flags may have just been set, so give the record a chance to grow.
  refreshLoreDiscovery();
  saveGame();
  render();

  const phase = getDayPhase();
  openResolution({
    eyebrow: `${statNames[action.test]} test · Difficulty ${action.difficulty} · ${phase.icon} ${phase.label}`,
    title: action.title,
    subtitle: location.realm,
    tone: success ? 'success' : 'failure',
    die: { value: test.roll, threshold: test.chance, detail: `You needed ${test.chance} or lower to pass` },
    narrative: outcomeReward.log || (success ? `${action.title} succeeds.` : `${action.title} fails and leaves a mark upon you.`),
    rows: [...diffSnapshots(snapshot, state.player), ...describeStandingChange(standing)],
    note: success ? (dropped.length ? describeChanceOutcome(dropped).trim() : 'No chance reward fell this time.') : 'A failed test yields no chance reward.'
  });
}

// La riga di reputazione che compare nella finestra di risoluzione.
//
// Sale di livello e guadagno normale hanno parole diverse perche' sono eventi
// diversi: il primo e' una tappa, il secondo e' il passo che porta alla tappa.
// Confonderli renderebbe il messaggio piatto, che e' esattamente il difetto che
// si voleva evitare con questa pagina.
// Il pulsante nella finestra di risoluzione distingue salire di livello da
// cambiare titolo: il primo e' continuo, il secondo arriva ogni cinque livelli e
// vale una riga tutta sua, perche' e' quello che il giocatore sta inseguendo
// leggendo la pagina.
function describeStandingChange(standing) {
  if (!standing) return [];
  const rows = [{
    tone: 'gold',
    label: `${standing.faction.name} standing`,
    value: `+${standing.gained}`
  }, {
    tone: 'bad',
    label: `${standing.rival.name} standing`,
    value: `-${standing.lost}`
  }];
  if (standing.promoted) {
    rows.push({
      tone: 'gold',
      label: 'Standing',
      value: `Level ${standing.levelBefore} → ${standing.levelAfter}`
    });
  }
  if (standing.newTitle) {
    rows.push({
      tone: 'gold',
      label: 'They call you',
      value: standing.tier.title
    });
  }
  return rows;
}

// Piede della sidebar: il bottone di uscita serve a due esiti diversi. Chi ha
// una sessione chiude l'account, chi sta giocando da ospite non ha nulla da
// chiudere e viene semplicemente riportato alla schermata iniziale. La
// dicitura segue il caso, perche' dire "Sign out" a chi non ha fatto il login
// sarebbe raccontare un'azione che non sta compiendo.
function renderAccountFooter() {
  const service = getAuth();
  const leaveButton = document.getElementById('sidebarLeave');
  const signedIn = Boolean(service && service.enabled && service.user);
  const status = document.getElementById('saveStatus');
  if (leaveButton) {
    leaveButton.textContent = signedIn ? 'Sign out' : 'Back to title';
    leaveButton.title = signedIn
      ? 'Close this account and return to the title screen'
      : 'Return to the title screen';
  }
  if (!status) return;
  if (!signedIn) {
    // Un ospite non ha nulla da sincronizzare: la copia sul dispositivo basta
    // e dirgli "Autosave complete" ogni volta sarebbe solo rumore.
    status.textContent = service && service.enabled ? 'Playing as guest' : 'Autosave ready';
    return;
  }
  status.textContent = service.lastSyncedAt ? 'Saved online' : 'Saving online…';
}

function renderSidebar() {
  const regeneration = refreshTimedResources();
  const location = locations[state.currentLocationId];
  document.getElementById('currentRealmName').textContent = location.realm;
  document.getElementById('sidebarDucats').textContent = state.player.resources.ducatsOfSalt || 0;
  document.querySelector('.menu-badge').textContent = `${state.player.hand.length}/4`;
  const deckBadge = document.getElementById('deckBadge');
  if (deckBadge) {
    deckBadge.textContent = formatDrawReserve();
    deckBadge.title = `Draw reserve ${state.player.drawTokens} of ${DRAW_RESERVE_MAX}; +1 every ${DRAW_REGEN_MINUTES} min`;
  }
  renderResourceTimers();
  renderAccountFooter();
  document.querySelectorAll('.menu-link').forEach((link) => {
    const active = link.dataset.view === currentView;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  renderPerils();
  if (regeneration.changed) saveGame();
}

function setPageHeading(kicker, title) {
  document.getElementById('pageKicker').textContent = kicker;
  document.getElementById('pageTitle').textContent = title;
}

function getGameClock(now = new Date()) {
  const month = now.getMonth();
  const hour = now.getHours();
  return {
    year: GAME_YEAR,
    realYear: now.getFullYear(),
    month,
    monthName: MONTH_NAMES[month],
    day: now.getDate(),
    weekday: WEEKDAY_NAMES[now.getDay()],
    hour,
    minute: now.getMinutes(),
    season: SEASONS.find((season) => season.months.includes(month)).name,
    isDay: hour >= DAY_START_HOUR && hour < DAY_END_HOUR
  };
}

function getDayPhase(clock = getGameClock()) {
  return clock.isDay ? { label: 'Day', icon: '☼' } : { label: 'Night', icon: '☾' };
}

function formatGameClock(clock) {
  return `${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`;
}

function describeEncounterWindow(action, clock = getGameClock()) {
  if (action.when === 'day') return { label: 'Day only', icon: '☼', open: clock.isDay };
  if (action.when === 'night') return { label: 'Night only', icon: '☾', open: !clock.isDay };

  return { label: 'Any hour', icon: '◐', open: true };
}

function getViewedMonth() {
  const base = getGameClock();
  const total = base.month + calendarMonthOffset;
  const year = base.year + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  return { year, month, monthName: MONTH_NAMES[month], isCurrentMonth: calendarMonthOffset === 0 };
}

function getSeasonOfMonth(month) {
  return SEASONS.find((season) => season.months.includes(month));
}

function describeDayRelation(day, viewed) {
  const clock = getGameClock();
  if (viewed.isCurrentMonth) {
    if (day === clock.day) return 'Today';
    if (day < clock.day) {
      const passed = clock.day - day;
      return `${passed} day${passed === 1 ? '' : 's'} ago`;
    }
    const ahead = day - clock.day;
    return `In ${ahead} day${ahead === 1 ? '' : 's'}`;
  }

  return `In ${viewed.monthName}, Anno Domini ${viewed.year}`;
}

function renderDaySheet(viewed) {
  const clock = getGameClock();
  const day = calendarSelectedDay ?? clock.day;
  const weekday = WEEKDAY_NAMES[new Date(clock.realYear, viewed.month, day).getDay()];
  const season = getSeasonOfMonth(viewed.month);
  const location = locations[state.currentLocationId];
  const open = getOpenActions(location).filter((action) => isActionRevealed(action));
  const byDay = open.filter((action) => action.when === 'day');
  const byNight = open.filter((action) => action.when === 'night');
  const anyHour = open.filter((action) => action.when !== 'day' && action.when !== 'night');

  const column = (icon, title, list, note) => `
    <div class="day-column">
      <p class="day-column-title"><span aria-hidden="true">${icon}</span>${title}</p>
      ${list.length
        ? `<ul class="day-list">${list.map((action) => `<li>${action.title}</li>`).join('')}</ul>`
        : `<p class="day-empty">${note}</p>`}
    </div>
  `;

  return `
    <section class="day-sheet">
      <header class="day-sheet-head">
        <p class="eyebrow">${describeDayRelation(day, viewed)}</p>
        <h3>${day} ${viewed.monthName}</h3>
        <p class="calendar-weekday-name">${weekday} · ${season.name}</p>
      </header>
      <p class="panel-hint">Open encounters in ${location.realm} on this day. Encounters you already passed do not come back.</p>
      <div class="day-columns">
        ${column('☼', 'By day', byDay, 'Nothing that waits for daylight.')}
        ${column('☾', 'By night', byNight, 'Nothing that waits for nightfall.')}
      </div>
      ${anyHour.length ? `<p class="day-any"><span aria-hidden="true">◐</span>Any hour: ${anyHour.map((action) => action.title).join(' · ')}</p>` : ''}
      <p class="day-note">Weekly and dated events will be announced here once the city starts keeping them.</p>
    </section>
  `;
}

function renderCalendarPanel() {
  const clock = getGameClock();
  const phase = getDayPhase(clock);
  const viewed = getViewedMonth();
  const panel = document.getElementById('calendarPanel');
  const firstWeekday = new Date(clock.realYear, viewed.month, 1).getDay();
  const daysInMonth = new Date(clock.realYear, viewed.month + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push('<span class="calendar-cell empty" aria-hidden="true"></span>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isToday = viewed.isCurrentMonth && day === clock.day;
    const isSelected = day === (calendarSelectedDay ?? clock.day);
    const tone = isToday ? (clock.isDay ? ' is-day' : ' is-night') : '';
    cells.push(`<button type="button" class="calendar-cell${isToday ? ' is-today' : ''}${tone}${isSelected ? ' is-selected' : ''}" data-calendar-day="${day}" aria-label="${day} ${viewed.monthName}"${isToday ? ' aria-current="date"' : ''}>${day}</button>`);
  }

  panel.innerHTML = `
    <aside class="calendar-drawer" role="dialog" aria-modal="true" aria-label="Calendar of Anno Domini ${GAME_YEAR}">
      <header class="calendar-head">
        <p class="eyebrow">Anno Domini ${GAME_YEAR}</p>
        <h2>${String(clock.day).padStart(2, '0')} ${clock.monthName}</h2>
        <p class="calendar-weekday-name">${clock.weekday}</p>
      </header>
      <div class="calendar-meta">
        <div><span>Season</span><strong>${clock.season}</strong></div>
        <div><span>Hour</span><strong id="calendarPhase">${phase.icon} ${phase.label}</strong></div>
        <div><span>Clock</span><strong id="calendarClock">${formatGameClock(clock)}</strong></div>
        <div><span>Daylight</span><strong>${DAY_START_HOUR}:00 – ${DAY_END_HOUR}:00</strong></div>
      </div>
      <div class="calendar-nav">
        <button type="button" class="calendar-nav-button" data-calendar-prev aria-label="Previous month">‹</button>
        <span class="calendar-nav-label">${viewed.monthName} ${viewed.year}</span>
        <button type="button" class="calendar-nav-button" data-calendar-next aria-label="Next month">›</button>
        <button type="button" class="calendar-nav-button wide" data-calendar-today>Today</button>
      </div>
      <div class="calendar-seasons">
        ${SEASONS.map((season) => {
          const active = season.months.includes(viewed.month);
          return `<span class="calendar-season${active ? ' is-active' : ''}">${season.name}</span>`;
        }).join('')}
      </div>
      <div class="calendar-grid">${WEEKDAY_SHORT.map((name) => `<span class="calendar-weekday">${name}</span>`).join('')}${cells.join('')}</div>
      ${renderDaySheet(viewed)}
      <button type="button" class="calendar-close" data-calendar-close>Close</button>
    </aside>
  `;
}

function renderGameClock() {
  const clock = getGameClock();
  const phase = getDayPhase(clock);
  const setText = (id, text) => {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  };

  setText('dateLabel', `${clock.day} ${clock.monthName}`);
  setText('yearLabel', GAME_YEAR);
  setText('seasonLabel', clock.season);
  setText('phaseBadge', `${phase.icon} ${phase.label}`);
  setText('timeLabel', formatGameClock(clock));
  setText('calendarClock', formatGameClock(clock));
  setText('calendarPhase', `${phase.icon} ${phase.label}`);
}

function openCalendar() {
  const panel = document.getElementById('calendarPanel');
  if (!panel) return;
  renderCalendarPanel();
  panel.hidden = false;
  panel.classList.add('is-open');
}

function closeCalendar() {
  const panel = document.getElementById('calendarPanel');
  if (!panel || panel.hidden) return;
  panel.classList.remove('is-open');
  panel.hidden = true;
}

function toggleCalendar() {
  const panel = document.getElementById('calendarPanel');
  if (panel && !panel.hidden) closeCalendar();
  else openCalendar();
}

function renderTales() {
  const location = locations[state.currentLocationId];
  setPageHeading(location.realm, 'Tales & locales');
  document.getElementById('viewContent').innerHTML = `
    <section class="hero-card">
      <div class="hero-art" aria-hidden="true"></div>
      <div class="hero-copy">
        <p class="eyebrow">Realm: ${location.realm}</p>
        <h2>${location.shortName}</h2>
        <p>${location.description}</p>
        <button class="hero-map-button" type="button" data-view="map">Change realm <span>(chart of realms)</span></button>
      </div>
    </section>
    <section class="story-panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Tales &amp; encounters in</p>
          <h2>${location.name}</h2>
        </div>
        <span class="scene-counter">${getVisibleActions(location).length} actions</span>
      </div>
      <div id="actionList" class="action-list"></div>
    </section>
  `;
  document.querySelector('.hero-art').style.backgroundImage = `linear-gradient(90deg, rgba(13, 12, 10, 0.92), rgba(13, 12, 10, 0.68) 58%, rgba(13, 12, 10, 0.34)), url("${location.image}")`;
  renderActions();
}

function getMapSites() {
  return regions.map((region) => ({ region, location: locations[region.locations[0]] }));
}

function renderMap() {
  setPageHeading('The Drowned Serenissima', 'Chart of Realms');
  const sites = getMapSites();
  document.getElementById('viewContent').innerHTML = `
    <section class="map-page">
      <header class="map-header">
        <div>
          <p class="eyebrow">Chart of realms</p>
          <h2>The Drowned Serenissima</h2>
        </div>
        <div class="map-legend">
          <span class="map-legend-item"><i class="map-legend-dot is-current"></i>Current realm</span>
          <span class="map-legend-item"><i class="map-legend-dot"></i>Charted realm</span>
        </div>
      </header>

      <div class="map-viewport" id="mapViewport">
        <div class="map-canvas" id="mapCanvas">
          <img class="realm-map" src="immagini/mappa del mondo.jpg" alt="Chart of the Drowned Serenissima" draggable="false" />
          <div class="map-pins" id="mapPins">
            ${sites.map(renderMapPin).join('')}
          </div>
        </div>
        <div class="map-readout" id="mapReadout" role="status" aria-live="polite"></div>
        <div class="map-zoom-controls" role="group" aria-label="Chart zoom">
          <button type="button" class="map-zoom-button" data-map-zoom="out" aria-label="Zoom out" title="Zoom out">−</button>
          <button type="button" class="map-zoom-button" data-map-zoom="reset" aria-label="Reset chart view" title="Reset view">⟲</button>
          <button type="button" class="map-zoom-button" data-map-zoom="in" aria-label="Zoom in" title="Zoom in">+</button>
        </div>
        <p class="map-hint">Click a beacon to travel · drag to pan · scroll to zoom</p>
      </div>
    </section>
  `;
  mountMapInteraction();
}

function renderMapPin(site) {
  const { region, location } = site;
  const point = region.mapPoint;
  const isCurrent = location.id === state.currentLocationId;
  return `
    <button
      type="button"
      class="map-pin ${isCurrent ? 'is-current' : ''}"
      style="--pin-x:${point.x}%;--pin-y:${point.y}%"
      data-map-pin="${location.id}"
      data-anchor="${region.mapAnchor}"
      data-location="${location.id}"
      aria-label="${region.name}: ${location.shortName}${isCurrent ? ' (current realm)' : ''}. Enter this realm."
    >
      <span class="map-pin-halo" aria-hidden="true"></span>
      <span class="map-pin-core" aria-hidden="true"></span>
      <span class="map-pin-label" aria-hidden="true">${region.numeral}. ${region.chartLabel}</span>
    </button>
  `;
}

// The chart is a pannable, zoomable plane. Artwork and beacons both live on
// #mapCanvas so a single transform moves them together and they never drift apart.
const mapView = { x: 0, y: 0, zoom: 1, dragging: false, pointerId: null, startX: 0, startY: 0, originX: 0, originY: 0, moved: false };
const MAP_ZOOM_MIN = 1;
const MAP_ZOOM_MAX = 3.4;

function clampMapView() {
  const viewport = document.getElementById('mapViewport');
  if (!viewport) return;
  const bounds = viewport.getBoundingClientRect();
  // At zoom 1 the canvas exactly fills the viewport, so any slack is what zoom created.
  const overflowX = ((mapView.zoom - 1) * bounds.width) / 2;
  const overflowY = ((mapView.zoom - 1) * bounds.height) / 2;
  mapView.x = Math.max(-overflowX, Math.min(overflowX, mapView.x));
  mapView.y = Math.max(-overflowY, Math.min(overflowY, mapView.y));
}

function applyMapTransform() {
  const canvas = document.getElementById('mapCanvas');
  if (!canvas) return;
  clampMapView();
  canvas.style.transform = `translate3d(${mapView.x}px, ${mapView.y}px, 0) scale(${mapView.zoom})`;
  const viewport = document.getElementById('mapViewport');
  if (viewport) viewport.classList.toggle('is-zoomed', mapView.zoom > 1.02);
}

function zoomMapAt(factor, clientX, clientY) {
  const viewport = document.getElementById('mapViewport');
  if (!viewport) return;
  const previousZoom = mapView.zoom;
  const nextZoom = Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, previousZoom * factor));
  if (nextZoom === previousZoom) return;
  // Keep the point under the cursor anchored while the scale changes around it.
  // The canvas maps p -> center + translate + (p - center) * zoom, so holding a
  // point steady across a zoom step means shifting by -(local) * (zNew - zOld).
  const bounds = viewport.getBoundingClientRect();
  const localX = clientX - bounds.left - bounds.width / 2;
  const localY = clientY - bounds.top - bounds.height / 2;
  const zoomDelta = nextZoom - previousZoom;
  mapView.x -= localX * zoomDelta;
  mapView.y -= localY * zoomDelta;
  mapView.zoom = nextZoom;
  applyMapTransform();
}

function resetMapView() {
  mapView.x = 0;
  mapView.y = 0;
  mapView.zoom = 1;
  applyMapTransform();
}

function showMapReadout(locationId) {
  const readout = document.getElementById('mapReadout');
  const site = getMapSites().find((entry) => entry.location.id === locationId);
  if (!readout || !site) return;
  const { region, location } = site;
  const isCurrent = location.id === state.currentLocationId;
  readout.innerHTML = `
    <p class="map-readout-eyebrow">${region.numeral} · ${region.name}</p>
    <p class="map-readout-name">${location.shortName}</p>
    <p class="map-readout-state">${isCurrent ? 'You are here' : 'Click to travel'}</p>
  `;
  readout.classList.add('is-visible');
}

function hideMapReadout() {
  const readout = document.getElementById('mapReadout');
  if (readout) readout.classList.remove('is-visible');
}

function mountMapInteraction() {
  const viewport = document.getElementById('mapViewport');
  if (!viewport) return;
  resetMapView();

  const pins = Array.from(viewport.querySelectorAll('[data-map-pin]'));
  pins.forEach((pin) => {
    pin.addEventListener('mouseenter', () => showMapReadout(pin.dataset.mapPin));
    pin.addEventListener('focus', () => showMapReadout(pin.dataset.mapPin));
    pin.addEventListener('mouseleave', hideMapReadout);
    pin.addEventListener('blur', hideMapReadout);
  });

  // Swallow the click that ends a drag, so panning never counts as travel.
  viewport.addEventListener('click', (event) => {
    if (!mapView.moved) return;
    event.stopPropagation();
    event.preventDefault();
    mapView.moved = false;
  }, true);

  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    mapView.dragging = true;
    mapView.moved = false;
    mapView.pointerId = event.pointerId;
    mapView.startX = event.clientX;
    mapView.startY = event.clientY;
    mapView.originX = mapView.x;
    mapView.originY = mapView.y;
    viewport.classList.add('is-panning');
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!mapView.dragging || event.pointerId !== mapView.pointerId) return;
    const dx = event.clientX - mapView.startX;
    const dy = event.clientY - mapView.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) mapView.moved = true;
    mapView.x = mapView.originX + dx;
    mapView.y = mapView.originY + dy;
    applyMapTransform();
  });

  const endMapDrag = (event) => {
    if (!mapView.dragging) return;
    if (event.pointerId !== undefined && event.pointerId !== mapView.pointerId) return;
    mapView.dragging = false;
    mapView.pointerId = null;
    viewport.classList.remove('is-panning');
  };
  viewport.addEventListener('pointerup', endMapDrag);
  viewport.addEventListener('pointercancel', endMapDrag);

  viewport.addEventListener('wheel', (event) => {
    event.preventDefault();
    zoomMapAt(event.deltaY < 0 ? 1.12 : 1 / 1.12, event.clientX, event.clientY);
  }, { passive: false });

  document.querySelectorAll('[data-map-zoom]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const mode = button.dataset.mapZoom;
      const bounds = viewport.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      if (mode === 'in') zoomMapAt(1.35, centerX, centerY);
      else if (mode === 'out') zoomMapAt(1 / 1.35, centerX, centerY);
      else resetMapView();
    });
  });
}

function renderDeck() {
  const activeCards = malusCards.filter((card) => state.player.pendingMalus.includes(card.id));
  const handCards = state.player.hand.map((id) => allTideCards.find((card) => card.id === id)).filter(Boolean);
  const heldMalus = state.player.hand.map((id) => malusCards.find((card) => `malus-${card.id}` === id)).filter(Boolean);
  const cardsInHand = handCards.length + heldMalus.length;
  const canDraw = cardsInHand < 4 && state.player.drawTokens > 0 && state.player.vigor > 0 && (state.player.drawPile.length > 0 || state.player.discardPile.length > 0 || heldMalus.length < activeCards.length);
  const rarityOdds = Object.entries(rarityWeights).map(([rarity, weight]) => `<span class="rarity-odds rarity-${rarity}">${rarityNames[rarity]} <b>${weight}%</b></span>`).join('');
  setPageHeading('Divination & fortune hand', 'The Tide Deck');
  document.getElementById('viewContent').innerHTML = `
    <section class="deck-view">
      <p class="deck-epigraph">“Drifting fortunes drawn from the black currents of the Venetian abyss.”</p>
      <div class="deck-status-bar">
        <div class="deck-stat"><span>Cards in hand</span><strong>${cardsInHand} <small>/ 4 max</small></strong></div>
        <div class="deck-stat"><span>Afflictions undrawn</span><strong>${activeCards.length} <small>/ 5</small></strong></div>
        <div class="deck-stat"><span>Draw reserve</span><strong>${state.player.drawTokens} <small>/ ${DRAW_RESERVE_MAX}</small></strong><small>+1 every ${DRAW_REGEN_MINUTES} min</small></div>
        <div class="hand-limit">${cardsInHand >= 4 ? `Hand full (${cardsInHand}/4)` : `${4 - cardsInHand} open slot${cardsInHand === 3 ? '' : 's'}`}</div>
      </div>
      <div class="deck-draw-row">
        <div class="rarity-odds-list"><span class="odds-label">Draw odds</span>${rarityOdds}</div>
        <div class="draw-control"><button class="draw-card-button" type="button" data-card-draw ${canDraw ? '' : 'disabled'} title="Costs 1 Vigor and 1 draw reserve · reserve refills by 1 card every ${DRAW_REGEN_MINUTES} min, up to ${DRAW_RESERVE_MAX}">Draw a tide card <span aria-hidden="true">↻</span></button><span id="drawTimer" class="draw-timer">Draw reserve full</span></div>
      </div>
      <section class="deck-section">
        <div class="deck-section-heading"><h3>Cards in hand</h3><span>${cardsInHand} / 4</span></div>
        ${activeCards.length
          ? `<p class="malus-pending">${activeCards.length} affliction card${activeCards.length === 1 ? ' is' : 's are'} still out in the tide deck: ${activeCards.map((card) => card.label).join(', ')}. Every draw can turn ${activeCards.length === 1 ? 'it' : 'them'} up${cardsInHand >= 4 ? ', but your hand is full: play or discard a card to free a slot first' : ''}.</p>`
          : ''}
        <div class="deck-card-grid">
          ${heldMalus.map((card) => renderMalusCard(card)).join('')}
          ${handCards.map((card) => renderTideCard(card)).join('')}
        </div>
      </section>
    </section>
  `;
}

function renderTideCard(card) {
  const artwork = card.image
    ? `<img src="${card.image}" alt="${card.title}" />`
    : `<div class="card-art-placeholder rarity-${card.rarity}" aria-label="${card.rarity} card artwork to be added"><span>${card.symbol}</span><small>Artwork to be added</small></div>`;
  return `
    <article class="deck-card common-card rarity-${card.rarity}">
      ${artwork}
      <button class="card-discard" type="button" data-card-discard="${card.id}" aria-label="Discard ${card.title}" title="Discard card · costs 1 Vigor" ${state.player.vigor < 1 ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14m-6 4v7m4-7v7" /></svg>
      </button>
      <div class="deck-card-copy">
        <span class="card-ribbon">${card.rarityIcon} &nbsp;${rarityNames[card.rarity]} tide card</span>
        <span class="card-cycle">☼ &nbsp;Day &amp; night</span>
        <span class="card-odds" title="Base chance of drawing a ${rarityNames[card.rarity].toLowerCase()} card from the tide deck">${rarityWeights[card.rarity]}% draw chance</span>
        <h4>${card.title}</h4>
        <p>${card.quote}</p>
        <p class="appearance-reason"><strong>Why this card appeared</strong>${card.appearanceReason}</p>
        <p class="card-effect">${formatCardEffects(card.effects)}</p>
        <div class="card-actions"><button type="button" data-card-play="${card.id}" ${state.player.vigor < 1 ? 'disabled' : ''} title="Costs 1 Vigor">Play card · 1 Vigor <span>›</span></button></div>
      </div>
    </article>
  `;
}

function renderMalusCard(card) {
  const value = state.player.malus[card.id];
  const level = value >= 3 ? 'high' : 'low';
  const severity = level === 'high' ? 'High' : 'Low';
  const image = `immagini/carte/malus ${card.asset} ${level}.jpg`;
  const source = state.player.malusSources?.[card.id];
  const appearanceReason = source
    ? `${card.label} became active after ${source.event} (${source.outcome.toLowerCase()}): ${source.reason}`
    : `${card.label} is active at level ${value}; this card is drawn only while the malus is active. Its originating event predates the chronicle saved here.`;
  return `
    <article class="deck-card malus-card">
      <img src="${image}" alt="${card.label} ${level} affliction card" />
      <div class="deck-card-copy">
        <span class="card-ribbon">Menace affliction</span>
        <span class="card-cycle">☼ &nbsp;Day &amp; night</span>
        <p class="malus-trigger">${card.trigger} · ${severity} level ${value} / 6</p>
        <h4>${card.title}</h4>
        <p>${card.description}</p>
        <p class="appearance-reason"><strong>Why this card appeared</strong>${appearanceReason}</p>
        <p class="card-effect">Play to reduce ${card.label} by 1 level and gain 1 Resolve XP. This card is spent when played, and cannot be discarded.</p>
        <div class="card-actions affliction-actions"><button type="button" data-card-play="malus-${card.id}" ${state.player.vigor < 1 ? 'disabled' : ''} title="Costs 1 Vigor">Endure affliction · 1 Vigor <span>›</span></button></div>
      </div>
    </article>
  `;
}

function formatCardEffects(effects = {}) {
  const descriptions = [];
  Object.entries(effects.statXp || {}).forEach(([stat, amount]) => descriptions.push(`${statNames[stat]} +${amount} XP`));
  Object.entries(effects.malusChanges || {}).forEach(([malus, amount]) => descriptions.push(`${malus} ${amount > 0 ? '+' : ''}${amount} level`));
  Object.entries(effects.resources || {}).forEach(([resource, amount]) => descriptions.push(`${resource} ${amount > 0 ? '+' : ''}${amount}`));
  // La reputazione si scrive per nome, non per id: "clockwrights +5" non dice
  // niente a chi sta leggendo la carta, e un id di fazione non deve finire mai
  // davanti agli occhi del giocatore.
  const standing = effects.standing;
  if (standing && factions[standing.faction]) {
    descriptions.push(`${factions[standing.faction].name} standing +${standing.points}`);
  }
  return descriptions.join(' · ');
}

function renderPersona() {
  setPageHeading('A life measured in deeds', 'Persona & deeds');
  const resourceEntries = Object.entries(resourceNames);
  document.getElementById('viewContent').innerHTML = `
    <section class="persona-view">
      <div class="persona-banner">
        <p class="eyebrow">Current persona</p>
        <h3>${state.player.name}</h3>
        <p>${locations[state.currentLocationId].realm} · ${locations[state.currentLocationId].name}</p>
      </div>
      <div class="persona-columns">
        <section class="info-panel"><h3>Attributes</h3><div class="progression-list">
          ${Object.entries(statNames).map(([key, label]) => {
            const xp = state.player.statXp[key] || 0;
            const threshold = getStatXpToNextLevel(state.player.stats[key]);
            const progress = Math.min(100, xp / threshold * 100);
            return `<div class="progression-row"><div class="progression-label"><span>${label}</span><strong>Level ${state.player.stats[key]}</strong></div><div class="progression-track"><i style="width:${progress}%"></i></div><span class="progression-xp">${xp} / ${threshold} XP to next level</span></div>`;
          }).join('')}
        </div></section>
        <section class="info-panel malus-panel"><h3>Malus &amp; recovery</h3><div class="progression-list">
          ${Object.entries(malusNames).map(([key, label]) => {
            const level = state.player.malus[key] || 0;
            const progress = level / 6 * 100;
            const severity = level === 0 ? 'Dormant' : level >= 3 ? 'High' : 'Low';
            return `<div class="progression-row malus-progression"><div class="progression-label"><span>${label}</span><strong>${level ? `Level ${level} / 6 · ${severity}` : 'Dormant'}</strong></div><div class="progression-track"><i style="width:${progress}%"></i></div><span class="progression-xp">${level ? `${severity} malus` : 'No active affliction'}</span></div>`;
          }).join('')}
        </div></section>
        <section class="info-panel"><h3>Inventory</h3><div class="info-list">
          ${resourceEntries.map(([key, label]) => `<div class="info-row"><span>${label}</span><strong>${state.player.resources[key] || 0}</strong></div>`).join('')}
        </div></section>
        <section class="info-panel property-panel"><h3>Properties</h3>
          ${state.player.properties.length ? `<div class="info-list">${state.player.properties.map((property) => `<div class="info-row"><span>${property}</span><strong>Owned</strong></div>`).join('')}</div>` : '<p class="deck-empty">No properties claimed.</p>'}
        </section>
      </div>
    </section>
  `;
}

// Swapping gear is one click: clicking an owned item wears it, clicking what is
// worn takes it off back to the satchel. Anything already in the target slot is
// returned first, so a click never silently destroys the piece it replaces.
function equipItem(itemId) {
  const item = findEquipmentItem(itemId);
  if (!item) return;

  const slot = getEquipmentSlot(item.slot);
  if (!slot) return;

  if (state.player.equipment[item.slot] === itemId) {
    unequipSlot(item.slot);
    return;
  }

  const previous = state.player.equipment[item.slot];
  if (previous) state.player.inventory.push(previous);
  state.player.inventory = state.player.inventory.filter((id) => id !== itemId);
  state.player.equipment[item.slot] = itemId;

  addLog(`${item.name} is ${slot.living ? 'brought forward' : 'worn'}.`, 'Equipment', describeItemBonuses(item).join(' · ') || 'It carries no bonus of its own yet.');
  saveGame();
  render();
}

function unequipSlot(slotKey) {
  const slot = getEquipmentSlot(slotKey);
  const current = state.player.equipment?.[slotKey];
  if (!slot || !current) return;

  const item = findEquipmentItem(current);
  state.player.equipment[slotKey] = null;
  if (!state.player.inventory.includes(current)) state.player.inventory.push(current);

  addLog(`${item ? item.name : 'The piece'} is taken off.`, 'Equipment', slot.living ? 'They wait by the door until you need them again.' : 'It goes back into the satchel.');
  saveGame();
  render();
}

function renderEquipmentSlot(slot) {
  const item = state.player.equipment[slot.key] ? findEquipmentItem(state.player.equipment[slot.key]) : null;
  const bonuses = item ? describeItemBonuses(item) : [];

  if (!item) {
    return `
      <li class="equip-slot is-empty ${slot.living ? 'is-companion' : ''}">
        <span class="equip-slot-icon" aria-hidden="true">${slot.icon}</span>
        <div class="equip-slot-copy">
          <span class="equip-slot-label">${slot.label}</span>
          <span class="equip-slot-empty">${slot.living ? 'No companion at your side' : 'Empty'}</span>
          <span class="equip-slot-hint">${slot.hint}</span>
        </div>
      </li>
    `;
  }

  return `
    <li class="equip-slot is-filled ${slot.living ? 'is-companion' : ''}">
      <span class="equip-slot-icon" aria-hidden="true">${item.icon || slot.icon}</span>
      <div class="equip-slot-copy">
        <span class="equip-slot-label">${slot.label}${slot.living && item.companionKind ? ` · ${item.companionKind}` : ''}</span>
        <span class="equip-slot-name">${item.name}</span>
        ${bonuses.length ? `<span class="equip-bonus-line">${bonuses.map((bonus) => `<em>${bonus}</em>`).join('')}</span>` : ''}
        ${item.notes ? `<span class="equip-slot-hint">${item.notes}</span>` : ''}
      </div>
      <button type="button" class="equip-remove" data-equip-remove="${slot.key}" title="${slot.living ? 'Send away' : 'Take off'} ${item.name}">${slot.living ? 'Send away' : 'Remove'}</button>
    </li>
  `;
}

function renderEquipmentItemCard(item) {
  const worn = state.player.equipment[item.slot] === item.id;
  const slot = getEquipmentSlot(item.slot);
  const bonuses = describeItemBonuses(item);
  const slotName = slot ? (slot.living ? 'Companion' : slot.label) : item.slot;

  return `
    <li class="gear-card rarity-${item.rarity || 'common'} ${worn ? 'is-worn' : ''}">
      <button type="button" class="gear-card-button" data-equip-item="${item.id}" aria-pressed="${worn}" title="${worn ? 'Take off this piece' : `Put on: ${item.name}`}">
        <span class="gear-icon" aria-hidden="true">${item.icon || '◆'}</span>
        <span class="gear-copy">
          <span class="gear-name">${item.name}</span>
          <span class="gear-meta"><span class="gear-slot">${slotName}</span>${item.rarity && rarityNames[item.rarity] ? `<span class="gear-rarity">${rarityNames[item.rarity]}</span>` : ''}</span>
          ${bonuses.length ? `<span class="gear-bonuses">${bonuses.map((bonus) => `<em>${bonus}</em>`).join('')}</span>` : ''}
          ${item.notes ? `<span class="gear-notes">${item.notes}</span>` : ''}
        </span>
        <span class="gear-state">${worn ? 'Worn' : 'Wear'}</span>
      </button>
    </li>
  `;
}

function renderEquipment() {
  setPageHeading('What you carry, and who walks with you', 'Equipment');
  const bonuses = getEquipmentBonuses();
  const statLines = Object.entries(statNames).map(([key, label]) => {
    const bonus = bonuses.stats[key] || 0;
    return `<div class="info-row"><span>${label}</span><strong>${state.player.stats[key] || 0}${bonus ? ` <em class="equip-bonus">+${bonus}</em>` : ''}</strong></div>`;
  });
  const extraLines = [];
  if (bonuses.vigor) extraLines.push(`<div class="info-row"><span>Max Vigor</span><strong>${VIGOR_MAX} <em class="equip-bonus">+${bonuses.vigor}</em></strong></div>`);
  Object.entries(bonuses.resources).forEach(([key, amount]) => {
    extraLines.push(`<div class="info-row"><span>${resourceNames[key] || key}</span><strong><em class="equip-bonus">+${amount}</em></strong></div>`);
  });
  Object.entries(bonuses.malusRelief).forEach(([key, amount]) => {
    extraLines.push(`<div class="info-row"><span>${malusNames[key] || key}</span><strong><em class="equip-bonus">eased ${amount}</em></strong></div>`);
  });

  const satchel = state.player.inventory.map(findEquipmentItem).filter(Boolean);
  const companionItem = state.player.equipment.companion ? findEquipmentItem(state.player.equipment.companion) : null;
  const companionChoices = equipmentItems.filter((item) => item.companion);

  document.getElementById('viewContent').innerHTML = `
    <section class="equipment-view">
      <div class="equip-columns">
        <section class="info-panel equip-slots-panel">
          <h3>Worn &amp; carried</h3>
          <ul class="equip-slots">
            ${equipmentSlots.map(renderEquipmentSlot).join('')}
          </ul>
        </section>

        <section class="info-panel equip-summary-panel">
          <h3>Bonuses in effect</h3>
          <p class="panel-hint">Only what you are wearing counts. Take a piece off and its bonus leaves with it.</p>
          <div class="info-list">${statLines.join('')}${extraLines.join('')}</div>
          <div class="equip-companion-block">
            <h4>${companionItem ? companionItem.name : 'No companion yet'}</h4>
            <p>${companionItem ? (companionItem.notes || 'They walk beside you.') : 'Find a beast, a person or a spirit worth following: they take the companion slot and grant their own bonuses.'}</p>
            ${companionChoices.length ? `<div class="equip-companion-picks">${companionChoices.map((item) => `<button type="button" class="companion-pick ${companionItem && companionItem.id === item.id ? 'is-active' : ''}" data-equip-item="${item.id}" title="${item.notes || item.name}">${item.icon || '❦'} ${item.name}${item.companionKind ? ` <span>(${item.companionKind})</span>` : ''}</button>`).join('')}</div>` : ''}
          </div>
        </section>
      </div>

      <section class="info-panel equip-satchel-panel">
        <h3>Satchel <span class="equip-count">${satchel.length}</span></h3>
        <p class="panel-hint">Everything you own but have not put on. Click a piece to wear it, click it again to take it off.</p>
        ${satchel.length
          ? `<ul class="gear-list">${satchel.map(renderEquipmentItemCard).join('')}</ul>`
          : '<p class="deck-empty">Your satchel is empty. Anything you find will be listed here.</p>'}
      </section>
    </section>
  `;
}

function renderLog() {
  if (!state.player.log.length) {
    return '<p class="deck-empty">Your chronicle is still empty. Every choice here becomes part of the city’s memory.</p>';
  }
  return state.player.log.map((entry) => `
    <article class="chronicle-entry">
      <div><span class="log-prefix">${entry.prefix}</span><time>${entry.time}</time></div>
      <p class="chronicle-reason"><strong>Why this appeared</strong>${entry.reason || 'This record predates cause tracking; its original trigger was not saved.'}</p>
      <p>${entry.message}</p>
    </article>
  `).join('');
}

function renderLoreKind(kind) {
  const meta = loreKinds[kind];
  const entries = loreEntries.filter((entry) => entry.kind === kind);
  if (!entries.length) return '';

  const cards = entries.map((entry) => {
    const revealed = hasDiscoveredLore(entry.id);
    const progress = getLoreProgress(entry);
    const realm = regions.find((region) => region.id === entry.realm);

    // A locked entry shows its name and nothing else. The prose stays shut.
    if (!revealed) {
      return `
        <li class="lore-entry is-locked" data-lore-locked>
          <span class="lore-entry-sigil" aria-hidden="true">?</span>
          <div class="lore-entry-copy">
            <p class="lore-entry-kind">${meta.label} · unrecorded</p>
            <h3>Something you have not met yet</h3>
            <p class="lore-entry-gate">${entry.lockedHint || 'Nothing in your chronicle has opened this yet.'}</p>
          </div>
        </li>
      `;
    }

    const known = state.player.lore.entries[entry.id];
    const chapters = entry.chapters.map((chapter) => {
      const open = hasDiscoveredChapter(entry.id, chapter.id);
      const record = state.player.lore.chapters[`${entry.id}:${chapter.id}`];
      if (!open) {
        return `
          <li class="lore-chapter is-sealed">
            <span class="lore-chapter-mark" aria-hidden="true">·</span>
            <div>
              <h4>A chapter still closed</h4>
              <p>${describeLoreGate(chapter.requires) || 'More of this history is still out of reach.'}</p>
            </div>
          </li>
        `;
      }
      return `
        <li class="lore-chapter is-open">
          <span class="lore-chapter-mark" aria-hidden="true">✦</span>
          <div>
            <h4>${chapter.title}</h4>
            <p>${chapter.text}</p>
            ${record?.reason ? `<p class="lore-chapter-why"><strong>How you learned it</strong>${record.reason}</p>` : ''}
          </div>
        </li>
      `;
    }).join('');

    return `
      <li class="lore-entry is-revealed" data-lore-id="${entry.id}">
        <span class="lore-entry-sigil" aria-hidden="true">${entry.icon || meta.icon}</span>
        <div class="lore-entry-copy">
          <p class="lore-entry-kind">${meta.label}${realm ? ` · ${realm.realm}` : ''}</p>
          <h3>${entry.title}</h3>
          <p class="lore-entry-teaser">${entry.teaser}</p>
          <p class="lore-entry-progress">${progress.known} of ${progress.total} chapters known${known?.at ? ` · first recorded ${known.at}` : ''}</p>
          <ul class="lore-chapters">${chapters}</ul>
        </div>
      </li>
    `;
  }).join('');

  return `
    <section class="info-panel lore-panel">
      <h3><span aria-hidden="true">${meta.icon}</span>${meta.label}</h3>
      <ul class="lore-list">${cards}</ul>
    </section>
  `;
}

function renderLore() {
  setPageHeading('What the city remembers about itself', 'Lore');
  const tally = getLoreTally();
  const standing = Object.entries(loreFactions).map(([id, faction]) => {
    const mark = getFactionStanding(id);
    const label = mark === 'ally' ? 'Ally' : mark === 'enemy' ? 'Enemy' : mark === 'contested' ? 'Contested' : 'Unwritten';
    const setFlags = [...(LORE_STANDING_FRIENDLY[id] || []), ...(LORE_STANDING_HOSTILE[id] || [])]
      .filter((flag) => state.player.flags[flag]);
    return `
      <div class="lore-standing-row">
        <span class="lore-standing-name"><span aria-hidden="true">${faction.sigil}</span>${faction.name}</span>
        <span class="lore-standing-mark is-${mark}">${label}</span>
        ${setFlags.length ? `<span class="lore-standing-why">${setFlags.map((f) => loreFlags[f]?.label || f).join(' · ')}</span>` : ''}
      </div>
    `;
  }).join('');

  document.getElementById('viewContent').innerHTML = `
    <section class="lore-view">
      <div class="lore-summary">
        <section class="info-panel lore-tally-panel">
          <h3>The record so far</h3>
          <div class="lore-tally">
            <div class="lore-tally-figure"><strong>${tally.revealed}</strong><span>of ${tally.entries} subjects recorded</span></div>
            <div class="lore-tally-figure"><strong>${tally.chapters}</strong><span>of ${tally.chaptersTotal} chapters known</span></div>
          </div>
          <div class="lore-tally-track"><i style="width:${tally.entries ? tally.revealed / tally.entries * 100 : 0}%"></i></div>
          <p class="panel-hint">A subject opens only once your chronicle has proved it. Chapters open one at a time, and some stay shut for good.</p>
        </section>
        <section class="info-panel lore-standing-panel">
          <h3>Where you stand</h3>
          <div class="lore-standing">${standing}</div>
          <p class="panel-hint">Nothing here is chosen by you directly. It follows from the encounters you have passed, and two chronicles can end on opposite sides of it.</p>
        </section>
      </div>
      ${Object.keys(loreKinds).map(renderLoreKind).join('')}
    </section>
  `;
}

// Una scheda per fazione: chi sono, a che punto sei, quanto manca al livello
// dopo, e cosa ti aspetta piu' in alto.
//
// La scheda mostra sempre il livello successivo anche quando non e' ancora
// raggiunto. Un obiettivo che il giocatore non puo' vedere non e' un obiettivo:
// nascondere i livelli futuri farebbe sembrare il gioco piu' chiuso di quanto
// sia, e il giocatore non avrebbe niente verso cui spingersi.
function renderFactionCard(faction) {
  const xp = getFactionXp(faction.id);
  const progress = factionProgress(faction, xp);
  const rank = factionRankFromXp(xp);
  const rival = factions[faction.rival];
  const rivalXp = getFactionXp(rival.id);

  const meterWidth = xp < 0 ? 100 : progress.percent;
  const toneClass = xp < 0 ? 'is-sour' : xp >= factionThreshold(30) ? 'is-great' : '';
  // Oltre il 60 il livello continua a salire ma non c'e' piu' niente da
  // sbloccare: il "+" dice che il numero conta ancora, senza fingere che ci sia
  // un traguardo dietro.
  const levelLabel = progress.level > FACTION_MAX_LEVEL ? `${FACTION_MAX_LEVEL}+` : progress.level;

  const nextBlock = progress.next
    ? `
      <div class="faction-next">
        <div class="faction-next-heading">
          <span class="faction-next-title">${progress.next.title}</span>
          <span class="faction-next-level">Level ${progress.next.level}</span>
        </div>
        <p class="faction-next-note">${progress.next.note}</p>
        <p class="faction-next-need">${progress.needed - progress.gained} standing to go</p>
      </div>
    `
    : `
      <div class="faction-next is-final">
        <div class="faction-next-heading">
          <span class="faction-next-title">${progress.tier.title}</span>
          <span class="faction-next-level">Highest rank</span>
        </div>
        <p class="faction-next-note">${progress.tier.note}</p>
        <p class="faction-next-need">${faction.name} has nothing left to make you</p>
      </div>
    `;

  return `
    <article class="faction-card ${toneClass}" style="--faction-colour: ${faction.colour}; --faction-image: url('${faction.image}')">
      <header class="faction-head">
        <span class="faction-sigil" aria-hidden="true">${faction.sigil}</span>
        <div class="faction-heading">
          <h3>${faction.name}</h3>
          <p class="faction-region">${faction.region}</p>
          <p class="faction-motto">${faction.motto}</p>
        </div>
        <div class="faction-standing">
          <span class="faction-level">Level ${levelLabel}</span>
          <span class="faction-title">${progress.tier.title}</span>
        </div>
      </header>

      <p class="faction-intro">${faction.introduction}</p>

      <div class="faction-meter" aria-hidden="true"><i style="width:${meterWidth}%"></i></div>
      <p class="faction-rank ${xp < 0 ? 'is-sour' : ''}"><b>${rank.label}</b> — ${rank.note}</p>

      <div class="faction-tiers">
        ${faction.tiers.map((tier) => {
          // Un titolo e' raggiunto quando il livello lo ha superato, e corrente
          // quando e' l'ultimo superato: i due stati hanno colori diversi perche'
          // uno e' un traguardo e l'altro e' la condizione in cui si vive.
          const reached = progress.level >= tier.level;
          const isCurrent = tier.level === progress.tier.level;
          return `
            <div class="faction-tier ${reached ? 'is-reached' : ''} ${isCurrent ? 'is-current' : ''}">
              <span class="faction-tier-mark" aria-hidden="true">${reached ? '✦' : '·'}</span>
              <span class="faction-tier-body">
                <b>${tier.level} · ${tier.title}</b>
                <span>${reached ? tier.note : 'Not yet reached.'}</span>
              </span>
            </div>
          `;
        }).join('')}
      </div>

      ${nextBlock}

      <p class="faction-rival">
        <span aria-hidden="true">⚔</span>
        ${rival.name} has you as <b>${factionRankFromXp(rivalXp).label}</b>
      </p>
    </article>
  `;
}

function renderStorageWarning() {
  if (!storageProblem) return '';
  // Il sintomo che il giocatore vede e' una partita che sparisce a ogni refresh, e
  // il primo pensiero non e' mai "il browser non sta salendo". Serve dirlo a chi
  // gioca, non lasciarlo indovinare.
  return `
    <aside class="storage-warning" role="alert">
      <b>This browser is not keeping your chronicle.</b>
      <p>${storageProblem} Everything you do from here will be lost when you reload.
      Close any private/incognito window, allow site data for this address in the
      browser settings, and try again. An account keeps your chronicle on the
      server instead of in this browser.</p>
    </aside>
  `;
}

function renderChronicles() {
  setPageHeading('Who you have made yourself to', 'Chronicles');
  const list = factionList();
  // La pagina resta leggibile anche se un giorno una zona non avesse una
  // fazione: si mostra quello che c'e', senza lasciare un vuoto.
  const cards = list.map(renderFactionCard).join('');

  const highest = list.reduce((best, faction) => {
    const level = factionLevelFromXp(getFactionXp(faction.id));
    return level > best.level ? { level, faction } : best;
  }, { level: 0, faction: null });

  const summary = highest.faction
    ? `<p class="chronicles-summary">
        The city knows you best as <b>${highest.faction.name}</b>, who has you at level ${highest.level}.
        Standing with one faction costs you the other: every point won is a point lost across the water.
      </p>`
    : '';

  document.getElementById('viewContent').innerHTML = `
    <section class="chronicles-view">
      ${renderStorageWarning()}
      <p class="eyebrow">Standing</p>
      <h3>The four powers of the lagoon</h3>
      ${summary}
      <p class="panel-hint chronicles-hint">
        Standing rises when you pass work in a faction's own realm, and falls with the faction
        that opposes it. A failed attempt changes nothing: you are unlucky, not suspected. New
        pages open as you climb.
      </p>
      <div class="faction-grid">
        ${cards || '<p class="deck-empty">No faction has claimed this city yet.</p>'}
      </div>
    </section>
  `;
}

function getChronicleStats() {
  const allActions = getAllActions().map((entry) => entry.action);
  const uniqueActions = allActions.filter((action) => action.repeatable === false);

  return {
    deedsResolved: (state.player.completedEvents || []).length,
    uniqueTotal: uniqueActions.length,
    uniqueResolved: uniqueActions.filter((action) => getEventRecord(action.id)).length,
    repeatableTotal: allActions.length - uniqueActions.length,
    properties: state.player.properties.length,
    chronicleEntries: state.player.log.length,
    chanceDrops: state.player.log.filter((entry) => (entry.message || '').includes('Chance yielded')).length
  };
}

function renamePlayer(name) {
  const trimmed = String(name ?? '').trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return { ok: false, reason: 'A chronicle cannot be written under an empty name.' };
  }

  if (trimmed.length > NAME_MAX_LENGTH) {
    return { ok: false, reason: `Keep the name under ${NAME_MAX_LENGTH} characters.` };
  }

  if (trimmed === state.player.name) {
    return { ok: true, unchanged: true };
  }

  const previous = state.player.name;
  state.player.name = trimmed;
  addLog(`You answer to a new name: ${previous} is now ${trimmed}.`, 'Identity', 'You renamed yourself from the Profile page. Nothing else in the chronicle was touched.');
  saveGame();

  return { ok: true, name: trimmed };
}

function buildSaveFileName() {
  const slug = state.player.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'chronicle';
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  return `salt-republic-${slug}-${stamp}.json`;
}

function exportSave() {
  const payload = {
    app: 'the-drowned-serenissima',
    format: 1,
    exportedAt: new Date().toISOString(),
    state
  };
  const fileName = buildSaveFileName();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  addLog('The chronicle was written out to a file for safekeeping.', 'Backup', 'You exported your save from the Profile page. The file carries your name, attributes, resources, properties, resolved encounters and the whole chronicle.');
  saveGame();
  profileNotice = `Exported as ${fileName}. Keep that file somewhere safe.`;
  render();
}

function isImportedStateSane(candidate) {
  if (!candidate || !candidate.player || typeof candidate.player !== 'object') return false;
  const stats = candidate.player.stats;
  if (!stats || Object.keys(stats).length !== Object.keys(statNames).length) return false;
  if (!Object.keys(statNames).every((key) => Number.isFinite(Number(stats[key])))) return false;
  const resources = candidate.player.resources || {};
  if (!Object.keys(resourceNames).every((key) => Number.isFinite(Number(resources[key])))) return false;

  return Array.isArray(candidate.player.log);
}

function importSave(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onerror = () => {
    profileNotice = 'That file could not be read from your computer.';
    render();
  };
  reader.onload = () => {
    let parsed = null;
    try {
      parsed = JSON.parse(String(reader.result));
    } catch (error) {
      profileNotice = 'That file is not a readable chronicle: it is not valid JSON.';
      render();
      return;
    }

    const incoming = parsed && typeof parsed === 'object' && parsed.state && typeof parsed.state === 'object' ? parsed.state : parsed;
    const playerData = incoming && typeof incoming === 'object' ? incoming.player : null;
    if (!playerData || typeof playerData !== 'object' || typeof playerData.stats !== 'object' || !playerData.stats) {
      profileNotice = 'That file is not a Salt Republic chronicle: it carries no player data.';
      render();
      return;
    }

    const backup = localStorage.getItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incoming));
    const reloaded = loadSave();

    if (!isImportedStateSane(reloaded)) {
      if (backup) localStorage.setItem(STORAGE_KEY, backup);
      else localStorage.removeItem(STORAGE_KEY);
      profileNotice = 'The chronicle inside that file is damaged. Nothing was changed.';
      render();
      return;
    }

    state = reloaded;
    state.isLoaded = true;
    syncHandWithActiveMalus();
    addLog(`The chronicle of ${state.player.name} was restored from a file.`, 'Backup', 'You imported a save from the Profile page; it replaced the chronicle that was open in this browser.');
    saveGame();
    profileNotice = `Restored ${state.player.name}: ${state.player.log.length} chronicle entries and ${state.player.completedEvents.length} deeds resolved.`;
    render();
  };

  reader.readAsText(file);
}

function resetGame() {
  localStorage.removeItem(STORAGE_KEY);
  // Un invio cloud gia' in coda trasporterebbe la cronaca di un momento fa e la
  // rimetterebbe sul server: il reset sembrerebbe non funzionare e i tuoi oggetti
  // ricomparirebbero al prossimo avvio. Il timer va annullato prima di creare lo
  // stato nuovo.
  if (cloudSaveTimer) {
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = null;
  }
  // Il save su Supabase non si cancella: il reset e' una decisione di gioco, non
  // una disdetta dell'account. Viene pero' sovrascritto subito dallo stato nuovo,
  // altrimenti il server riporterebbe in vita la partita appena cancellata.
  state = createDefaultState();
  currentView = 'tales';
  resetArmed = false;
  profileNotice = '';
  initializeTideDeck();
  addLog('The chronicle is wiped clean. The lagoon breathes beneath the city again, and a quiet path opens before you.', 'New Beginning', `You erased the autosave yourself from the Profile page. You begin again as ${state.player.name} in ${locations[state.currentLocationId].realm}, owning nothing: the Brine-Farm and every other path must be earned again.`);
  saveGame();
  render();
}

// ============================================================================
// Pannello Account (renderizzato dentro la pagina Profile).
//
// Tre stati possibili, e il pannello si adatta a tutti e tre:
//   - servizi non configurati -> spiega come attivarli, il gioco resta locale;
//   - ospite                 -> form di login/registrazione;
//   - connesso               -> email, ultimo sync, logout.
// ============================================================================

// true solo se auth.js e' stato caricato. Nei test il file non viene
// caricato, quindi questa funzione deve restare innocua.
function getAuth() {
  return typeof auth !== 'undefined' ? auth : null;
}

function renderAccountPanel() {
  const service = getAuth();
  if (!service) return '';

  if (!service.enabled) {
    return `
      <section class="info-panel profile-panel">
        <h3>Online accounts</h3>
        <p class="panel-hint">Not configured in this build. Your chronicle is saved on this browser only. To enable accounts, add your Supabase URL and anon key to auth.js and run supabase-schema.sql.</p>
      </section>
    `;
  }

  if (service.user) {
    const synced = service.lastSyncedAt
      ? `Last synced ${new Date(service.lastSyncedAt).toLocaleTimeString()}.`
      : 'Not synced yet on this device.';
    return `
      <section class="info-panel profile-panel">
        <h3>Account</h3>
        <p class="panel-hint">Signed in as ${service.user.email || 'an account without a public email'}. Your chronicle follows you across devices, and this browser keeps a local copy as backup. ${synced}</p>
        <div class="profile-controls">
          <button type="button" class="profile-button" data-auth-signout>Sign out</button>
        </div>
      </section>
    `;
  }

  const busy = service.busy ? ' disabled' : '';
  return `
    <section class="info-panel profile-panel">
      <h3>Online accounts</h3>
      <p class="panel-hint">Sign in to keep your chronicle online and play it from any device. Or keep playing here as a guest: the game stays fully playable, saved on this browser.</p>
      <div class="profile-controls">
        <button type="button" class="profile-button auth-google" data-auth-google${busy}>Continue with Google</button>
      </div>
      <div class="profile-controls">
        <input id="authEmailInput" class="profile-input" type="email" placeholder="Email" autocomplete="email" aria-label="Email" />
        <input id="authPasswordInput" class="profile-input" type="password" placeholder="Password" autocomplete="current-password" aria-label="Password" />
      </div>
      <div class="profile-controls">
        <button type="button" class="profile-button" data-auth-signin${busy}>Sign in</button>
        <button type="button" class="profile-button" data-auth-signup${busy}>Create account</button>
      </div>
      ${service.notice ? `<p class="profile-notice">${service.notice}</p>` : ''}
    </section>
  `;
}

// Mostra un messaggio dentro il pannello account e ridisegna. Usato dai
// handler di login/logout per confermare o spiegare un errore.
function setAuthNotice(message) {
  const service = getAuth();
  if (!service) return;
  service.notice = message;
  render();
}

// Esegue un'azione di account girando il bottone in stato "busy" per evitare
// doppi click (che creerebbero due richieste di registrazione).
async function runAuthAction(action) {
  const service = getAuth();
  if (!service || !service.enabled) return;
  service.busy = true;
  render();
  try {
    await action(service);
  } finally {
    service.busy = false;
    render();
  }
}

// Dopo un login riuscito, porta sul server la cronaca che era in locale. Se
// l'account aveva gia' una cronaca piu' recente, vince quella e la locale
// viene scartata, altrimenti i due dispositivi si sovrascriverebbero a
// vicenda perdendo i progressi. Viene sempre scritta una copia in locale,
// cosi' il gioco resta giocabile anche se poi la rete cade.
async function syncAfterLogin() {
  const service = getAuth();
  if (!service || !service.enabled || !service.user) return;

  const remote = await service.pullSave();
  if (remote.ok && remote.state) {
    const localStamp = state.savedAt || 0;
    if (remote.updatedAt > localStamp) {
      state = remote.state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      initializeTideDeck();
      addLog('Your chronicle was restored from the cloud.', 'Cloud', 'The save on your account was newer than the one on this device, so it won. This copy is now kept on both.');
      render();
      await service.pushSave(state);
      service.notice = 'Welcome back. Your online chronicle was newer, so it was restored.';
      return;
    }
  }

  const pushed = await service.pushSave(state);
  service.notice = pushed.ok
    ? 'Signed in. This chronicle is now saved online.'
    : `Signed in, but the online save did not go through: ${pushed.reason || 'unknown error'}`;
}

function renderProfile() {
  const location = locations[state.currentLocationId];
  const stats = getChronicleStats();
  const resolvedUnique = getAllActions()
    .map((entry) => entry.action)
    .filter((action) => action.repeatable === false && getEventRecord(action.id));
  const succeededUnique = resolvedUnique.filter((action) => getEventRecord(action.id).outcome === 'Success');
  const failedUnique = resolvedUnique.filter((action) => getEventRecord(action.id).outcome !== 'Success');

  setPageHeading('Name and standing', 'Profile');
  document.getElementById('viewContent').innerHTML = `
    <section class="profile-view">
      <p class="eyebrow">The current life</p>
      <h3>${state.player.name}</h3>
      <p>Resident of ${location.realm} · ${location.name}</p>

      <div class="profile-facts">
        <div><span>Properties</span><strong>${stats.properties}</strong></div>
        <div><span>Deeds resolved</span><strong>${stats.deedsResolved}</strong></div>
        <div><span>Unique encounters</span><strong>${stats.uniqueResolved} / ${stats.uniqueTotal}</strong></div>
        <div><span>Repeatable encounters</span><strong>${stats.repeatableTotal}</strong></div>
        <div><span>Chronicle entries</span><strong>${stats.chronicleEntries}</strong></div>
        <div><span>Chance rewards</span><strong>${stats.chanceDrops}</strong></div>
      </div>

      <section class="info-panel profile-panel">
        <h3>Your name</h3>
        <p class="panel-hint">The name written on this chronicle. It travels with your deeds; nothing else in your life changes.</p>
        <div class="profile-controls">
          <input id="profileNameInput" class="profile-input" type="text" maxlength="${NAME_MAX_LENGTH}" value="${state.player.name}" aria-label="Your name" />
          <button type="button" class="profile-button" data-rename-player>Rename</button>
        </div>
        ${profileNotice ? `<p class="profile-notice${resetArmed ? ' danger' : ''}">${profileNotice}</p>` : ''}
      </section>

      <section class="info-panel profile-panel">
        <h3>Unique encounters resolved</h3>
        <p class="panel-hint">Every unique encounter you have already resolved. They no longer appear in their realm, but the deed stays on record here, ready for a later story to build on it.</p>
        ${succeededUnique.length
          ? `<div class="info-list">${succeededUnique.map((action) => {
              const record = getEventRecord(action.id);
              return `<div class="info-row"><span>${action.title}</span><strong>${record.outcome}${record.at ? ` · ${record.at}` : ''}</strong></div>`;
            }).join('')}</div>`
          : '<p class="deck-empty">None yet. The four opening deeds at Lagoon Heart hold the first ones.</p>'}
      </section>

      <section class="info-panel profile-panel">
        <h3>Unique encounters still open</h3>
        <p class="panel-hint">Unique encounters you attempted but did not pass. They never left their realm, so you can always take them again.</p>
        ${failedUnique.length
          ? `<div class="info-list">${failedUnique.map((action) => {
              const record = getEventRecord(action.id);
              return `<div class="info-row"><span>${action.title}</span><strong>${record.outcome}${record.at ? ` · ${record.at}` : ''}</strong></div>`;
            }).join('')}</div>`
          : '<p class="deck-empty">Nothing left half done.</p>'}
      </section>

      ${renderAccountPanel()}

      <section class="info-panel profile-panel">
        <h3>Backup your chronicle</h3>
        <p class="panel-hint">A save only lives in this browser, on this address alone. Export it to keep a copy or carry it to another computer; import a file to put a chronicle back where it left off.</p>
        <div class="profile-controls">
          <button type="button" class="profile-button" data-export-save>Export save</button>
          <label class="profile-button" for="saveFileInput">Import save</label>
          <input id="saveFileInput" class="save-file-input" type="file" accept="application/json,.json" aria-label="Import a chronicle file" />
        </div>
      </section>

      <section class="info-panel profile-panel danger-panel">
        <h3>Reset the chronicle</h3>
        <p class="panel-hint">Erases the autosave: name, attributes, resources, properties, every resolved encounter and the whole chronicle. A fresh start gives you nothing, and the Brine-Farm has to be earned again through the opening chain.</p>
        <div class="profile-controls">
          ${resetArmed
            ? '<button type="button" class="profile-button danger" data-reset-game>Yes, erase everything</button><button type="button" class="profile-button" data-cancel-reset>Keep playing</button>'
            : '<button type="button" class="profile-button danger" data-arm-reset>Reset the chronicle</button>'}
        </div>
        ${resetArmed ? '<p class="profile-notice danger">This cannot be undone.</p>' : ''}
      </section>
    </section>
  `;
}

function getAllActions() {
  return Object.values(locations).flatMap((location) => location.actions.map((action) => ({ action, location })));
}

function findActionById(actionId) {
  return getAllActions().find((entry) => entry.action.id === actionId)?.action || null;
}

function isChainedBehindPendingStep(action) {
  return (action.requires || []).some((requirement) => requirement.type === 'chain' && !hasSucceeded(requirement.action));
}

function getOpenActions(location) {
  return location.actions.filter((action) => !(action.repeatable === false && hasSucceeded(action.id)));
}

function getVisibleActions(location) {
  // Anything the chronicle has not actually opened for this player stays hidden:
  // locked steps, wrong hour and unresolved chains all read as "not here yet",
  // so the player is never shown a card they cannot use or spoil what is coming.
  return getOpenActions(location).filter((action) => isActionRevealed(action));
}

function isActionRevealed(action) {
  return describeEncounterWindow(action).open && !isChainedBehindPendingStep(action) && describeActionUnlock(action).met;
}

function findGrantorForProperty(property) {
  return getAllActions().find((entry) => (entry.action.success?.properties || []).includes(property)) || null;
}

function getEventRecord(actionId) {
  return (state.player.completedEvents || []).find((entry) => entry.id === actionId) || null;
}

function hasSucceeded(actionId) {
  return getEventRecord(actionId)?.outcome === 'Success';
}

function recordEventCompletion(action, outcome) {
  const records = (state.player.completedEvents || []).filter((entry) => entry.id !== action.id);
  records.unshift({
    id: action.id,
    title: action.title,
    outcome,
    at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  state.player.completedEvents = records.slice(0, 24);
}

// ============================================================================
// Reputazione.
//
// Ogni zona del mondo ha una fazione, e il gioco chiede al giocatore in quale
// si e' schierato: lavorando in una zona, la reputazione con la sua fazione sale
// e quella con l'avversaria scende. Non e' una scelta separata dal gioco, e' il
// gioco stesso a produrla.
//
// I punti non si comprano e non si regalano: si guadagnano risolvendo
// incontri, e solo se vanno bene. Un fallimento non tocca la reputazione, per
//che' il giocatore che non riesce a fare un lavoro non diventa sospettoso con
// chi glielo aveva chiesto: diventa solo sfortunato.
//
// Il valore di un incontro dipende dalla sua difficolta'. Un lavoro facile vale
// poco, uno difficile vale molto: cosi' il giocatore e' spinto a tentare le
// cose che gli costano fatica, e la sua fazione cresce con la sua bravura
// invece che con il tempo passato a girare da una parte all'altra.
// ============================================================================

// I punti per difficolta': la tabella e' volutamente non lineare, cosi' che
// superare un incontro difficile valga molto piu' di farne tre facili.
const FACTION_XP_TABLE = [
  { difficulty: 1, xp: 1 },
  { difficulty: 2, xp: 1 },
  { difficulty: 3, xp: 2 },
  { difficulty: 4, xp: 3 },
  { difficulty: 5, xp: 5 },
  { difficulty: 6, xp: 7 },
  { difficulty: 7, xp: 10 }
];

// Quanto si perde la reputazione con l'avversaria rispetto a quella guadagnata.
// La perdita e' minore del guadagno: salire deve restare vantaggioso, altrimenti
// il giocatore finirebbe a non schierarsi con nessuno, che e' l'esito peggiore.
const FACTION_RIVAL_DAMPING = 0.5;

// Tetto inferiore per la reputazione. Serve a non far scendere all'infinito:
// sotto questo punto la fazione ti ha gia' cancellato dai registri, e la
// differenza non cambia piu' niente per nessuno.
//
// Il valore segue la scala dei titoli: con la perdita dimezzata rispetto al
// guadagno, si arriva qui dopo una trentina di azioni dalla parte opposta, che
// e' dove la cosa comincia a farsi sentire e dove il gioco smette di essere
// divertente perche' si sta solo scontentando qualcuno. Andare oltre non
// aggiunge tensione, aggiunge solo numeri.
const FACTION_XP_FLOOR = -35;

function factionXpForAction(action) {
  const entry = FACTION_XP_TABLE.find((row) => row.difficulty === (action.difficulty || 1));
  if (entry) return entry.xp;
  // Difficolta' non in tabella: si prende il valore piu' vicino, cosi' un
  // incontro con difficolta' 12 non vale zero punti e non vale una fortuna.
  const highest = FACTION_XP_TABLE[FACTION_XP_TABLE.length - 1];
  return (action.difficulty || 1) > highest.difficulty ? highest.xp : 1;
}

// I punti di reputazione di una fazione, letti dallo stato. Torna sempre un
// numero: se il dato non c'e' (salvatore vecchio, file importato) vale zero,
// che e' il caso normale di un giocatore che non ha ancora lavorato per nessuno.
function getFactionXp(factionId) {
  const rep = state.player.reputation;
  if (!rep || typeof rep !== 'object') return 0;
  const value = Number(rep[factionId]);
  return Number.isFinite(value) ? Math.max(FACTION_XP_FLOOR, value) : 0;
}

function setFactionXp(factionId, value) {
  if (!state.player.reputation || typeof state.player.reputation !== 'object') {
    state.player.reputation = {};
  }
  state.player.reputation[factionId] = Math.max(FACTION_XP_FLOOR, Math.round(value));
}

// Concede reputazione alla fazione della zona in cui l'incontro e' stato
// risolto, e toglie un po' all'avversaria. Restituisce quello che e' successo,
// cosi' la finestra di risoluzione puo' mostrarlo al giocatore.
//
// Si chiama solo su successo: fallire non dice niente su di te a chi ti ha
// dato il lavoro.
function awardFactionStanding(action, locationId) {
  const faction = factionForRealm(locationRealmOf(locationId));
  if (!faction) return null;
  const gained = factionXpForAction(action);
  const before = getFactionXp(faction.id);
  setFactionXp(faction.id, before + gained);

  const rival = factions[faction.rival];
  const lost = Math.max(1, Math.round(gained * FACTION_RIVAL_DAMPING));
  const rivalBefore = getFactionXp(rival.id);
  setFactionXp(rival.id, rivalBefore - lost);

  const levelBefore = factionLevelFromXp(before);
  const levelAfter = factionLevelFromXp(before + gained);

  return {
    faction,
    rival,
    gained,
    lost,
    // `promoted` vale solo quando si sale davvero di livello con questa mossa:
    // e' il momento che il giocatore deve vedere, e vale un messaggio diverso.
    // Non quando si cambia titolo: quello arriva piu' raramente e ha gia' la
    // sua riga nella pagina delle fazioni.
    promoted: levelAfter > levelBefore,
    levelBefore,
    levelAfter,
    tier: factionTierForLevel(faction, levelAfter),
    // Un titolo nuovo e' un avvenimento raro e vale la pena dirlo a parte.
    newTitle: factionTierForLevel(faction, levelAfter).level !== factionTierForLevel(faction, levelBefore).level
  };
}

// La zona di un luogo. Passa dall'id del luogo al nome della regione, che e' la
// chiave con cui le fazioni sono agganciate.
function locationRealmOf(locationId) {
  const location = locations[locationId];
  if (!location) return null;
  return location.realm;
}

// Una condizione di sblocco nuova: "raggiungi il livello N con la fazione X".
// Va letta insieme alle altre perche' il resto del gioco non deve sapere come
// funziona la reputazione, solo che questa condizione esiste e come si chiama.
function isFactionRequirementMet(requirement) {
  if (typeof factions[requirement.faction] === 'undefined') return false;
  const xp = getFactionXp(requirement.faction);
  return factionLevelFromXp(xp) >= requirement.min;
}

function describeRequirement(requirement) {
  if (requirement.type === 'faction') {
    const faction = factions[requirement.faction];
    // Una fazione inesistente in un requisito e' un dato rotto, non uno
    // sblocco impossibile: senza questo controllo l'incontro resterebbe
    // bloccato per sempre senza che nessuno capisca perche'.
    if (!faction) {
      return {
        type: 'faction',
        met: false,
        label: 'Unavailable',
        phrase: 'an unknown faction',
        infinitive: 'belong to a faction that no longer exists',
        detail: 'This requirement names a faction that is not in the world.'
      };
    }
    const xp = getFactionXp(faction.id);
    const current = factionLevelFromXp(xp);
    const missing = Math.max(0, requirement.min - current);
    const rank = factionRankFromXp(xp);
    return {
      type: 'faction',
      met: missing === 0,
      label: `Reach ${rank.label} with ${faction.name}`,
      phrase: `reaching ${rank.label} with ${faction.name}`,
      infinitive: `be known to ${faction.name}`,
      detail: missing === 0
        ? `${faction.name} knows you as ${rank.label}.`
        : `${faction.name} has you as ${rank.label}, at level ${current}. ${missing} more level${missing === 1 ? '' : 's'} needed.`
    };
  }

  if (requirement.type === 'property') {
    const owned = state.player.properties.includes(requirement.value);
    const grantor = owned ? null : findGrantorForProperty(requirement.value);
    return {
      type: 'property',
      met: owned,
      label: `Own the property “${requirement.value}”`,
      phrase: `owning “${requirement.value}”`,
      infinitive: `own the property “${requirement.value}”`,
      detail: owned
        ? 'You own it.'
        : grantor
          ? `You do not own it yet. Claim it by resolving “${grantor.action.title}” in ${grantor.location.realm}.`
          : 'You do not own it yet.'
    };
  }

  if (requirement.type === 'stat') {
    const statLabel = statNames[requirement.stat] || requirement.stat;
    const current = getEffectiveStat(requirement.stat);
    const missing = Math.max(0, requirement.min - current);
    return {
      type: 'stat',
      met: missing === 0,
      label: `Reach ${statLabel} ${requirement.min}`,
      phrase: `reaching ${statLabel} ${requirement.min}`,
      infinitive: `reach ${statLabel} ${requirement.min}`,
      detail: missing === 0
        ? `${statLabel} stands at ${current}.`
        : `${statLabel} stands at ${current}; ${missing} level${missing === 1 ? '' : 's'} short.`
    };
  }

  if (requirement.type === 'chain') {
    const target = findActionById(requirement.action);
    const title = target ? target.title : requirement.action;
    const record = getEventRecord(requirement.action);
    const at = record?.at ? ` at ${record.at}` : '';
    return {
      type: 'chain',
      met: hasSucceeded(requirement.action),
      label: `Continue the chain from “${title}”`,
      phrase: `continuing from “${title}”`,
      infinitive: `continue from “${title}”`,
      detail: !record
        ? 'You have not attempted that event yet.'
        : record.outcome === 'Success'
          ? `You already resolved it as success${at}.`
          : `You failed it${at}. The step stays closed until you resolve it again.`
    };
  }

  if (requirement.type === 'resource') {
    const resourceLabel = resourceNames[requirement.key] || requirement.key;
    const current = state.player.resources[requirement.key] || 0;
    const missing = Math.max(0, requirement.min - current);
    return {
      type: 'resource',
      met: missing === 0,
      label: `Hold ${requirement.min} ${resourceLabel}`,
      phrase: `holding ${requirement.min} ${resourceLabel}`,
      infinitive: `hold ${requirement.min} ${resourceLabel}`,
      detail: missing === 0 ? `You hold ${current}.` : `You hold ${current}; ${missing} short.`
    };
  }

  return { type: 'unknown', met: true, label: 'No recorded condition', phrase: '', infinitive: '', detail: '' };
}

function describeChainLink(action) {
  if (!action.chain || !action.chain.follows) return null;
  const target = findActionById(action.chain.follows);
  const title = target ? target.title : action.chain.follows;
  const record = getEventRecord(action.chain.follows);
  const succeeded = hasSucceeded(action.chain.follows);
  const gating = (action.requires || []).some((requirement) => requirement.type === 'chain' && requirement.action === action.chain.follows);
  return {
    met: succeeded,
    gating,
    label: action.chain.label || `Sequel of “${title}”`,
    detail: !record
      ? (gating
          ? `This step opens only once you resolve “${title}”.`
          : `The next step after “${title}”; it stays open on its own and does not lock.`)
      : record.outcome === 'Success'
        ? `You already resolved “${title}” as success; this is the step that follows it.`
        : `You failed “${title}”. It never left this place, so this step is still waiting.`
  };
}

function describeActionUnlock(action) {
  const conditions = (action.requires || []).map((requirement) => describeRequirement(requirement));
  const unique = action.repeatable === false;
  const resolved = unique && hasSucceeded(action.id);
  const attempted = unique && Boolean(getEventRecord(action.id));
  return {
    kind: conditions.length ? 'conditioned' : 'initial',
    unique,
    resolved,
    attempted,
    conditions,
    chainLink: describeChainLink(action),
    met: conditions.every((condition) => condition.met) && !resolved,
    unmet: conditions.filter((condition) => !condition.met)
  };
}

function joinPhrases(phrases) {
  if (phrases.length <= 1) return phrases[0] || '';

  return `${phrases.slice(0, -1).join(', ')} and ${phrases[phrases.length - 1]}`;
}

function summarizeUnlock(action) {
  const unlock = describeActionUnlock(action);
  let sentence;

  if (unlock.resolved) {
    sentence = 'Already resolved: this encounter is unique and cannot be taken again.';
  } else if (unlock.attempted) {
    sentence = 'Still open: this unique encounter was attempted and failed, so it stayed in its realm until you pass it.';
  } else if (unlock.kind === 'initial') {
    sentence = 'Available from the start: this encounter is open from the first day and no earlier deed of yours was needed to unlock it.';
  } else if (unlock.met) {
    sentence = `Unlocked by ${joinPhrases(unlock.conditions.map((condition) => condition.phrase))}.`;
  } else {
    sentence = `Still locked: you have yet to ${joinPhrases(unlock.unmet.map((condition) => condition.infinitive))}.`;
  }

  if (unlock.chainLink) sentence += ` ${unlock.chainLink.detail}`;

  return sentence;
}

function getActionLockReason(action) {
  const unlock = describeActionUnlock(action);
  if (unlock.met) return '';
  if (unlock.resolved) return 'This encounter is unique: it resolves once and cannot be repeated.';

  return unlock.unmet.map((condition) => `${condition.label} — ${condition.detail}`).join(' ');
}

function describeCost(cost) {
  if (!cost) return '';

  return Object.entries(cost).map(([key, value]) => `${value} ${resourceNames[key] || key}`).join(' + ');
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function formatEffectAmount(key, amount) {
  const sign = amount >= 0 ? '+' : '';
  if (key in statNames) return `${statNames[key]} +${amount} XP`;
  if (key in malusNames) return `${malusNames[key]} ${sign}${amount} level${Math.abs(amount) === 1 ? '' : 's'}`;

  return `${resourceNames[key] || key} ${sign}${amount}`;
}

function formatOutcomeEffects(effect = {}) {
  const parts = [];
  Object.entries(effect.resources || {}).forEach(([key, value]) => parts.push(formatEffectAmount(key, value)));
  Object.entries(effect.experience || {}).forEach(([key, value]) => parts.push(formatEffectAmount(key, value)));
  Object.entries(effect.stats || {}).forEach(([key, value]) => parts.push(formatEffectAmount(key, value)));
  (effect.properties || []).forEach((property) => parts.push(`Unlocks ${property}`));

  return parts.join(' · ');
}

function formatChanceRewards(action) {
  return (action.chanceRewards || [])
    .map((entry) => {
      const reward = formatEffectAmount(entry.resource, entry.amount);
      return entry.name ? `${formatPercent(entry.chance)} ${entry.name} (${reward})` : `${formatPercent(entry.chance)} ${reward}`;
    })
    .join(' · ');
}

function describeChanceOutcome(dropped) {
  if (!dropped.length) return '';

  return ` Chance yielded ${dropped.map((entry) => entry.name || formatEffectAmount(entry.resource, entry.amount)).join(' and ')}.`;
}

function grantChanceRewards(action) {
  const dropped = (action.chanceRewards || []).filter((entry) => Math.random() < entry.chance);
  if (!dropped.length) return [];

  const resources = {};
  dropped.forEach((entry) => {
    resources[entry.resource] = (resources[entry.resource] || 0) + entry.amount;
  });
  applyReward({ resources }, { action, outcome: 'Success' });

  return dropped;
}

function renderEncounterKind(unlock) {
  if (unlock.unique) {
    return '<p class="encounter-kind unique"><strong>Unique</strong>This encounter belongs to the story and happens once. Resolve it and it leaves this place for good, recorded in your profile as a deed already done.</p>';
  }

  return '<p class="encounter-kind repeatable"><strong>Repeatable</strong>This encounter stays open. Return to it as often as your Vigor allows and farm it for its yields.</p>';
}

function renderActionRewards(action) {
  const lines = ['<p class="reward-heading">What this encounter can yield</p>'];
  const cost = action.cost ? describeCost(action.cost) : '';
  const success = formatOutcomeEffects(action.success);
  const chances = formatChanceRewards(action);
  const failure = formatOutcomeEffects(action.failure);

  lines.push(`<p class="reward-line cost"><b>Cost</b>1 Vigor${cost ? ` · ${cost}` : ''}</p>`);
  if (success) lines.push(`<p class="reward-line success"><b>On success</b>${success}</p>`);

  // Gli oggetti hanno una riga tutta loro invece di stare accodati in "On
  // success". Il giocatore sta guardando una scheda per capire se vale la pena
  // premere: se l'unica traccia di un oggetto e' una voce in coda a un elenco di
  // numeri, l'oggetto non si vede.
  //
  // La riga resta anche quando l'oggetto e' gia' in tasca, e lo segnala: un
  // incontro ripetibile che accorcia la propria lista a ogni uso, dopo due passi
  // smette di dire che cosa e' e cosa da.
  const itemLine = describeActionItems(action);
  if (itemLine) lines.push(`<p class="reward-line items"><b>Items</b>${itemLine}</p>`);

  // Quanto standing porta questo incontro, detto prima di giocarlo. Il numero e'
  // quello che `awardFactionStanding` assegna davvero, dalla stessa tabella, quindi
  // non puo' divergere da quello che il giocatore vede dopo.
  //
  // La riga e' sull'esito e non sul pulsante perche' e' `awardFactionStanding` a
  // decidere se lo standing arriva, e lo chiama solo sul successo: fallire non
  // dice niente su di te a chi ti ha dato il lavoro.
  const standingLine = describeActionStanding(action);
  if (standingLine) lines.push(`<p class="reward-line standing">${standingLine}</p>`);

  if (chances) lines.push(`<p class="reward-line chance"><b>Chance drops</b>${chances}</p>`);
  if (failure) lines.push(`<p class="reward-line failure"><b>On failure</b>${failure}</p>`);

  return `<div class="action-rewards">${lines.join('')}</div>`;
}

// Gli oggetti che un incontro puo' dare, scritti col loro nome e lo slot in cui
// andranno.
//
// La riga non sparisce quando l'oggetto e' gia' in tasca: sparisce solo quando
// l'incontro non da piu' niente di nuovo, e cioe' quando non ha oggetti da
// elencare. Un elenco che si accorcia a ogni uso e' un elenco che smette di
// dire che quell'incontro esiste e cosa fa: dopo due passi al banco non si sa
// piu' che da li' si ottiene roba. Quello che si spegne e' solo l'avviso di
// novita', non la voce.
//
// Chi e' gia' in tasca resta nell'elenco ma in grigio: e' una delle voci piu'
// utili della scheda, perche' dice "questa l'hai fatta". Diventandola invisibile
// si perderebbe esattamente l'informazione che distingue un incontro che hai
// gia' attraversato da uno che ti resta davanti.
function describeActionItems(action) {
  const fresh = [];
  const owned = [];
  (action.success?.items || []).forEach((itemId) => {
    const item = findEquipmentItem(itemId);
    // Un id che non esiste e' un dato rotto: si salta, non si blocca la pagina.
    if (!item) return;
    const slotLabel = equipmentSlots.find((slot) => slot.key === item.slot)?.label || item.slot;
    const entry = `${item.name} (${slotLabel})`;
    const hasIt = state.player.equipment[item.slot] === item.id || state.player.inventory.includes(item.id);
    (hasIt ? owned : fresh).push(entry);
  });

  // I pezzi nuovi vengono per primi: sono quelli per cui vale la pena premere.
  // Dietro, spenti e dichiarati, quelli che il giocatore ha gia' raccolto. La
  // parola "already yours" resta anche se il colore dice gia' la stessa cosa:
  // il colore si perde sui monitor spenti, in una pagina lunga, e per chi legge
  // veloce. La frase e' la certezza, il colore e' l'aiuto visivo.
  return [
    ...fresh,
    ...owned.map((entry) => `<span class="item-owned">${entry} · already yours</span>`)
  ].join(' · ');
}

// La riga di reputazione dentro i premi di un incontro.
//
// La fazione viene dalla zona in cui l'incontro si svolge, non dall'incontro: e'
// il lavoro che fai in un posto a farti notare da chi lavora li'. La perdita per
// l'avversaria e' metta di quanto guadagni, e la riga lo dice, perche' una cosa
// che arriva e una cosa che va altrove devono essere entrambe visibili prima di
// premere.
function describeActionStanding(action) {
  const faction = factionForRealm(locationRealmOf(state.currentLocationId));
  if (!faction) return '';
  const gained = factionXpForAction(action);
  const lost = Math.max(1, Math.round(gained * FACTION_RIVAL_DAMPING));
  const rival = factions[faction.rival];
  return `<b>Standing</b>${faction.name} +${gained}, ${rival.name} −${lost}, on success only`;
}

function renderActionUnlock(action) {
  const unlock = describeActionUnlock(action);
  const location = locations[state.currentLocationId];
  const items = [];

  if (unlock.kind === 'initial') {
    items.push(`
      <li class="unlock-item initial">
        <span class="unlock-mark" aria-hidden="true">✦</span>
        <span class="unlock-text"><b>Available from the start.</b>This one was never locked. It stands in ${location.realm} from the first day, and nothing in your chronicle had to open it.</span>
      </li>
    `);
  } else if (unlock.attempted && !unlock.resolved) {
    items.push(`
      <li class="unlock-item retry">
        <span class="unlock-mark" aria-hidden="true">↻</span>
        <span class="unlock-text"><b>Failed before, still open.</b>You did not pass it last time, so it never left this place. Take it again.</span>
      </li>
    `);
  }

  unlock.conditions.forEach((condition) => {
    items.push(`
      <li class="unlock-item ${condition.met ? 'met' : 'unmet'}">
        <span class="unlock-mark" aria-hidden="true">${condition.met ? '✓' : '✕'}</span>
        <span class="unlock-text"><b>${condition.label}</b><span class="unlock-detail">${condition.detail}</span></span>
      </li>
    `);
  });

  if (unlock.chainLink) {
    items.push(`
      <li class="unlock-item link ${unlock.chainLink.met ? 'met' : ''}">
        <span class="unlock-mark" aria-hidden="true">◈</span>
        <span class="unlock-text"><b>${unlock.chainLink.label}</b><span class="unlock-detail">${unlock.chainLink.detail}</span></span>
      </li>
    `);
  }

  return `
    <div class="unlock-block ${unlock.met ? 'is-open' : 'is-locked'}">
      <p class="unlock-heading">How this unlocked</p>
      <ul class="unlock-list">${items.join('')}</ul>
      <p class="unlock-story">Why it surfaces here: ${action.appearanceReason}</p>
    </div>
  `;
}

function renderActions() {
  const location = locations[state.currentLocationId];
  const visibleActions = getVisibleActions(location);
  const list = document.getElementById('actionList');

  if (!visibleActions.length) {
    const open = getOpenActions(location);
    const reasons = [];
    if (open.some((action) => isChainedBehindPendingStep(action))) reasons.push('Some are still waiting on an earlier step of their story.');
    if (open.some((action) => !describeEncounterWindow(action).open)) reasons.push('Some only happen in another hour.');
    if (open.some((action) => !describeActionUnlock(action).met)) reasons.push('Some need more from you before they surface here.');
    const suffix = reasons.length ? ` ${reasons.join(' ')}` : open.length ? ' Every encounter in this place is already resolved.' : '';
    list.innerHTML = `<p class="deck-empty">Nothing is open to you here right now.${suffix}</p>`;
    return;
  }

  list.innerHTML = visibleActions.map((action) => {
    const unlock = describeActionUnlock(action);
    const encounterWindow = describeEncounterWindow(action);
    const accessible = unlock.met;
    const inWindow = encounterWindow.open;
    const affordable = canAfford(action.cost);
    const hasVigor = state.player.vigor > 0;
    const chance = getTestChance(action);
    const canCommit = accessible && inWindow && affordable && hasVigor;
    // Il bottone dice solo "Initiate". Il costo in Vigor era gia' scritto due volte
    // nella scheda, nella riga dei costi e nella lista delle pastiglie: ripeterlo qui
    // non aggiungeva niente e rubava spazio al pulsante. Gli altri casi restano
    // parlanti perche' dicono perche' non si puo' agire, e non sono un costo: sono
    // lo stato della scheda.
    const commitLabel = !accessible
      ? 'Locked'
      : !inWindow
        ? encounterWindow.label
        : !affordable
          ? 'Unaffordable'
          : !hasVigor
            ? 'Resting'
            : 'Initiate';
    return `
      <article class="action-card ${accessible ? '' : 'locked'}">
        <div class="action-thumb" aria-hidden="true"></div>
        <div class="action-body">
          <h4>${action.title}</h4>
          <p>${action.summary}</p>
          ${renderActionUnlock(action)}
          ${renderEncounterKind(unlock)}
          ${inWindow ? '' : `<p class="window-notice"><span aria-hidden="true">${encounterWindow.icon}</span>This encounter is here but waits for ${encounterWindow.label === 'Night only' ? 'nightfall' : 'daylight'}. Come back to it in the right hour.</p>`}
          ${renderActionRewards(action)}
          ${!affordable ? `<p class="lock-reason">Cost stands in the way: ${describeCost(action.cost)} must be paid before you commit.</p>` : ''}
          <div class="action-meta">
            <span class="meta-pill success">${statNames[action.test]} test</span>
            <span class="meta-pill">Diff ${action.difficulty}</span>
            <span class="meta-pill odds-${chanceTone(chance)}" title="${statNames[action.test]} ${state.player.stats[action.test] || 0} against difficulty ${action.difficulty}. Roll 1-100 and you pass at ${chance} or lower.">${chance}% to pass</span>
            <span class="meta-pill">1 Vigor</span>
            <span class="meta-pill ${inWindow ? 'when-open' : 'when-shut'}">${encounterWindow.icon} ${encounterWindow.label}</span>
            ${unlock.unique ? '<span class="meta-pill unique">Unique</span>' : '<span class="meta-pill repeatable">Repeatable</span>'}
            ${accessible ? '<span class="meta-pill success">Unlocked</span>' : '<span class="meta-pill locked">Locked</span>'}
          </div>
        </div>
        <button class="action-button ${canCommit ? '' : 'locked'}" data-action-id="${action.id}" ${canCommit ? '' : 'disabled'} title="${hasVigor ? 'Costs 1 Vigor' : 'Out of Vigor; wait for regeneration'}">
          ${commitLabel}
        </button>
      </article>
    `;
  }).join('');
  list.querySelectorAll('.action-thumb').forEach((thumb, index) => {
    thumb.style.backgroundImage = `linear-gradient(180deg, rgba(15, 12, 9, 0.08), rgba(15, 12, 9, 0.3)), url("${visibleActions[index].image}")`;
  });
}

function renderPerils() {
  const labels = {
    scandal: ['Scandal', '<svg viewBox="0 0 24 24"><path d="M12 3.5a7.5 7.5 0 0 0-7.5 7.5v2.1c0 1.3.7 2.5 1.8 3.2l1.2.8v2.4h9v-2.4l1.2-.8a3.8 3.8 0 0 0 1.8-3.2V11A7.5 7.5 0 0 0 12 3.5Z"/><path d="M8 10h2m4 0h2M9 14h6m-5.5 3.5v2m5-2v2"/><circle cx="9" cy="10.5" r="1.2"/><circle cx="15" cy="10.5" r="1.2"/></svg>'],
    wounds: ['Wounds', '<svg viewBox="0 0 24 24"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/></svg>'],
    suspicion: ['Suspicion', '<svg viewBox="0 0 24 24"><path d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>'],
    nightmare: ['Nightmare', '<svg viewBox="0 0 24 24"><path d="M19 15.5A8 8 0 0 1 8.5 5a8.5 8.5 0 1 0 10.5 10.5Z"/><path d="m16 4 .7 1.5L18 6l-1.3.5L16 8l-.7-1.5L14 6l1.3-.5z"/></svg>'],
    debt: ['Debt', '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M15 8.5c-.7-.7-1.5-1-2.8-1-1.5 0-2.7.8-2.7 2s1 1.8 2.7 2.3 2.7 1 2.7 2.2-1.2 2.2-2.9 2.2c-1.2 0-2.3-.4-3-1.2M12 5.5v13"/></svg>']
  };
  const activePerils = Object.entries(state.player.malus).filter(([, value]) => value > 0);
  const container = document.getElementById('perilSigils');
  container.innerHTML = activePerils.length
    ? activePerils.map(([key, value]) => {
      const [label, icon] = labels[key];
      const progress = Math.min(value, 6) / 6 * 100;
      const level = value >= 3 ? 'High' : 'Low';
      return `<div class="peril-sigil" title="${label}: ${level}, level ${value}" aria-label="${label}, level ${value} of 6"><span class="peril-symbol" aria-hidden="true">${icon}</span><span class="peril-count" aria-hidden="true">${value}</span><div class="peril-details"><div class="peril-detail-heading"><b>${label}</b><span>${value}/6 · ${level}</span></div><span class="peril-track" aria-hidden="true"><i style="width:${progress}%"></i></span></div></div>`;
    }).join('')
    : '<span class="no-perils">No active perils</span>';
}

function render() {
  renderSidebar();
  const renderers = {
    tales: renderTales,
    map: renderMap,
    deck: renderDeck,
    persona: renderPersona,
    equipment: renderEquipment,
    lore: renderLore,
    chronicles: renderChronicles,
    profile: renderProfile
  };
  renderers[currentView]();
  renderResourceTimers();
}

function wireEvents() {
  document.addEventListener('click', (event) => {
    const closeResolutionButton = event.target.closest('[data-resolution-close]');
    if (closeResolutionButton && !closeResolutionButton.disabled) {
      closeResolution();
      return;
    }

    if (event.target.id === 'resolutionOverlay') {
      closeResolution();
      return;
    }

    const calendarToggle = event.target.closest('[data-calendar-toggle]');
    if (calendarToggle) {
      toggleCalendar();
      return;
    }

    if (event.target.closest('[data-calendar-close]') || event.target.id === 'calendarPanel') {
      closeCalendar();
      return;
    }

    if (event.target.closest('[data-calendar-prev]')) {
      calendarMonthOffset -= 1;
      calendarSelectedDay = null;
      renderCalendarPanel();
      return;
    }

    if (event.target.closest('[data-calendar-next]')) {
      calendarMonthOffset += 1;
      calendarSelectedDay = null;
      renderCalendarPanel();
      return;
    }

    if (event.target.closest('[data-calendar-today]')) {
      calendarMonthOffset = 0;
      calendarSelectedDay = null;
      renderCalendarPanel();
      return;
    }

    const calendarDay = event.target.closest('[data-calendar-day]');
    if (calendarDay) {
      calendarSelectedDay = Number(calendarDay.dataset.calendarDay);
      renderCalendarPanel();
      return;
    }

    const drawButton = event.target.closest('[data-card-draw]');
    if (drawButton && !drawButton.disabled) {
      drawTideCard();
      return;
    }

    const discardButton = event.target.closest('[data-card-discard]');
    if (discardButton) {
      discardTideCard(discardButton.dataset.cardDiscard);
      return;
    }

    const playButton = event.target.closest('[data-card-play]');
    if (playButton) {
      playTideCard(playButton.dataset.cardPlay);
      return;
    }

    // --- Account (opzionale). Ogni handler esce subito se auth.js non e' stato
// caricato, cosi' il gioco resta identico quando gli account non esistono.

    const googleButton = event.target.closest('[data-auth-google]');
    if (googleButton) {
      runAuthAction(async (service) => {
        const outcome = await service.signInWithGoogle();
        // Su successo il browser viene reindirizzato a Google: non ha senso
        // disegnare ancora, la pagina sta per essere sostituita.
        if (!outcome.ok) service.notice = outcome.reason;
      });
      return;
    }

    const signinButton = event.target.closest('[data-auth-signin]');
    if (signinButton) {
      runAuthAction(async (service) => {
        const email = document.getElementById('authEmailInput')?.value.trim() || '';
        const password = document.getElementById('authPasswordInput')?.value || '';
        const outcome = await service.signInWithPassword(email, password);
        if (!outcome.ok) {
          service.notice = outcome.reason;
          return;
        }
        await syncAfterLogin();
      });
      return;
    }

    const signupButton = event.target.closest('[data-auth-signup]');
    if (signupButton) {
      runAuthAction(async (service) => {
        const email = document.getElementById('authEmailInput')?.value.trim() || '';
        const password = document.getElementById('authPasswordInput')?.value || '';
        const outcome = await service.signUpWithPassword(email, password);
        // Se Supabase chiede la conferma via mail non c'e' ancora una sessione,
        // quindi non ha senso sincronizzare: si aspetta la conferma.
        if (!outcome.ok) {
          service.notice = outcome.reason;
          return;
        }
        if (!outcome.needsConfirmation) await syncAfterLogin();
      });
      return;
    }

    // Un solo gestore per ogni uscita: il bottone della sidebar e quello della
    // pagina Profile portano allo stesso codice, quindi si comportano sempre
    // allo stesso modo e non possono divergere.
    const leaveButton = event.target.closest('[data-leave], [data-auth-signout]');
    if (leaveButton) {
      handleProfileSignOut();
      return;
    }

    const renameButton = event.target.closest('[data-rename-player]');
    if (renameButton) {
      const nameInput = document.getElementById('profileNameInput');
      const outcome = renamePlayer(nameInput ? nameInput.value : '');
      if (outcome.ok) {
        profileNotice = outcome.unchanged ? 'That is already the name on your chronicle.' : `You are recorded as ${state.player.name} from now on.`;
      } else {
        profileNotice = outcome.reason;
      }
      render();
      return;
    }

    const exportButton = event.target.closest('[data-export-save]');
    if (exportButton) {
      exportSave();
      return;
    }

    const importInput = document.getElementById('saveFileInput');
    if (importInput && event.target === importInput) {
      importSave(importInput.files && importInput.files[0]);
      importInput.value = '';
      return;
    }

    const armResetButton = event.target.closest('[data-arm-reset]');
    if (armResetButton) {
      resetArmed = true;
      render();
      return;
    }

    const cancelResetButton = event.target.closest('[data-cancel-reset]');
    if (cancelResetButton) {
      resetArmed = false;
      render();
      return;
    }

    const resetButton = event.target.closest('[data-reset-game]');
    if (resetButton) {
      resetGame();
      return;
    }

    const equipRemove = event.target.closest('[data-equip-remove]');
    if (equipRemove) {
      unequipSlot(equipRemove.dataset.equipRemove);
      return;
    }

    const equipTarget = event.target.closest('[data-equip-item]');
    if (equipTarget) {
      equipItem(equipTarget.dataset.equipItem);
      return;
    }

    const viewLink = event.target.closest('[data-view]');
    if (viewLink) {
      currentView = viewLink.dataset.view;
      profileNotice = '';
      resetArmed = false;
      render();
      return;
    }

    const locationLink = event.target.closest('[data-location]');
    if (locationLink) {
      state.currentLocationId = locationLink.dataset.location;
      // Arriving somewhere is itself a reason to open new lore, so the record
      // is refreshed on travel as well as after encounters.
      if (markLocationVisited(state.currentLocationId)) refreshLoreDiscovery();
      currentView = 'tales';
      saveGame();
      render();
      return;
    }

    const actionButton = event.target.closest('[data-action-id]');
    if (actionButton) resolveAction(actionButton.dataset.actionId);
  });

document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeResolution();
    closeCalendar();
  });
}

// ============================================================================
// Schermata di benvenimento.
//
// E' la prima cosa che vede chi apre il gioco. Mostra il racconto e l'accesso,
// e sparisce in tre casi: login riuscito, account gia' aperto in una visita
// precedente, oppure scelta esplicita di giocare da ospite.
//
// La scelta dell'ospite viene ricordata in `guestChosen`: senza, l'home
// ricomparirebbe a ogni visita e chi ha scelto di provare senza account
// verrebbe inseguito da una schermata a cui ha gia' detto di no.
// ============================================================================

const GUEST_CHOICE_KEY = 'salt-republic-guest-chosen';
let welcomeBusy = false;

// true se il giocatore ha gia' deciso di giocare senza account.
function hasChosenGuest() {
  // Se la memoria non funziona, dire "no" fa tornare la schermata iniziale a ogni
  // refresh e sembra che la partita sia andata: e' il modo piu' fuorviante
  // possibile per diagnosticare un problema di memoria. Se il flag non c'e', non
  // si puo' distinguere "non ho ancora scelto" da "la scelta non e' stata scritta",
  // e il dubbio va detto al giocatore invece di lasciarglielo.
  if (storageProblem) return false;
  try {
    return localStorage.getItem(GUEST_CHOICE_KEY) === '1';
  } catch (error) {
    return false;
  }
}

function rememberGuestChoice() {
  try {
    localStorage.setItem(GUEST_CHOICE_KEY, '1');
  } catch (error) {
    // Senza memoria sul browser la home tornera' alla visita successiva:
    // un fastidio, non un blocco.
    storageProblem = diagnoseStorage();
  }
}

// Se un giorno l'ospite si registra, la scelta va dimenticata: adesso ha un
// account e non ha piu' senso saltare l'home.
function forgetGuestChoice() {
  try {
    localStorage.removeItem(GUEST_CHOICE_KEY);
  } catch (error) {
    // Come sopra: nessun effetto sul gioco.
  }
}

// Mostra o nasconde la schermata.
function showWelcomeScreen(show) {
  const screen = document.getElementById('welcomeScreen');
  const shell = document.querySelector('.app-shell');
  if (screen) screen.hidden = !show;
  if (shell) shell.setAttribute('aria-hidden', show ? 'true' : 'false');
  // L'uscita si vede solo a chi ha gia' una sessione aperta: offerta a un
  // visitatore che non ha mai fatto il login sarebbe un bottone che non fa
  // niente. Sulla schermata pero' serve, perche' l'home compare anche a chi
  // torna con l'account gia' aperto e vuole cambiarlo.
  const welcomeSignOut = document.querySelector('.welcome-signout');
  if (welcomeSignOut) {
    const service = getAuth();
    welcomeSignOut.hidden = !(service && service.enabled && service.user);
  }
  if (show) {
    const email = document.getElementById('welcomeEmail');
    if (email) email.focus();
  }
}

// Il testo di errore o di conferma sopra i bottoni. `info` lo rende verde,
// perche' non tutto quello che arriva qui e' un problema.
function setWelcomeNotice(message, info = false) {
  const notice = document.getElementById('welcomeNotice');
  if (!notice) return;
  notice.textContent = message || '';
  notice.hidden = !message;
  notice.classList.toggle('info', Boolean(info));
}

// Disattiva i bottoni durante una richiesta: senza questo, un doppio clic su
// "Create a new account" creerebbe due richieste di registrazione.
function setWelcomeBusy(busy) {
  welcomeBusy = busy;
  document.querySelectorAll('[data-welcome-signin], [data-welcome-signup], [data-welcome-google]').forEach((button) => {
    button.disabled = busy;
  });
}

// Legge i campi del modulo. Se manca qualcosa lo dice con `message`, cosi'
// l'errore si spiega sulla pagina invece che in console.
function readWelcomeCredentials() {
  const email = document.getElementById('welcomeEmail');
  const password = document.getElementById('welcomePassword');
  const address = email && email.value.trim() ? email.value.trim() : '';
  const secret = password && password.value ? password.value : '';
  if (!address || !secret) {
    return { ok: false, message: 'Enter both your email and your password.' };
  }
  if (secret.length < 6) {
    return { ok: false, message: 'The password needs at least 6 characters.' };
  }
  return { ok: true, email: address, password: secret };
}

// Un utente puo' disattivare la conferma via email su Supabase, quindi non
// diamo per scontato che serva: se c'e' una sessione si entra, altrimenti si
// dice di aprire la mail. E' l'unico punto in cui i due percorsi si separano.
async function completeWelcomeSignIn(service) {
  forgetGuestChoice();
  await syncAfterLogin();
  showWelcomeScreen(false);
  render();
  service.notice = '';
}

async function handleWelcomeSignIn() {
  const service = getAuth();
  if (!service || !service.enabled) {
    setWelcomeNotice('Online accounts are not available in this build.');
    return;
  }
  const credentials = readWelcomeCredentials();
  if (!credentials.ok) {
    setWelcomeNotice(credentials.message);
    return;
  }
  setWelcomeNotice('');
  setWelcomeBusy(true);
  try {
    const outcome = await service.signInWithPassword(credentials.email, credentials.password);
    if (!outcome.ok) {
      setWelcomeNotice(outcome.reason);
      return;
    }
    await completeWelcomeSignIn(service);
  } finally {
    setWelcomeBusy(false);
  }
}

async function handleWelcomeSignUp() {
  const service = getAuth();
  if (!service || !service.enabled) {
    setWelcomeNotice('Online accounts are not available in this build.');
    return;
  }
  const credentials = readWelcomeCredentials();
  if (!credentials.ok) {
    setWelcomeNotice(credentials.message);
    return;
  }
  setWelcomeNotice('');
  setWelcomeBusy(true);
  try {
    const outcome = await service.signUpWithPassword(credentials.email, credentials.password);
    if (!outcome.ok) {
      setWelcomeNotice(outcome.reason);
      return;
    }
    if (outcome.needsConfirmation) {
      setWelcomeNotice('Account created. Open the confirmation email, then sign in.', true);
      return;
    }
    await completeWelcomeSignIn(service);
  } finally {
    setWelcomeBusy(false);
  }
}

async function handleWelcomeGoogle() {
  const service = getAuth();
  if (!service || !service.enabled) {
    setWelcomeNotice('Online accounts are not available in this build.');
    return;
  }
  setWelcomeNotice('');
  setWelcomeBusy(true);
  try {
    const outcome = await service.signInWithGoogle();
    // Su successo il browser sta per essere reindirizzato: la pagina corrente
    // sparisce, quindi non ha senso disegnare o sbloccare i bottoni.
    if (!outcome.ok) {
      setWelcomeNotice(outcome.reason);
      setWelcomeBusy(false);
    }
  } catch (error) {
    setWelcomeNotice('Could not reach Google. Try again, or use email and password.');
    setWelcomeBusy(false);
  }
}

// L'ospite entra senza toccare la rete. Nessun errore possibile: se questa
// opzione non funzionasse, il gioco non sarebbe aperto a nessuno.
function handleWelcomeGuest() {
  rememberGuestChoice();
  setWelcomeNotice('');
  showWelcomeScreen(false);
  initializeTideDeck();
  render();
}

// Decide se la schermata deve comparire. Chiamata una volta sola, all'avvio:
// se l'account e' gia' aperto oppure se l'ospite ha gia' scelto, la home non
// si mostra e si entra direttamente nel gioco.
function shouldShowWelcome() {
  const service = getAuth();
  if (service && service.enabled && service.user) return false;
  if (hasChosenGuest()) return false;
  return true;
}

// Avvia lo strato degli account e la schermata di benvenimento. Non blocca
// mai il boot: senza credenziali, senza libreria o senza rete si limita a non
// fare niente e il gioco prosegue identico a come funzionava prima.
//
// Copre anche il rientro da Google: l'utente torna dal popup OAuth,
// `restoreSession` ritrova la sessione, e allora la home sparisce da sola e la
// cronaca online viene allineata con quella locale.
async function startAccountSession() {
  const service = getAuth();
  let showWelcome = true;
  try {
    if (service && service.init()) {
      service.listen();
      const user = await service.restoreSession();
      if (user) {
        showWelcome = false;
        await syncAfterLogin();
        await service.touchProfile(state.player.name);
      }
    }
  } catch (error) {
    // Qualunque guasto qui e' cosmetico: l'ospite gioca comunque in locale.
    if (service) service.notice = 'Online accounts are unavailable right now. Playing locally.';
    console.warn('[auth] session start failed', error);
    showWelcome = true;
  }
  showWelcomeScreen(showWelcome);
  if (!showWelcome) render();
}

// Unico punto di uscita dal gioco. Con una sessione aperta chiude l'account e
// torna alla home; da ospite non c'e' nulla da chiudere, quindi basta tornare
// alla schermata iniziale, dove si puo' entrare con un account o ripartire.
// `forgetGuestChoice` serve perche' un giocatore loggato non ha mai scritto la
// scelta "ospite": senza dimenticarla, `hasChosenGuest` continuerebbe a valere
// e l'home salterebbe di nuovo al prossimo riavvio.
async function handleProfileSignOut() {
  const service = getAuth();
  if (!service || !service.enabled) {
    // Senza servizi attivi non c'e' una sessione: resta solo il ritorno all'home.
    forgetGuestChoice();
    showWelcomeScreen(true);
    return;
  }
  if (!service.user) {
    forgetGuestChoice();
    showWelcomeScreen(true);
    return;
  }
  await runAuthAction(async (current) => {
    const outcome = await current.signOut();
    if (!outcome.ok) {
      current.notice = outcome.reason;
      return;
    }
    forgetGuestChoice();
    // Il save resta su questo dispositivo, quindi la cronaca appena giocata
    // non sparisce: cambia solo chi e' il proprietario della copia online.
    current.notice = 'Signed out. This chronicle stays on this device.';
    showWelcomeScreen(true);
  });
}

// Ascolta i click dei bottoni della schermata. Stanno fuori da `.app-shell`,
// quindi il gestore delegato che copre il resto del gioco non li vede: qui
// si intercettano a parte, e solo quando la schermata e' sullo schermo.
function wireWelcomeEvents() {
  // Nei test `document` e' uno stub minimo senza `addEventListener`: senza
  // questo controllo la chiamata romperebbe, perche' la si registra dal boot
  // e i test non hanno bisogno che la schermata sia cliccabile.
  if (!document || typeof document.addEventListener !== 'function') return;
  document.addEventListener('click', (event) => {
    const screen = document.getElementById('welcomeScreen');
    if (!screen || screen.hidden) return;
    // Il click deve essere dentro la schermata: senza questo, un click sul
    // gioco sottostante (che resta in DOM) attiverebbe l'accesso da ospite.
    if (!event.target.closest || !event.target.closest('#welcomeScreen')) return;

    if (event.target.closest('[data-welcome-signin]')) {
      event.preventDefault();
      handleWelcomeSignIn();
      return;
    }
    if (event.target.closest('[data-welcome-signup]')) {
      event.preventDefault();
      handleWelcomeSignUp();
      return;
    }
    if (event.target.closest('[data-welcome-google]')) {
      event.preventDefault();
      handleWelcomeGoogle();
      return;
    }
    if (event.target.closest('[data-welcome-guest]')) {
      event.preventDefault();
      handleWelcomeGuest();
    }
  });
}

// NOTA: qui non deve esistere una seconda definizione di startAccountSession.
// In JavaScript l'ultima che si trova vince e sovrascrive le precedenti senza
// avvisare: se la funzione venisse duplicata, per esempio durante un edit, la
// copia piu' in basso silenziosamente annullerebbe questa e l'home non
// comparirebbe mai. Quindi una sola definizione, quella qui sopra.

// Avvia il pulviscolo di sfondo. Va in una funzione propia, con controlli
// espliciti, perche' `motes.js` e' un file a se stante: se per un motivo non
// fosse caricato, o se il browser non supportasse il canvas, il gioco deve
// partire lo stesso. Le particelle sono un extra, mai un prerequisito.
function startAmbientMotes() {
  if (typeof motes === 'undefined' || typeof motes.start !== 'function') return;
  if (typeof window.requestAnimationFrame !== 'function') return;
  try {
    motes.start();
  } catch (error) {
    // Un guasto qui non deve fermare il gioco: si nota solo in console.
    console.warn('[motes] could not start', error);
  }
}

function boot() {
  // Prima di tutto: la memoria del browser funziona? Se no, nessuna delle cose
  // sotto ha senso, perche' niente di quello che verra' fatto verra' ricordato.
  // Il gioco parte lo stesso, ma lo dice, altrimenti il sintomo e' una partita
  // che sparisce a ogni refresh senza che nessuno capisca perche'.
  if (!storageProblem) storageProblem = diagnoseStorage();

  // Adesso che l'intero modulo e' valutato, tutte le costanti che i sanitiser
  // usano esistono davvero e il salvataggio puo' essere letto. Vedi la nota
  // accanto a `let state`: caricare qui era il punto in cui il salvataggio
  // veniva silenziosamente scartato.
  state = loadSave();

  initializeTideDeck();
  const copyrightYear = document.getElementById('copyrightYear');
  if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();
  // Gli account non devono mai ritardare l'avvio: il boot continua subito e la
  // sessione, se c'e', arriva dopo e allinea la cronaca al volo.
  startAccountSession();
  wireWelcomeEvents();
  startAmbientMotes();
  const welcomeYear = document.getElementById('welcomeYear');
  if (welcomeYear) welcomeYear.textContent = new Date().getFullYear();
  const logLengthBeforeDeduplication = state.player.log.length;
  state.player.log = state.player.log.filter((entry, index, entries) => index === 0 || entry.prefix !== 'Arrival' || entries[index - 1].prefix !== 'Arrival');
  if (state.player.log.length !== logLengthBeforeDeduplication) saveGame();
  if (!state.player.log.length) {
    addLog('The lagoon breathes beneath the city. A quiet path opens before you.', 'Arrival', `This chronicle opens in ${locations[state.currentLocationId].realm}, the realm saved for this life.`);
  }
  render();
  wireEvents();
  // A chronicle always starts with its starting realm on the record, so the
  // first pages of lore are open before the player has done anything at all.
  markLocationVisited(state.currentLocationId);
  refreshLoreDiscovery();
  if (progressionMigrationPending) {
    saveGame();
    progressionMigrationPending = false;
  }
  window.setInterval(() => {
    const regeneration = refreshTimedResources();
    renderResourceTimers();
    document.getElementById('deckBadge').textContent = formatDrawReserve();
    if (regeneration.changed) {
      saveGame();
      render();
    }
  }, 1000);
}

window.addEventListener('DOMContentLoaded', () => {
  boot();
});

window.addEventListener('beforeunload', () => {
  saveGame();
  // Ultima sincronizzazione senza aspettare il debounce: quello scatterebbe
  // solo 5 secondi dopo, quando la pagina e' ormai sparita. Non e' garantito
  // arrivi prima dell'unload, ed e' accettato cosi': la copia locale e' gia'
  // scritta e garantita, il cloud e' una copia di sicurezza che si riallinea
  // al prossimo salvataggio o al prossimo login.
  const service = typeof auth !== 'undefined' ? auth : null;
  if (service && service.enabled && service.user) service.pushSave(state);
});
