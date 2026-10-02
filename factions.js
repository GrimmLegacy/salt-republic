// ============================================================================
// Fazioni.
//
// Una fazione per ogni zona del mondo, e le quattro non sono state inventate a
// caso: sono le organizzazioni che gia' esistono nei luoghi di gioco. La Campana
// ha i suoi clocksmiths, gli Archivi hanno il Council of Ten, il Vivaio ha la
// Brine-Farm, la Stazione ha gli Astronavigators. Il giocatore non incontra
// entita' nuove: da' importanza a chi gli era gia' descritto.
//
// Due regole di fondo:
//
//  - La reputazione sale con le azioni e con nient'altro. Non esistono punti
//    gratuiti: un livello vuol dire che il giocatore ha lavorato davvero.
//  - Salire con una fazione fa scendere l'avversaria, e viceversa. Il mondo
//    guarda di sfavore chi si schiera, quindi la scelta ha un prezzo.
//
// `rival` e' simmetrico: se A punta a B, il `rival` di B punta ad A.
// `checkFactionData` lo verifica, cosi' non puo' capitare che due fazioni si
// facciano danno insieme senza che nessuno se ne accorga.
//
// I livelli non sono una scala di numeri ma nomi leggibili, perche' al
// giocatore interessa sapere come lo chiamano, non quanto ha totalizzato.
// ============================================================================

const factions = {
  clockwrights: {
    id: 'clockwrights',
    realm: 'aether-heights',
    region: 'Aether Heights',
    name: "The Clockwrights' Guild",
    sigil: '⛭',
    motto: 'Time is kept, not waited for.',
    rival: 'brine-combine',
    colour: '#d39a38',
    introduction: 'The guild that oils the escapement of the great bell. They have never once asked why it drifts.',
    tiers: [
      { level: 1, xp: 0, title: 'Unrecorded', note: 'Nobody at the galleries knows your name. Work is work; the guild takes the credit and gives nothing back.' },
      { level: 2, xp: 6, title: 'Oiler', note: 'You are handed a can without comment. The foreman has stopped checking your work, which is not praise but is close to it.' },
      { level: 3, xp: 16, title: 'Winder', note: 'A key of your own is issued. The bell answers your hand now, and the guild knows it does.' },
      { level: 4, xp: 30, title: 'Adjuster', note: 'The drift has your name against it in the ledger. When the pendulum slips, they send for you and nobody else.' },
      { level: 5, xp: 50, title: 'Master of Escapement', note: 'You may disagree with the senior guild in front of the city. They have begun to argue back.' },
      { level: 6, xp: 76, title: 'Keeper of the Belfry', note: 'The great bell is signed over to you. What it rings, and what it is allowed to ring, is now your judgement and nobody elses.' }
    ]
  },

  council: {
    id: 'council',
    realm: 'lagoon-heart',
    region: 'Lagoon Heart',
    name: 'The Council of Ten',
    sigil: '✦',
    motto: 'Nobody signs anything.',
    rival: 'astral-salon',
    colour: '#9d7d5e',
    introduction: 'Ten sealed voices in a flooded chamber, deciding what is written down and who is written out.',
    tiers: [
      { level: 1, xp: 0, title: 'Petitioner', note: 'You are a signature that has not been read yet. The clerks take your papers and do not look up.' },
      { level: 2, xp: 6, title: 'Petitioner Returned', note: 'Your papers came back with a clause underlined in red. You are being read, which is not the same as being welcomed.' },
      { level: 3, xp: 16, title: 'Ink-holder', note: 'A clerk fetches your file without being asked. You have become a fact rather than a name, and that is worth more here than a name.' },
      { level: 4, xp: 30, title: 'Ledger-holder', note: 'Sealed records pass through your hands on the way to someone higher. You have stopped being told what is in them.' },
      { level: 5, xp: 50, title: 'Councillor of Ten', note: 'A chair is kept empty for you at the long table. Nobody will say so, and nobody has ever moved it either.' },
      { level: 6, xp: 76, title: 'Doge in Absentia', note: 'The palace has been ruled vacant for twenty-eight years. The record now files your reports. You are what the city answers to.' }
    ]
  },
'brine-combine': {
    id: 'brine-combine',
    realm: 'abyssal-depth',
    region: 'Abyssal Depth',
    name: 'The Brine-Farm Combine',
    sigil: '☾',
    motto: 'The farm answers to whoever keeps it.',
    rival: 'clockwrights',
    colour: '#79bca9',
    introduction: 'Turbines, glass vats and eight hundred fathoms of warm water. The farm has never once asked who owns it.',
    tiers: [
      { level: 1, xp: 0, title: 'Hand on the Vats', note: 'You clip what is ready and take what you are given. The amber is sold by others and counted for you.' },
      { level: 2, xp: 6, title: 'Pruner', note: 'A section of the terraces is put in your name, small enough to fail at. The Combine will fund it either way.' },
      { level: 3, xp: 16, title: 'Turbine-keeper', note: 'You hold the valve keys. When something floods below, they wait for you to open the right one first.' },
      { level: 4, xp: 30, title: 'Bloom-master', note: 'The phosphor-orchids are grown to your schedule now, not the season’s. You have started arguing with the tide and winning.' },
      { level: 5, xp: 50, title: 'Abyssal Steward', note: 'The cold vents below are opened for you without a request. You have met the Combine face to face, and it was not a person.' },
      { level: 6, xp: 76, title: 'Keeper of the Deep Nursery', note: 'The water is warm all the way down and has never stopped rising. You are what keeps it rising, and it knows your name.' }
    ]
  },

  'astral-salon': {
    id: 'astral-salon',
    realm: 'astral-terminus',
    region: 'Astral Terminus',
    name: 'The Astronavigators',
    sigil: '◈',
    motto: 'The stars are charts. The dead between them are not.',
    rival: 'council',
    colour: '#8ec9c8',
    introduction: 'They plot routes through skies that drowned first, and check names before they check tickets.',
    tiers: [
      { level: 1, xp: 0, title: 'Applicant', note: 'You asked for the timetable. Nobody refused you, which is how you know they intend to.' },
      { level: 2, xp: 6, title: 'Chart-reader', note: 'A duplicate of one star chart is issued to you. It is the same chart, with one departure left off.' },
      { level: 3, xp: 16, title: 'Conductor’s Nephew', note: 'One of the masked officers has stopped checking your name. He nods, which from them is a standing ovation.' },
      { level: 4, xp: 30, title: 'Timekeeper of the Terminus', note: 'You are shown the platform timetable in full, including the departure nobody is supposed to be alive for.' },
      { level: 5, xp: 50, title: 'Navigator of the Drowned Sky', note: 'The Salon lets you correct a course in front of the senior navigators. They are afraid of the correction and grateful for it.' },
      { level: 6, xp: 76, title: 'Person of Some Importance', note: 'Your name was on a passenger list before you were born, and now they ask who wrote it. You have decided to find out.' }
    ]
  }
};
// Una lettura unica per ogni livello, dal punto di vista di chi guarda. Include
// anche le fasce negative: la reputazione avversata e' una cosa che si sente
// quanto quella amica, e deve avere parole sue.
const factionRanks = [
  { min: -999, label: 'Enemy of the City', note: 'There are records of you that should not exist, and people whose job is to keep them.' },
  { min: -18, label: 'Wanted', note: 'Doors close along your route before you reach them. Nobody has to say why.' },
  { min: -8, label: 'Not Welcome', note: 'You are admitted where you must be, and watched the whole time you are there.' },
  { min: -1, label: 'Stranger', note: 'Nobody has formed an opinion of you yet, which is the cheapest kind of safety there is.' },
  { min: 0, label: 'Unrecorded', note: 'Your name has not reached them. You are free, and free is close to invisible.' },
  { min: 6, label: 'Known', note: 'Faces begin to turn towards you in doorways. Not hostile: expecting.' },
  { min: 16, label: 'Credited', note: 'You are mentioned in the same breath as your work, and the two are no longer confused.' },
  { min: 30, label: 'Important', note: 'People move aside before they know why. Your reputation is doing it now, not your reputation for it.' },
  { min: 50, label: 'Ruinous', note: 'The city plans around you. Whatever you take, something is paid to make the room easier to work in.' },
  { min: 76, label: 'Above the Water', note: 'Your name comes before the city does. Very few people in Serenissima can say what they did to earn this.' }
];

// Soglia necessaria per ciascun livello, in ordine. Scala: 0, 6, 16, 30, 50,
// 76. I primi salti arrivano presto, cosi' il giocatore capisce subito che cosa
// e' questo sistema; poi si allargano, perche' i livelli alti devono restare una
// cosa che si conquista sul serio.
const factionThresholds = [
  { level: 1, threshold: 0 },
  { level: 2, threshold: 6 },
  { level: 3, threshold: 16 },
  { level: 4, threshold: 30 },
  { level: 5, threshold: 50 },
  { level: 6, threshold: 76 }
];

// Il livello raggiunto a partire dai punti. Oltre l'ultima soglia non si va: il
// livello si ferma al massimo dichiarato dalla fazione.
function factionLevelFromXp(faction, xp) {
  const ceiling = faction.tiers[faction.tiers.length - 1].level;
  let current = 1;
  for (const step of factionThresholds) {
    if (step.level > ceiling) break;
    if (xp >= step.threshold) current = step.level;
  }
  return current;
}

// La fascia di reputazione per un valore di punti, anche negativo.
function factionRankFromXp(xp) {
  let found = factionRanks[0];
  for (const rank of factionRanks) {
    if (xp >= rank.min) found = rank;
  }
  return found;
}
// Il blocco di punti necessario per il livello dopo, e quanto manca. Serve alla
// barra di avanzamento: senza, la pagina direbbe solo "livello 2" senza dire
// quanto manca al 3, che e' l'informazione che il giocatore usa per decidere.
function factionProgress(faction, xp) {
  const level = factionLevelFromXp(faction, xp);
  const tier = faction.tiers.find((entry) => entry.level === level);
  const next = faction.tiers.find((entry) => entry.level === level + 1);
  if (!next) {
    return { level, tier, next: null, gained: 0, needed: 0, percent: 100 };
  }
  const gained = xp - tier.xp;
  const needed = next.xp - tier.xp;
  return {
    level,
    tier,
    next,
    gained,
    needed,
    // La barra riparte da zero al raggiungimento del livello corrente: se
    // mostrasse lo zero a meta' del livello, sembrerebbe che il progresso si
    // sia perso.
    percent: Math.max(0, Math.min(100, Math.round((gained / needed) * 100)))
  };
}

// Verifica che i dati delle fazioni siano coerenti: avversari simmetrici, livelli
// consecutivi, soglie crescenti, una sola fazione per zona, e accordo fra le
// soglie nel dato e quelle del calcolo. Se un giorno si aggiunge una fazione
// sbagliata, fallisce subito invece di lasciare che l'avversario resti
// silenziosamente inesistente e i punti salgano gratis.
function checkFactionData() {
  const realms = new Set();
  for (const faction of Object.values(factions)) {
    const rival = factions[faction.rival];
    if (!rival) return { ok: false, reason: `${faction.id} names a rival that does not exist: ${faction.rival}` };
    if (rival.rival !== faction.id) return { ok: false, reason: `${faction.id} and ${faction.rival} do not point at each other` };
    if (realms.has(faction.realm)) return { ok: false, reason: `two factions share the realm ${faction.realm}` };
    realms.add(faction.realm);
    if (!faction.tiers.length) return { ok: false, reason: `${faction.id} has no tiers` };
    if (faction.tiers[0].level !== 1 || faction.tiers[0].xp !== 0) return { ok: false, reason: `${faction.id} must start at level 1 with 0 xp` };
    for (let index = 1; index < faction.tiers.length; index += 1) {
      const tier = faction.tiers[index];
      const previous = faction.tiers[index - 1];
      if (tier.level !== previous.level + 1) return { ok: false, reason: `${faction.id} levels are not consecutive` };
      if (tier.xp <= previous.xp) return { ok: false, reason: `${faction.id} thresholds must rise` };
      const step = factionThresholds.find((entry) => entry.level === tier.level);
      if (!step || step.threshold !== tier.xp) return { ok: false, reason: `${faction.id} level ${tier.level} disagrees with the thresholds table` };
    }
  }
  return { ok: true };
}

// La fazione che presidia una zona.
//
// Attenzione alla forma della chiave: `locations[].realm` e `regions[].name`
// sono nomi leggibili ("Aether Heights"), mentre `regions[].id` e
// `factions[].realm` sono id ("aether-heights"). Il confronto passa quindi dal
// nome alla forma con i trattini, non viceversa: e' la sola direzione che tiene
// senza dover provare entrambe.
//
// Restituisce null se la zona non ha una fazione: e' un caso da tollerare, non
// un errore, perche' un'area futura puo' anche restare senza organizzazione.
function factionForRealm(realm) {
  if (!realm) return null;
  const id = String(realm).trim().toLowerCase().replace(/\s+/g, '-');
  return Object.values(factions).find((faction) => faction.realm === id) || null;
}

// Tutte le fazioni nell'ordine delle zone del mondo, che e' l'ordine in cui il
// giocatore le incontra viaggiando. Usa `regions` per non duplicare a mano
// l'elenco delle zone: se domani ne aggiungi una, basta la riga in `regions`.
function factionList() {
  return regions.map((region) => factionForRealm(region.id)).filter(Boolean);
}