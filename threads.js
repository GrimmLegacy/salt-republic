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