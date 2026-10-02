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
// ============================================================================
// La curva di crescita.
//
// I livelli non hanno un tetto, e le soglie non sono scritte a mano: sono calcolate
// da una curva, perche' a sessanta livelli una tabella scritta a mano sbaglierebbe
// prima o poi e non ci sarebbe nessun modo di accorgersene.
//
// La forma e' un quadrato: la soglia raddoppia a ogni raddoppio del livello, e
// il costo di ciascun blocco cresce con il livello.
//
//  - i primi livelli arrivano in fretta, cosi' il giocatore capisce subito che
//    cosa sia questo sistema e non lo scambia per un numero che non si muove;
//  - quelli alti costano sempre di piu', quindi non si arriva al massimo in una
//    serata né col grind infinito di azioni facili.
//
// Il livello 60 e' dove il giocatore raggiunge lo status massimo descritto, non
// il massimo possibile: la reputazione continua ad accumularsi oltre, ma le
// descrizioni si fermano. Il gioco non finisce a 60.
//
//   livello  1 ->     0 punti        livello 20 -> 1.600 punti
//   livello  2 ->    16 punti        livello 30 -> 3.600 punti
//   livello  5 ->   100 punti        livello 40 -> 6.400 punti
//   livello 10 ->   400 punti        livello 50 -> 10.000 punti
//   livello 15 ->   900 punti        livello 60 -> 14.400 punti
//
// Con una media di quattro punti a incontro superato, il livello 60 arriva
// dopo circa 3.600 incontri risolti: poche ore di gioco distribuite su mesi.
// Un traguardo di lungo periodo, non una serata e non un lavoro.
const FACTION_MAX_LEVEL = 60;

// La forma e' un quadrato: la soglia raddoppia a ogni raddoppio del livello, e
// il costo di ciascun blocco cresce con il livello. Il fattore 4 davanti serve a
// non far arrivare il livello 2 a quattro punti, che sarebbe raggiungibile con
// un solo incontro facile: un traguardo che si conquista in un colpo non
// insegna niente sul ritmo del gioco.
//
//   livello  2 ->   16 punti        livello 30 -> 3.600 punti
//   livello  5 ->  100 punti        livello 40 -> 6.400 punti
//   livello 10 ->  400 punti        livello 50 -> 10.000 punti
//   livello 20 -> 1.600 punti        livello 60 -> 14.400 punti
//
// Un incontro facile vale 1 punto e uno difficile 10, con una media di circa 4
// a vittoria: il livello 60 arriva dopo ~3.600 incontri risolti. Sono poche ore
// di gioco distribuite su mesi, non una serata e non un lavoro.
const FACTION_XP_SCALE = 4;

// La soglia di un livello. Il tetto a 60 non e' un limite ma una costante: i
// punti continuano oltre, e `factionLevelFromXp` non ha un ramo che ferma.
function factionThreshold(level) {
  if (level <= 1) return 0;
  return Math.round(FACTION_XP_SCALE * Math.pow(level, 2));
}

// Il livello raggiunto a partire dai punti. Inverte la curva con una ricerca
// binaria: a sessanta passi sarebbe veloce lo stesso, ma a un migliaio non
// sarebbe piu' cosi' banale, e il costo di leggerlo due volte si paga in
// leggibilita' del codice piu' che in millisecondi.
function factionLevelFromXp(xp) {
  if (xp < factionThreshold(2)) return 1;
  let low = 2;
  let high = FACTION_MAX_LEVEL * 4;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (factionThreshold(middle) <= xp) low = middle;
    else high = middle - 1;
  }
  return low;
}

// Un titolo ogni cinque livelli. Scriverne sessanta per fazione sarebbe
// rumore: il giocatore attraversa la maggior parte dei livelli senza fermarci, e
// un titolo che cambia a ogni livello non dice niente che il precedente non
// dicesse. Ogni cinque, la descrizione ha ancora qualcosa da aggiungere.
//
// I livelli intermedi non hanno un titolo proprio: sono la via che porta al
// prossimo, e la pagina li mostra come attraversati, non come raggiunti.
// `factionTierForLevel` risolve la coppia (titolo, livello) per qualunque
// livello, quindi aggiungere un livello non richiede di toccare nulla qui.
const TIER_STRIDE = 5;

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
    // Sfondo della scheda su Chronicles. Il nome del file non coincide con quello
    // della fazione ("Clockwrights" senza l'apostrofo della casa), quindi il
    // percorso e' scritto qui a mano e non derivato dal nome.
    image: 'immagini/The Clockwrights Guild.jpg',
    introduction: 'The guild that oils the escapement of the great bell. They have never once asked why it drifts.',
    tiers: [
      { level: 1, title: 'Unrecorded', note: 'Nobody at the galleries knows your name. Work is work; the guild takes the credit and gives nothing back.' },
      { level: 5, title: 'Oiler', note: 'You are handed a can without comment. The foreman has stopped checking your work, which is not praise but is close to it.' },
      { level: 10, title: 'Winder', note: 'A key of your own is issued, and the bell answers your hand. The guild has begun pricing your mistakes.' },
      { level: 15, title: 'Adjuster', note: 'The drift carries your name against it in the ledger. When the pendulum slips, they send for you and nobody else.' },
      { level: 20, title: 'Master of Escapement', note: 'You may disagree with the senior guild in front of the city. They have begun to argue back, in writing, which is a kind of respect.' },
      { level: 25, title: 'Keeper of the Hour', note: 'You decide what the bell means. A death, a flood, a birth: the guild rings what you tell it to ring.' },
      { level: 30, title: 'Warden of the Belfry', note: 'The Spire is signed over to you, and the guild admits it. Four hundred years of clockwork now answer to a name they cannot spell.' },
      { level: 35, title: 'Master of the Guild', note: 'You set the working hours of every clockwright above the water. The guild keeps the hours you set and calls it tradition.' },
      { level: 40, title: 'The Horologist', note: 'The drift you found at fourteen is understood at last, and your account of it is the version the city repeats.' },
      { level: 45, title: 'First of the Belfry', note: 'Whatever the bell rings for, it rings for you first. The tide tables carry a line acknowledging it.' },
      { level: 50, title: 'Lord of the Escapement', note: 'You have stopped keeping the hour for the city. You keep the hour, and the city has agreed to follow.' },
      { level: 55, title: 'Voice of the Pendulum', note: 'The great bell does not drift for you any more. Whatever is calling it up there, it stops when you raise a hand.' },
      { level: 60, title: 'The Last Oiler', note: 'They oil the escapement still, because it must be oiled. But the guild answers to you, and the bell knows it, and the tide has stopped arguing.' }
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
    image: 'immagini/The Council of Ten.jpg',
    introduction: 'Ten sealed voices in a flooded chamber, deciding what is written down and who is written out.',
    tiers: [
      { level: 1, title: 'Petitioner', note: 'You are a signature that has not been read yet. The clerks take your papers and do not look up.' },
      { level: 5, title: 'Petitioner Returned', note: 'Your papers came back with a clause underlined in red. You are being read, which is not the same as being welcomed.' },
      { level: 10, title: 'Ink-holder', note: 'A clerk fetches your file without being asked. You have become a fact rather than a name, and here that is worth more than a name.' },
      { level: 15, title: 'Ledger-holder', note: 'Sealed records pass through your hands on the way to someone higher. You have stopped being told what is in them.' },
      { level: 20, title: 'Keeper of Seals', note: 'You hold the wax. A decision that does not carry your mark is a decision the city did not make.' },
      { level: 25, title: 'Councillor of Ten', note: 'A chair is kept empty for you at the long table. Nobody will say so, and nobody has ever moved it either.' },
      { level: 30, title: 'Reader of the Lower Chambers', note: 'You are the only person who has been down into the flooded archive and come back with the records intact. The Council knows it and has stopped pretending otherwise.' },
      { level: 35, title: 'Second of Ten', note: 'You speak when the first voice will not, and what you say is recorded. The vacancy in the palace is now in your charge.' },
      { level: 40, title: 'Warden of the Record', note: 'What is written down in the lagoon passes through you. You have begun leaving out what you were told to leave out.' },
      { level: 45, title: 'Hand of the Vacant Palace', note: 'The palace has been ruled vacant for twenty-eight years. It is ruled by you, and the record files your reports under a Doge who has not been seen since 1502.' },
      { level: 50, title: 'First Among Ten', note: 'The Council no longer votes without you. Ten voices have become nine and a silence that the clerks recognise as yours.' },
      { level: 55, title: 'The Palace Answered', note: 'Every request in the lagoon is filed to you first. Whatever the clerks write, they write down to check whether you would have written it differently.' },
      { level: 60, title: 'Doge in Absentia', note: 'You are what the city answers to, and the archive files your name above a chair no one has sat in for twenty-eight years. It has begun to look like a vacancy in name only.' }
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
    image: 'immagini/The Brine-Farm Combine.jpg',
    introduction: 'Turbines, glass vats and eight hundred fathoms of warm water. The farm has never once asked who owns it.',
    tiers: [
      { level: 1, title: 'Hand on the Vats', note: 'You clip what is ready and take what you are given. The amber is sold by others and counted for you.' },
      { level: 5, title: 'Pruner', note: 'A section of the terraces is put in your name, small enough to fail at. The Combine will fund it either way, which tells you what they think of it.' },
      { level: 10, title: 'Turbine-keeper', note: 'You hold the valve keys. When something floods below, they wait for you to open the right one first.' },
      { level: 15, title: 'Bloom-master', note: 'The phosphor-orchids are grown to your schedule now, not the season’s. You have started arguing with the tide and winning.' },
      { level: 20, title: 'Abyssal Steward', note: 'The cold vents below are opened for you without a request. You have met the Combine face to face, and it was not a person.' },
      { level: 25, title: 'Keeper of the Deep Nursery', note: 'The water is warm all the way down and has never stopped rising. You are what keeps it rising, and the farm knows it.' },
      { level: 30, title: 'Cantor of the Vats', note: 'The bioluminescence below the nursery now runs to a rhythm you set. Divers who were not told anything still arrive on time.' },
      { level: 35, title: 'Master of the Desalinators', note: 'The cryogenic pearls are yours to cut. You have begun sending them up without a manifest, which is the Combine’s oldest trick, learned late.' },
      { level: 40, title: 'Warden of the Trench', note: 'Eight hundred fathoms of warm water answer to your instruction. The leviathan has stopped interrupting the harvest, which is its own kind of message.' },
      { level: 45, title: 'First of the Combine', note: 'The Combine no longer votes without you. The turbines, the walls and the amber all run on what you sign off.' },
      { level: 50, title: 'Lord of the Deep', note: 'The nursery is yours, and the Combine admits it in writing, which it has never done for anyone. The brine-farms above the water now take your schedule.' },
      { level: 55, title: 'The Water Remembers', note: 'The ledgers stop at 1494 because the ledgers stopped. You have started keeping a second record, and the clerks who read it cannot decide whether it is history or prophecy.' },
      { level: 60, title: 'Keeper of the Rising', note: 'You hold the thing that keeps the city under. The water is still coming up, and it will keep coming, and whatever is in it now answers to the hand you trained.' }
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
    image: 'immagini/The Astronavigators.jpg',
    introduction: 'They plot routes through skies that drowned first, and check names before they check tickets.',
    tiers: [
      { level: 1, title: 'Applicant', note: 'You asked for the timetable. Nobody refused you, which is how you know they intend to.' },
      { level: 5, title: 'Chart-reader', note: 'A duplicate of one star chart is issued to you. It is the same chart, with one departure left off.' },
      { level: 10, title: 'Conductor’s Nephew', note: 'One of the masked officers has stopped checking your name. He nods, which from them is a standing ovation.' },
      { level: 15, title: 'Timekeeper of the Terminus', note: 'You are shown the platform timetable in full, including the departure nobody is supposed to be alive for.' },
      { level: 20, title: 'Navigator of the Drowned Sky', note: 'The Salon lets you correct a course in front of the senior navigators. They are afraid of the correction and grateful for it.' },
      { level: 25, title: 'Seeker of the Lost Departure', note: 'The timetable nobody admits to keeping is now in your hands. The Salon has stopped asking where you got it.' },
      { level: 30, title: 'Voice of the Platform', note: 'The masked conductors check your face instead of your name, which is faster and, for once, safer.' },
      { level: 35, title: 'Reader of the Passenger List', note: 'The list written before you were born is yours to read, and you have read it. The name in your hand matches yours, and that is the part you cannot explain yet.' },
      { level: 40, title: 'Lord of the Salon', note: 'The navigators plot what you say they will plot. The brass dome, the charts, and the dead between the stars are yours to set.' },
      { level: 45, title: 'The Star That Moves', note: 'You have stopped planning routes and started choosing where the sky goes. Nobody has asked how, and the conductors stop their own watches when you look up.' },
      { level: 50, title: 'Person of Some Importance', note: 'Your name comes before the city does. The Salon files your passages under a heading nobody has been allowed to open since 1502.' },
      { level: 55, title: 'The Timetable Kept', note: 'The Stygian Rail runs on the schedule you set, not the one it kept. You have found where the equinoctial departure actually goes, and it is not a place anyone has a word for.' },
      { level: 60, title: 'The First Passenger', note: 'The Salon has known your name since before you were born and has been waiting politely to introduce itself. The departure that appears only in the deluge is yours, and the doors open when you decide they do.' }
    ]
  }
};
// Una lettura unica per ogni fascia di reputazione, dal punto di vista di chi
// guarda. Sono parole, non numeri: al giocatore interessa sapere come lo
// chiamano, non quanto ha totalizzato.
//
// Le fasce positive seguono i titoli, quindi cambiano insieme a loro. Quelle
// negative esistono perche' la reputazione avversata e' una cosa che si sente
// quanto quella amica, e merita parole sue: con l'avversaria che scende a ogni
// mossa, un giocatore molto schierato arriva nella fascia rossa senza che
// nulla lo abbia avvertito.
const factionRanks = [
  { min: -999, label: 'Enemy of the City', note: 'There are records of you that should not exist, and people whose job is to keep them.' },
  { min: -25, label: 'Wanted', note: 'Doors close along your route before you reach them. Nobody has to say why.' },
  { min: -10, label: 'Not Welcome', note: 'You are admitted where you must be, and watched the whole time you are there.' },
  { min: -3, label: 'Disliked', note: 'Your name is said in rooms you are not in, and never in a good tone. It is a small thing that makes every small thing harder.' },
  { min: 0, label: 'Unrecorded', note: 'Your name has not reached them. You are free, and free is close to invisible.' },
  { min: 16, label: 'Known', note: 'Faces begin to turn towards you in doorways. Not hostile: expecting.' },
  { min: 100, label: 'Credited', note: 'You are mentioned in the same breath as your work, and the two are no longer confused.' },
  { min: 400, label: 'Reported', note: 'What you do is described to other people as the way you do things, not as a favour they asked you for.' },
  { min: 1600, label: 'Important', note: 'People move aside before they know why. Your reputation is doing it now, not your reputation for it.' },
  { min: 3600, label: 'Ruinous', note: 'The city plans around you. Whatever you take, something is paid to make the room easier to work in.' },
  { min: 6400, label: 'Named in the Record', note: 'They do not discuss your standing. It is on the page, and the page does not get argued with.' },
  { min: 14400, label: 'Above the Water', note: 'Your name comes before the city does. Very few people in Serenissima can say what they did to earn this.' }
];

// Il blocco di punti necessario per il livello dopo, e quanto manca. Serve alla
// barra di avanzamento: senza, la pagina direbbe solo "livello 12" senza dire
// quanto manca al 13, che e' l'informazione che il giocatore usa per decidere
// se vale la pena tornare domani.
//
// La barra si riempie fino al prossimo titolo, non al livello successivo: il
// giocatore non deve passare attraverso quattro livelli senza che nulla cambi
// sullo schermo. Vedere la barra muoversi verso "Lord of the Deep" dice molto
// di piu' di quattro incrementi invisibili.
function factionProgress(faction, xp) {
  const level = factionLevelFromXp(xp);
  const tier = factionTierForLevel(faction, level);
  const next = factionNextTier(faction, level);
  if (!next) {
    return { level, tier, next: null, gained: 0, needed: 0, percent: 100 };
  }
  const floor = factionThreshold(tier.level);
  const ceiling = factionThreshold(next.level);
  const gained = xp - floor;
  const needed = ceiling - floor;
  return {
    level,
    tier,
    next,
    gained,
    needed,
    percent: Math.max(0, Math.min(100, Math.round((gained / needed) * 100)))
  };
}

// Il titolo che copre un qualunque livello: il piu' vicino raggiunto in basso.
// I livelli fra un titolo e il successivo non hanno una descrizione propria e
// prendono quella precedente, perche' al giocatore non cambia niente.
function factionTierForLevel(faction, level) {
  let current = faction.tiers[0];
  for (const tier of faction.tiers) {
    if (tier.level <= level) current = tier;
    else break;
  }
  return current;
}

// Il primo titolo ancora non raggiunto, cioe' quello verso cui il giocatore sta
// andando. Oltre l'ultimo non ce n'e' piu': i punti continuano a salire, ma la
// pagina non ha piu' niente da promettere.
function factionNextTier(faction, level) {
  return faction.tiers.find((tier) => tier.level > level) || null;
}

// La fascia di reputazione per un valore di punti, anche negativo.
function factionRankFromXp(xp) {
  let found = factionRanks[0];
  for (const rank of factionRanks) {
    if (xp >= rank.min) found = rank;
  }
  return found;
}
// Verifica che i dati delle fazioni siano coerenti: avversari simmetrici, titoli
// crescenti e distanti quanto previsto, una sola fazione per zona. Se un giorno
// si aggiunge una fazione sbagliata, fallisce subito invece di lasciare che
// l'avversario resti silenziosamente inesistente e i punti salgano gratis.
//
// Controlla anche che ogni fazione arrivi al livello 60: e' il punto in cui la
// progressione si ferma a essere descritta, e una fazione che si ferma prima
// lascerebbe il giocatore con un vicolo cieco senza che nessuno lo dica.
function checkFactionData() {
  const realms = new Set();
  for (const faction of Object.values(factions)) {
    const rival = factions[faction.rival];
    if (!rival) return { ok: false, reason: `${faction.id} names a rival that does not exist: ${faction.rival}` };
    if (rival.rival !== faction.id) return { ok: false, reason: `${faction.id} and ${faction.rival} do not point at each other` };
    if (realms.has(faction.realm)) return { ok: false, reason: `two factions share the realm ${faction.realm}` };
    realms.add(faction.realm);
    if (!faction.tiers.length) return { ok: false, reason: `${faction.id} has no tiers` };
    if (faction.tiers[0].level !== 1) return { ok: false, reason: `${faction.id} must start at level 1` };
    for (let index = 1; index < faction.tiers.length; index += 1) {
      const tier = faction.tiers[index];
      const previous = faction.tiers[index - 1];
      // Ogni titolo sta a TIER_STRIDE dal precedente: 1, 5, 10, 15... Il primo scatto
      // e' un quarto di livello piu' lungo degli altri (4 invece di 5) perche' e'
      // l'unico che piu' rischia di arrivare con una sola vittoria.
      const expected = previous.level + (previous.level === 1 ? TIER_STRIDE - 1 : TIER_STRIDE);
      if (tier.level !== expected) {
        return { ok: false, reason: `${faction.id} jumps from level ${previous.level} to ${tier.level}` };
      }
    }
    const last = faction.tiers[faction.tiers.length - 1];
    if (last.level !== FACTION_MAX_LEVEL) {
      return { ok: false, reason: `${faction.id} stops at level ${last.level}, expected ${FACTION_MAX_LEVEL}` };
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