// ---------------------------------------------------------------------------
// STORY THREADS AND DECLARED CHOICES
//
// Loaded after factions.js and lore.js, before app.js, because app.js renders
// them on the Chronicles page and sanitises them when a save is loaded.
//
// A THREAD is an ongoing thing the player is building, read as an ordered list
// of steps: the Brine-Farm is step 1 to step 6, not six unrelated encounters
// scattered across two realms. This is the difference between "the game has
// branching" and "the game tells you what you are building".
//
// A thread adds no state of its own. Every step names an encounter that already
// exists in `locations`, and the step's state is read back from that encounter's
// record in `completedEvents`. One source of truth: an encounter cannot be
// "resolved" in the chronicle and "still open" in the thread, because there is
// only one place the answer lives.
//
// A DECISION is the one thing a thread needs that an encounter cannot express.
// An encounter rolls a die; a decision is declared. Flags are booleans, so they
// can record "the Combine backed the farm" but not the difference between the
// Combine backing it and the rows being leased out. Decisions therefore keep
// their answer in `state.player.decisions`, keyed by fork id, and every option
// writes normal flags as well: the rest of the game only ever needs a flag, and
// it already knows how to read one.
// ---------------------------------------------------------------------------

const storyThreads = [
  {
    id: 'brine-farm',
    title: 'The Brine-Farm',
    icon: '❋',
    realm: 'Abyssal Depth',
    teaser:
      'Flat water in stone squares, eight hundred fathoms down, and a lease that took a customs house, a sealed crate, a stubborn keeper and a flooded chamber to win. It is yours in the record. What it becomes is not decided yet.',
    steps: [
      { action: 'take-ledger-job', title: 'Take the post at the customs house' },
      { action: 'carry-sealed-cargo', title: 'Carry the sealed crate past the checkpoint' },
      { action: 'bargain-salt-pans', title: 'Lease the abandoned salt pans' },
      { action: 'sign-brine-farm-papers', title: 'Sign the Brine-Farm papers before the Council' },
      { action: 'harvest-orchids', title: 'Bring up the first harvest of phosphor-orchids' },
      { action: 'install-desalinators', title: 'Thread the cold vents into the farm' }
    ],
    forks: ['brine-farm-mandate'],
    // L'arte del percorso. E' un dato come l'immagine di una zona o di una carta:
    // se manca, la pagina Chronicles disegna il fondo piatto di sempre, quindi un
    // percorso nuovo non ha bisogno di nessuna riga di CSS per esistere.
    art: 'immagini/fattoria.jpg'
  },
  {
    id: 'deep-draft',
    title: 'The Deep Draft',
    icon: '🌀',
    realm: 'Abyssal Depth',
    teaser:
      'A boat is not a farm. A farm could be leased, because water that already exists can be described in a document. A boat needs somebody to answer for a hull, and answering is done in writing, in a room with water on the floor. Forty centimetres of brass off a wreck, one screw turned for a hull that does not exist yet, one lens ground by a woman who refused to sell it, one pallet of lead invoiced to a company that has never been founded. Then the only question anybody asks you.',
    steps: [
      { action: 'deepdraft-cut-the-sill', title: 'Cut the brass sill out of the survey wreck' },
      { action: 'deepdraft-turn-the-screw', title: 'Have the screw turned on the shallow edge' },
      { action: 'deepdraft-grind-the-lens', title: 'Have the lamp lens ground at the customs house' },
      { action: 'deepdraft-buy-the-ballast', title: 'Buy lead at the weigh-house under a name that is not yours' },
      { action: 'deepdraft-sign-the-hull', title: 'Answer for the hull in front of the Council of Ten' },
      { action: 'deepdraft-take-her-down', title: 'Take her down at night and find the mark on the charts' }
    ],
    forks: ['deep-draft-manifest']
  },
  {
    id: 'escapement-wing',
    title: 'The Escapement Wing',
    icon: '✈',
    realm: 'Aether Heights',
    teaser:
      'A guild machine is not yours because you built it, it is yours because it is written down. So you go down the last ladder and take an escapement out of a room of forty-one stopped clocks where exactly one of them is still beating, and you cut a spar out of four hundred years of bell yoke, and you file a weight by ear against a count nobody has ever written down, and you are given silk off a dead shelf in the Salon by a navigator who points out, not unkindly, that somebody is going to find their own handwriting on it one day and be annoyed for a very long time. Then the foreman asks you one question, and it is not about the machine.',
    steps: [
      { action: 'wing-take-the-reject-escapement', title: 'Take the escapement that runs, out of the Reject Room' },
      { action: 'wing-cut-the-yoke', title: 'Cut one spar out of the bell yoke' },
      { action: 'wing-thread-the-weight', title: 'File a weight to the beat the foreman taps' },
      { action: 'wing-ask-the-salon-for-silk', title: 'Take silk off the two dead shelves in the Salon' },
      { action: 'wing-register-the-wing', title: 'Answer for the hour, and be signed for' },
      { action: 'wing-fly-it-over-the-lagoon', title: 'Six crossings, six roofs, and a keeper who counts them wrong' }
    ],
    forks: ['escapement-wing-hour']
  }
];

const storyForks = [
  {
    id: 'brine-farm-mandate',
    threadId: 'brine-farm',
    title: 'How the farm is run',
    prompt:
      'The lease is signed and the first nursery lights itself without being asked. The Combine writes every week asking what you intend to do with it. There is no correct answer, only the one you can live with: whatever you choose here, this chronicle becomes the story of that farm and not of another.',
    // Il bivio si apre quando la fattoria e' tua nel registro, non quando hai
    // finito i passi: si sceglie mentre la fattoria e' ancora vuota.
    requires: { flags: ['brineFarmSigned'] },
    // Cosa dice la pagina quando il bivio e' ancora chiuso. Va scritto qui e non
    // ricavato tagliando `prompt`: il prompt parla di una fattoria che e' gia'
    // tua, quindi riusarlo come anteprima avrebbe promesso al giocatore una cosa
    // che non e' ancora successa.
    shutHint: 'Nothing to run yet. This opens once there is a farm in your name and a keeper who stopped arguing.',
    options: [
      {
        id: 'sole',
        title: 'Keep it in your own hands',
        body:
          'No Combine money, no tenants, nobody to answer to. You will wade the vats yourself at every harvest and the rows will grow at the pace one pair of hands allows. It is the slowest way and the only one nobody can take off you.',
        sets: { farmSoleKept: true },
        resources: { phosphorAmber: 1 },
        stats: { resolve: 1 },
        log: 'You wrote back to the Combine with a single line: no. The farm will be worked by the person who signed for it, at the speed one pair of hands can manage.'
      },
      {
        id: 'combine',
        title: "Take the Combine's backing",
        body:
          'The Brine-Farm Combine will put the capital in and put their crews on the terraces. The nursery doubles before the month is out. In exchange the farm carries their name, and the Combine will consider the arrangement settled only when it suits them.',
        sets: { farmCombineBacked: true },
        resources: { ducatsOfSalt: 12 },
        stats: { persuasion: 1 },
        log: 'You signed the Combine\'s paper. Their crews are on the terraces by the following week, and the first thing they do is change which beds are yours.'
      },
      {
        id: 'open',
        title: 'Open the rows to the city',
        body:
          'Lease the rows out, bed by bed, to anyone who can pay the salt. You will not know most of the people who work your farm and you will not have to. It earns from the first tide, and the farm stops being the keeper\'s rows and becomes whatever the city decides it is worth.',
        sets: { farmOpenToCity: true },
        resources: { ducatsOfSalt: 8 },
        stats: { cunning: 1 },
        log: 'You posted the rows for lease on the customs house wall, at a price per bed per season. By evening four names were on the list and three of them were not the Combine.'
      }
    ]
  },
  {
    id: 'deep-draft-manifest',
    threadId: 'deep-draft',
    title: 'What the manifest says she carries',
    prompt:
      'The hull is signed and the ledger is open, and there is one line left to fill in, and every version of it is defensible. The Combine will not give you a licence without a manifest. The Iron Sister does not ask what is in a boat. The Council has already written down an answer it did not get from you. Whatever you choose here becomes the reason the Deep Draft exists, and the reason is the thing people will repeat about her.',
    requires: { flags: ['deepdraftSigned'] },
    shutHint:
      'A hull can be signed for and still carry nothing. The manifest is not written until somebody answers for what goes out of the lagoon.',
    options: [
      {
        id: 'surveyor',
        title: 'Survey only — and file every reading',
        sets: { draftManifestSurvey: true },
        body:
          'She goes down to measure and comes back with numbers. The Surveyors have wanted a proper sounding at the bottom of the trench since before the deluge and have never been given one, because nobody has been down there with a lamp they made themselves. Filing every reading is the price of the licence, and it means that from today the deepest mark on every chart in the city has your handwriting under it.',
        resources: { ducatsOfSalt: 6, whisperedSecrets: 1 },
        stats: { vigilance: 1 },
        log: 'The Surveyors read your licence twice, then once more, and then the clerk says the word "properly" in a voice nobody has used in this building before.'
      },
      {
        id: 'combine',
        title: 'Freight for whoever is paying',
        sets: { draftManifestFreight: true },
        body:
          'You take what is paid for and you do not open it. The Combine has amber coming up out of the warm layer and a weight they cannot account for, and they do not need a boat with principles, they need a hull. Every trip is written up as ballast and every ballast is weighed at the weigh-house, which means the weigh-house now knows exactly how often you go down and exactly how heavy you come back.',
        resources: { ducatsOfSalt: 12, phosphorAmber: 2 },
        stats: { cunning: 1 },
        log: 'The weigh-master books the first load without looking up, and you understand that he had already booked it, weeks ago, on paper you never saw.'
      },
      {
        id: 'quiet',
        title: 'Nobody\'s cargo — yours alone',
        sets: { draftManifestQuiet: true },
        body:
          'You write the only manifest that is really yours: no cargo, no charter, no employer. It earns nothing and it opens nothing, and it is the only version of the document that belongs to whoever is in the boat. What you find down there is yours to do as you like with, which is exactly what nobody will be able to write down about it afterwards.',
        resources: { ducatsOfSalt: 3 },
        stats: { resolve: 1 },
        log: 'The clerk stamps a manifest with nothing on it and asks, twice, whether you are sure, and you are, and that is the entire cost of the thing.'
      }
    ]
  },
  {
    id: 'escapement-wing-hour',
    threadId: 'escapement-wing',
    title: 'What hour you intend to be over the water',
    prompt:
      'The foreman asked, and he wrote down whatever you said, and then he added a line of his own. There is no more room in the register for a machine that does something else, so whatever hour you name is the hour the Wing keeps, and the city will learn it the way it learns everything, by being flown over. Three answers are defensible and only one of them is comfortable.',
    requires: { flags: ['wingRegistered'] },
    shutHint:
      'A machine with no hour is a machine in pieces. The foreman asks what time you mean, and he asks it out loud, in front of everybody.',
    options: [
      {
        id: 'charts',
        title: 'Dawn — to re-draw the Survey charts from the air',
        sets: { wingPurposeCharts: true },
        body:
          'From four hundred feet the drowned canals are legible in a way they have never been from a boat, because a boat can only follow a street and an aeroplane can see the whole shape of it at once. Every chart the Surveyors hold of this city was drawn by people standing in it. Yours will be the first drawn from outside it, and they will pay for the privilege and correct every error you make, and the correcting is the part they actually want.',
        resources: { ducatsOfSalt: 6, whisperedSecrets: 1 },
        stats: { vigilance: 1 },
        log: 'The Surveyors send a man up the ladder at four in the morning to meet you on the roof, and he has brought a theodolite, and he has brought it personally.'
      },
      {
        id: 'guild',
        title: 'Dusk — to carry what the guild has no ground for',
        sets: { wingPurposeGuild: true },
        body:
          'The guild keeps the hour for a city that has no ground left to walk between. A machine that crosses the lagoon in the evening turns a tower with four hundred floors into a building with a door on one side and a window on the other, and the apprentices will carry things they have never been allowed to carry, and the foreman will sign for all of it, and that is what the signature was for.',
        resources: { ducatsOfSalt: 12 },
        stats: { resolve: 1 },
        log: 'The foreman puts a small brass case on the wing before you leave and does not say what is in it, and you do not open it until you are over the water.'
      },
      {
        id: 'rats',
        title: 'The small hours — over the rope-lines, where nobody looks up',
        sets: { wingPurposeRats: true },
        body:
          'The washing lines go up after dark and stay up until the water drops, and they are the only roads left in this city, and they belong to children who have never once been asked what they use. A machine that crosses low and slow at two in the morning turns those lines into something with an address, and the Salt Rats know which lines feed which doors and would like to know what is coming over them. Nobody signs for this. That is rather the point of it.',
        resources: { ducatsOfSalt: 4 },
        stats: { cunning: 1 },
        log: 'A child you have never met is waiting on a roof at two in the morning to tell you which line goes where, and she has been waiting since about eleven.'
      }
    ]
  }
];
function findStoryThread(threadId) {
  return storyThreads.find((thread) => thread.id === threadId) || null;
}

function findStoryFork(forkId) {
  return storyForks.find((fork) => fork.id === forkId) || null;
}

function findStoryOption(fork, optionId) {
  if (!fork || !Array.isArray(fork.options)) return null;
  return fork.options.find((option) => option.id === optionId) || null;
}

// La risposta data, o null se il bivio e' ancora aperto. Si legge sempre da qui:
// nessun'altra parte deve controllare se una decisione e' stata presa, altrimenti
// una pagina e un incontro possono disagree sull'esito.
function getStoryDecision(forkId) {
  return state.player?.decisions?.[forkId] || null;
}

// Lo stato di uno step non e' salvato: si ricava dall'incontro che lo produce.
// `done` e' un successo, `failed` e' un tentativo andato storto (l'incontro
// ripete, quindi lo step resta riapribile), `open` e' quando i requisiti sono
// soddisfatti e il giocatore puo' ancora agire, `locked` e' quando manca ancora
// qualcosa. `locked` non e' un segreto: il thread mostra il percorso intero,
// altrimenti la pagina non direbbe mai che quella coda esiste.
function getStoryStepState(step) {
  const record = getEventRecord(step.action);
  if (record?.outcome === 'Success') return 'done';
  if (record?.outcome === 'Failure') return 'failed';
  const action = findActionById(step.action);
  if (!action) return 'locked';
  return canAccessAction(action) ? 'open' : 'locked';
}

// Il luogo in cui lo step si svolge. Si risolve dal catalogo invece di scriverlo
// a mano: un passo spostato in un'altra zona non deve poter dire il posto sbagliato.
function getStoryStepRealm(step) {
  const entry = Object.values(locations || {}).find((location) =>
    (location.actions || []).some((action) => action.id === step.action)
  );
  return entry ? entry.realm : '';
}

// Un bivio e' aperto quando i suoi requisiti sono soddisfatti. Non si controlla
// anche "gia' risolto": quello lo chiede `getStoryDecision`, altrimenti un bivio
// gia' preso resterebbe aperto per sempre.
function isStoryForkOpen(fork) {
  if (!fork) return false;
  return (fork.requires?.flags || []).every((flag) => Boolean(state.player?.flags?.[flag]));
}

// Come `sanitizeFlags`: si tiene solo cio' che il catalogo dichiara, cosi' un
// salvataggio vecchio non rompe e un file importato a mano non puo' far
// comparire bivi inesistenti o far saltare a "risolto" un bivio con un'opzione
// che non ha. Una decisione non ammessa viene scartata, non corretta: il
// giocatore che l'ha scritta a mano non ci credeva.
function sanitizeStoryDecisions(raw) {
  const clean = {};
  if (!raw || typeof raw !== 'object') return clean;
  Object.entries(raw).forEach(([forkId, optionId]) => {
    const fork = findStoryFork(forkId);
    if (fork && findStoryOption(fork, optionId)) clean[forkId] = optionId;
  });
  return clean;
}