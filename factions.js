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
    // Le quattro che presidiano un reame: sono le uniche che il gioco chiama
    // quando il giocatore ci lavora, e le uniche in rivalita' fra loro.
    principal: true,
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
    principal: true,
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
    principal: true,
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
    principal: true,
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
  },

  // =========================================================================
  // Le organizzazioni che stanno dentro le zone.
  //
  // Nessuna di queste presidia un reame e nessuna e' in rivalita' con le altre:
  // le quattro potenze si contendono il monopolio, queste no. Sono gilde, bande
  // e persone che la citta' non ha scritto da nessuna parte, e si trovano
  // guardando sotto, non viaggiando.
  //
  // Non hanno un'immagine: mostrano la figura di default finche' qualcuno non
  // disegna loro un volto, che e' il modo giusto per dire "esiste ma nessuno ci
  // ha ancora ritratto".
  // =========================================================================

  'black-ledger': {
    id: 'black-ledger',
    realm: 'lagoon-heart',
    region: 'Lagoon Heart',
    name: 'The Black Ledger',
    sigil: '✂',
    motto: 'Everything has a price. We are the ones who write it down.',
    rival: null,
    colour: '#7a5f8c',
    image: 'immagini/The Black Ledger.jpg',
    introduction:
      'They keep the second book: the one that records what was agreed away instead of what was signed. A drowned archive is full of documents nobody can produce, and the Black Ledger is what is left when the Council of Ten is finished with them.',
    tiers: [
      { level: 1, title: 'Named in a Margin', note: 'Someone has written your name in the edge of a page you were not supposed to read. You have not been told what it means and you have not asked.' },
      { level: 5, title: 'Reader of the Second Book', note: 'You are shown a page that contradicts the official one. Both are signed. You are asked to remember which one you saw first.' },
      { level: 10, title: 'Hand Inside the Coat', note: 'You carry something you were told not to carry, and you have learned that the question is never about what it is but about who saw it.' },
      { level: 15, title: 'The Quiet Commission', note: 'A name, a room, an evening. The Ledger accepts the work and tells you the fee before you agree to it, which is its way of being honest.' },
      { level: 20, title: 'Scribe of the Black Book', note: 'You keep the copy. You learn that the copy is the real one and the archive upstairs is the reassuring version.' },
      { level: 25, title: 'Holder of the Wet Key', note: 'There is a door under the water that opens only for people who have been given a reason. You have the reason. You have not asked for the door.' },
      { level: 30, title: 'The Account Kept Open', note: 'Your commission runs for years. It has a title you gave it, a price agreed in 1502, and a line that is still being added to.' },
      { level: 35, title: 'Collector of Refusals', note: 'You are sent to be told no. You come back with the no, and the no turns out to be the most useful thing in the city that month.' },
      { level: 40, title: 'Voice Beneath the Water', note: 'The Ledger speaks through you now. You have stopped introducing yourself and started being introduced.' },
      { level: 45, title: 'The Name They Erase', note: 'Your name appears in no register, which the Ledger considers the highest form of standing. You have not asked what is written where yours used to be.' },
      { level: 50, title: 'The Ledger Itself', note: 'You hold the book. It is heavier than it looks and older than the archive it corrects, and it has stopped needing your handwriting.' },
      { level: 55, title: 'Ink That Does Not Dry', note: 'What you write stays legible under water, in the dark, for as long as the city lasts. The Ledger has stopped pretending it is a record and started accepting that it is a law.' },
      { level: 60, title: 'The Last Entry', note: 'Every debt the drowned city ever incurred passes through your hand before it is settled, including the ones nobody admits to. The archive upstairs has begun to cite you.' }
    ]
  },

  'salt-rats': {
    id: 'salt-rats',
    realm: 'lagoon-heart',
    region: 'Lagoon Heart',
    name: 'The Salt Rats',
    sigil: '⚓',
    motto: 'Nobody feeds us. We eat what the canal leaves.',
    rival: null,
    colour: '#8fa36b',
    image: 'immagini/The Salt Rats.jpg',
    introduction:
      'Children, mostly, who live in the flooded ground floors the water gave back and work the only trade the canal still allows: noticing. They know who goes where, they carry what should not be carried, and they have never once elected anybody, because electing would imply there was something worth electing over.',
    tiers: [
      { level: 1, title: 'Seen on the Step', note: 'Somebody noticed you noticing them. Nobody said anything, which is the first thing they teach you.' },
      { level: 5, title: 'One of the Small Ones', note: 'You are given a step of your own and taught which stones are loose. The teaching is free and the debt is not.' },
      { level: 10, title: 'Runner of Messages', note: 'You carry things between people who will not meet. You have learned to arrive wet and never to read what you carry, which is two out of three.' },
      { level: 15, title: 'Ear at the Water-Hole', note: 'You sit where the pipes run and you learn what the city says when it thinks nobody is in the room. Most of it is about the rats.' },
      { level: 20, title: 'Counted Among the Trustworthy', note: 'The list of who can be trusted is short, it is not written down, and your name is on it. You did nothing to earn this and you will never be told how.' },
      { level: 25, title: 'Holder of the Stairwell', note: 'There is a way down that does not appear on any plan. You have been shown it, which means somebody decided you are old enough to be shown it.' },
      { level: 30, title: 'Speaker for the Wet Children', note: 'The grown ones talk to you now, because you are the only ones they can find. You are eleven and you are negotiating with a magistrate.' },
      { level: 35, title: 'The One Who Counts Them', note: 'You know how many there are, exactly, and how many left last winter. Nobody else knows either number. That is the entire job and you are extremely good at it.' },
      { level: 40, title: 'Voice Under the Rope-Line', note: 'The laundresses pass a word along the lines they hang. The word reaches the far side before a courier could cross, and it is usually yours.' },
      { level: 45, title: 'The Whole Net', note: 'You are not a member of anything. You are the reason the thing exists: every adult in this arrangement has met at least one child who could get a message through, and that child came to you first.' },
      { level: 50, title: 'Their Own Council', note: 'They have never voted on anything. They have simply started consulting you, and consultation turned into a habit, and the habit turned into a rule without anyone ever meeting.' },
      { level: 55, title: 'Eyes on Every Quay', note: 'Every water gate, every mooring, every drowned doorway between here and the Canale. When the rats stop seeing something, the city finds out the way it always does: too late.' },
      { level: 60, title: 'The Rat That Led', note: 'The adults finally gave you a title, and it is not a rank but a warning: do not lie to the children. You have started keeping the second book of your own.' }
    ]
  },

  'iron-sister': {
    id: 'iron-sister',
    realm: 'abyssal-depth',
    region: 'Abyssal Depth',
    name: 'The Iron Sister',
    sigil: '⛓',
    motto: 'I remember the water before it was warm.',
    rival: null,
    colour: '#7f8c96',
    image: 'immagini/The Iron Sister.jpg',
    introduction:
      'She kept the nursery before there was a farm to keep, and she is still there: an iron mask riveted over the whole face, a coat and a skirt of beaten iron plate, long brown curls that the salt has never managed to take. Her voice arrives through the metal rather than from behind it, which means nobody has heard her laugh in four hundred years. She answers exactly what was asked and never once the question that was underneath, and the nursery runs better for it.',
    tiers: [
      { level: 1, title: 'The Shape at the Valve', note: 'You go down and something is already there, working the valve you came to work. It does not turn round. It knew you were coming before you did.' },
      { level: 5, title: 'Spoken To', note: 'The mask turns far enough to show you that there is a face under it. Whatever she says next comes out through the iron, and you understand every word and none of the tone.' },
      { level: 10, title: 'Named by the Sister', note: 'She calls you the thing you have been doing down here rather than the thing you are called above. You notice, weeks later, that you have started answering to it.' },
      { level: 15, title: 'Allowed the Warm Gallery', note: 'There is one room she does not let anyone into. You are shown the door, told it is warm, and left outside it, and you understand that being left outside is the gift.' },
      { level: 20, title: 'Keeper of the Cold Door', note: 'You hold the door she does not open. You have never seen through it. She has never asked what you think is on the other side, which is how you know she thinks about it constantly.' },
      { level: 25, title: 'The One Who Reads the Grating', note: 'She reads the vibration of the pipes with a finger on the iron. You ask what she is reading and she tells you a temperature, which is true and is not the answer.' },
      { level: 30, title: 'Second of the Nursery', note: 'The Combine has you both on the same page now, which is a sentence she read out of a contract and did not explain. She runs the farm. You run what she lets you run.' },
      { level: 35, title: 'The Unmasked Hour', note: 'Once a season the mask comes off, for an hour, in a room with no windows. You are not invited. You are told, in advance, that it happens, and the telling is how you learn it matters.' },
      { level: 40, title: 'Holder of the 1502 Account', note: 'There is a record from the year the water came that names every hand that went down and never came up. Her name is on it. She has never corrected it and she has never let anyone else read it.' },
      { level: 45, title: 'The Voice in the Iron', note: 'She speaks through the mask of the great bell in the Spire when the tide tables have to be corrected. Nobody knows it is her. You do, and she asks you not to say so, and you do not.' },
      { level: 50, title: 'The Keeper of the Drowned Order', note: 'The nursery has run on the same rota since 1502 without a single missed night. She has the rota. She has had the rota the entire time, and the Combine built an empire on top of it without ever asking.' },
      { level: 55, title: 'The Name Behind the Mask', note: 'She gives you the name on the 1502 payroll, having never denied it and never offered it before. It is a short name. It is not Nera. You understand that this is the last thing she has and she has just spent it.' },
      { level: 60, title: 'The First Person Down Here', note: 'Eight hundred fathoms, a drowned nursery, and one woman who was already here before the city admitted the water had come. She takes the mask off in front of you, which has happened once in four hundred years, and she says your name instead of hers.' }
    ]
  },

  // =========================================================================
  // IL GIORNO
  //
  // Quattro corpi che stanno svegli mentre gli altri tre dormono. Uno e' una
  // persona sola, gli altri tre hanno nome, uniforme e un'idea precisa di chi
  // debba obbedire.
  //
  // Nessuno di questi e' il potere di un reame: i quattro reami hanno gia' chi li
  // presidia, e un solo corpo per zona e' una regola che regge. Questi stanno
  // dentro le zone degli altri, come i tre corpi della notte, e sono i primi due
  // gruppi a essere davvero in gara fra loro.
  //
  // Clero e Corte sono rivali in senso pieno: crescere con uno costa all'altro.
  // La Guardia non e' in gara con nessuno, e non perche' sia neutrale: perche'
  // risponde a un po' di tutti, il che e' una terza via e non una neutralita'.
  // =========================================================================

  'widow-duellist': {
    id: 'widow-duellist',
    realm: 'lagoon-heart',
    region: 'Lagoon Heart',
    name: 'The Widow Duellist',
    sigil: '⚔',
    motto: 'Everyone gets one answer. Nobody gets it twice.',
    rival: null,
    colour: '#b5754a',
    image: 'immagini/The Widow Duellist.jpg',
    introduction:
      'She buried a husband whose debts came with him and kept his name because the name was the only part of the estate that still worked. The blade she is licensed to carry is the only sanctioned one left in the Lagoon Heart, which makes her less a fighter than the last copy of something everybody has stopped replacing. She talks constantly, remembers every word of it, and has never once raised her voice, because she has never needed to.',
    tiers: [
      { level: 1, title: 'Named on the Card', note: 'Somebody writes your name on a card at her door and leaves. The card says a time. It does not say what for.' },
      { level: 5, title: 'Allowed on the Floor', note: 'You are let past the door and told where to stand. Nobody explains the floor, and everyone on it already knows.' },
      { level: 10, title: 'Given a Blade You May Keep', note: 'She hands you a real one and does not ask for it back. The weight of it is the first thing she teaches and she teaches it by letting you hold it.' },
      { level: 15, title: 'The Third Duellist', note: 'There are two people in the Lagoon Heart who can do what you can. You find out their names before you find out hers.' },
      { level: 20, title: 'Keeper of the Ledger of Hands', note: 'Every hand that has been struck is written down with a date and a reason. Your hand is not in it. Getting it out of the list is the whole of her business.' },
      { level: 25, title: 'She Spares You Once', note: 'She calls the halt and does not explain it to you, and does not explain it to the room either. Nobody has ever asked her why and she has never been asked twice.' },
      { level: 30, title: 'Judge of the Drowned Court', note: 'Disputes that no magistrate will touch end up on her floor, because a verdict from a blade is at least impossible to buy.' },
      { level: 35, title: 'Holder of the Debt', note: 'The estate came with a price on it and she has been paying it out of other people for thirty years. She knows the amount to the coin and has never once discussed it.' },
      { level: 40, title: 'The Blade She Does Not Own', note: 'Somebody else authorised it. She has used it anyway for decades and the arrangement has never been questioned out loud, which is a kind of permission.' },
      { level: 45, title: 'Spoken of in Two Palazzi', note: 'A court hears about you and a cathedral hears about you, and for the first time the question is which of them got there first.' },
      { level: 50, title: 'The Only Sanctioned Steel', note: 'When the watch closes a street, the licensing on the blade in your hand is what makes it lawful to be carrying it. It occurs to you that this is a favour.' },
      { level: 55, title: 'Her Own Name, Spoken', note: 'She gives it to you without ceremony, the way she gives everything. It is the same name as the one on the card and you cannot work out why it feels heavier.' },
      { level: 60, title: 'The Last Duel', note: 'She has been waiting her whole life for a blade better than hers and has never once said so, and when you finally give her one she loses, and she is delighted, and the city finds out the same morning.' }
    ]
  },

  'clergy': {
    id: 'clergy',
    realm: 'aether-heights',
    region: 'Aether Heights',
    name: 'The Drowned Clergy',
    sigil: '✝',
    motto: 'The throne is empty. The register is not.',
    rival: 'bohemian-court',
    colour: '#c8b37a',
    image: 'immagini/The Drowned Clergy.jpg',
    introduction:
      'They kept the register through the winter the water came and they have never treated the throne being empty as anything that would alter the arrangement. The Doge went down into the lower chambers and did not come back up, the palace has been ruled vacant for twenty-eight years, and the only thing the clergy still holds is the book. A burial is a document. The copy in their book settles estates, ends claims and moves property, and it cannot be appealed by anybody, because appealing requires a seat and the seat is empty.',
    tiers: [
      { level: 1, title: 'Left Standing at the Back', note: 'You are put at the back of the gallery and left there, and nobody hurries you, and being unhurried about you is the first thing you have ever been given here.' },
      { level: 5, title: 'Taken Into the Choir', note: 'They give you a place to stand and something to carry. Neither is described as a favour and neither is ever taken back.' },
      { level: 10, title: 'Given the Bell Book', note: 'You learn which stroke means which office. After a month you are the only person in the city who can tell a passing bell from a death, and the guild notices.' },
      { level: 15, title: 'Read Out the Vacancy', note: 'You are handed a clause and made to read it aloud, in front of the people who would most like it not to exist, that the throne has been vacant for twenty-eight years. They make you do it twice, to be sure.' },
      { level: 20, title: 'Confessor of the Second Bank', note: 'People tell you things they have not told the first bank. The second bank is you, and the clergy knows, and does not compete.' },
      { level: 25, title: 'Kept the Burial Register', note: 'You are handed a book going back further than anyone thought and a pen that does not run in wet air. It is the first job that makes you feel ancient.' },
      { level: 30, title: 'Carried Both Petitions', note: 'A petition reaches the empty throne and a prayer reaches the church on the same morning, and somebody has to carry both. That somebody is becoming you.' },
      { level: 35, title: 'Argued Against a Coronation', note: 'You stand in front of a queen and object, on procedure, to crowning a throne nobody has been proven to have left empty. It works. Nothing since has gone quite as planned.' },
      { level: 40, title: 'Bellringer of the Ninth Hour', note: 'You ring a stroke that no service calls for and the whole lagoon hears it and understands nothing. They ring it anyway, every night, and you do it.' },
      { level: 45, title: 'Twice Refused the Throne', note: 'They have refused to crown this court twice. Both refusals are in the register, and the register is the only reason the throne is still empty.' },
      { level: 50, title: 'The Legible Document', note: 'Your entry in the burial book is the copy that settles estates, ends claims and moves property. It is not written by any court and it is not appealed, because there is nobody seated who could hear the appeal.' },
      { level: 55, title: 'Unreadable and Therefore Free', note: 'They offer to strike your name and your history both from the surviving volume. It is the most generous thing the church can do and it costs them the only copy.' },
      { level: 60, title: 'The Office Nobody Sealed', note: 'You hold the only office in the lagoon nobody has ever bought, revoked, or renewed. The throne is still empty. The Queen has stopped asking for it to be given up, and the two of them know exactly what that means about who is winning.' }
    ]
  },

  'bohemian-court': {
    id: 'bohemian-court',
    realm: 'lagoon-heart',
    region: 'Lagoon Heart',
    name: 'The Bohemian Court',
    sigil: '♛',
    motto: 'Luxury is a form of arithmetic.',
    rival: 'clergy',
    colour: '#a8557a',
    image: 'immagini/The Bohemian Court.jpg',
    introduction:
      'A queen from a country north of here that will never admit to this throne, arrived in a court with eleven people and by the second year had eleven thousand. She is not beautiful, she is expensive, and the lagoon has been entirely rearranged around the difference. Everything she wants becomes law in four days, every piece of it must first be seen, and nothing has ever been bought from her, because what she does is make you want to give it before she asks.',
    tiers: [
      { level: 1, title: 'Went to the Table', note: 'Somebody got you past the long room. The noise is one specific sound and the light is one specific colour and you will not be told which is which.' },
      { level: 5, title: 'Seen at the Long Table', note: 'You go, and you are looked at, and being looked at is not the prize. The prize is being looked at and then fed.' },
      { level: 10, title: 'Tasted the Small Plate', note: 'A thousand people do the same job here and only fourteen ever see the smaller plate. The plate is the actual rank and nothing else in the palace means anything.' },
      { level: 15, title: 'Kept Her Secret One Day', note: 'You know something about her and she knows it is not gone. What she does about it depends entirely on what you do with it.' },
      { level: 20, title: 'Named in the Catalogue', note: 'Your name is in a book of what she owns, which is the highest introduction available and the reason you cannot go back to being nobody.' },
      { level: 25, title: 'Named by Her', note: 'She says your name out loud in front of eleven people. Being named is being counted, and being counted is being spent.' },
      { level: 30, title: 'Overheard the Arithmetic', note: 'A number crosses the room with no face attached to it. It is about you, and the shape of it is that you are worth more than you were told.' },
      { level: 35, title: 'Asked for by the Claimant', note: 'The first time it is a request, and the request is for the empty chair rather than for anything in it. She has never asked twice for anything, and there is a reason for that which nobody will explain.' },
      { level: 40, title: 'Had the Plate Taken Away', note: 'The small plate is put down and not returned and the entire court understands what it means and understands it differently.' },
      { level: 45, title: 'Refused the Seat Quietly', note: 'You were offered the chair and you said no in a room full of people who did not hear you say it. It is the only refusal anyone remembers, and the chair is still empty.' },
      { level: 50, title: 'Bought a Bell', note: 'You paid for a bell to be rung and the church has refused to ring it twice, and she paid again, and the third time the bell rang and the church has not spoken since.' },
      { level: 55, title: 'Called Her a Spendthrift', note: 'It came out of your mouth and she laughed and repeated it the next day to people who matter, and your name is now attached to the only sentence of yours she has ever repeated.' },
      { level: 60, title: 'The Last Extravagance', note: 'There is one thing left in this lagoon she has not bought, and it is the only thing anybody has ever been able to keep from her. It is not a thing. It is a bell, and you are the one who rang it.' }
    ]
  },

  'imperial-guard': {
    id: 'imperial-guard',
    realm: 'abyssal-depth',
    region: 'Abyssal Depth',
    name: 'The Imperial Guard',
    sigil: '⚑',
    motto: 'We keep the order. We are not told whose.',
    rival: null,
    colour: '#6f9aa8',
    image: 'immagini/The Imperial Guard.jpg',
    introduction:
      'Half of them came for the science and half for the order, and both halves stayed for the other half, which nobody planned and everybody has since described as inevitable. They wear the imperial colour because that is the colour there is. They take orders from the Combine on Tuesdays, from the church on nothing in particular, and from whichever party most recently laid claim to the Doge\'s chair wherever a reading has to be maintained at depth. The chair has been empty for twenty-eight years and none of the three has ever stopped issuing orders about it. They have never once been instructed to do anything by all three at the same moment, which is how they remain the only force in the lagoon nobody owns.',
    tiers: [
      { level: 1, title: 'Walked the Line', note: 'You join the queue at a checkpoint and a guard reads your face for eleven seconds and decides something, and you never learn what it was.' },
      { level: 5, title: 'Stood a Post in the Cold', note: 'Four hours, no movement, no conversation. You are given a coat that fits nobody and told the shift is eight.' },
      { level: 10, title: 'Read a Gauge Under Water', note: 'They teach you to take a reading at depth with a moving current and to write down what the instrument says rather than what the book expects. This is the whole curriculum.' },
      { level: 15, title: 'Wrote Two Reports', note: 'One goes to the Combine and one goes to the party that most recently laid claim to the Doge\'s chair, and the two documents disagree by four, deliberately. You are the reason they differ.' },
      { level: 20, title: 'Given a Key With No Owner', note: 'It opens a door nobody has ever signed for. They hand it to you without ceremony and without an explanation of who maintains it.' },
      { level: 25, title: 'Kept Order at a Funeral', note: 'A claimant sends a representative, the church sends a priest, and the guard keeps the crowd back from both at once, because a crowd does not care whose funeral it is.' },
      { level: 30, title: 'Chose the Reading Over The Order', note: 'The instrument disagreed with the policy and you wrote down the instrument. Nobody overruled you, which is the most alarming outcome available.' },
      { level: 35, title: 'Refused the Claimants a Road', note: 'A procession was going to be opened for a party that does not hold the Doge\'s chair and never has, and you measured the ground and said no. The claimant accepted it and asked who had trained you.' },
      { level: 40, title: 'Set the Standard Rota', note: 'You write the shift. Everybody works it, including the officers, including the Combine, including the church, and the rota is the only document all three of them will accept from anybody.' },
      { level: 45, title: 'Held the Line Between Both', note: 'The claimant wanted a name out of the register and the church wanted the same name kept in it. You kept the gate shut until both of them stopped asking, and neither has forgotten it.' },
      { level: 50, title: 'The Force Nobody Commands', note: 'Three offices have asked you to take one and you have said no to three. The guard is still standing, and it is standing because of what you did not accept.' },
      { level: 55, title: 'Served Under All Three', note: 'A year of your life for each of them, in that order, filed separately. When you compare the records they are all identical, and you know that they were not.' },
      { level: 60, title: 'The Unowned Order', note: 'There is a force in this lagoon that a queen cannot buy, a church cannot command and a Combine cannot patent. It was built out of people who liked science and people who liked order and neither of whom wanted to be told whose it was.' }
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
// Verifica che i dati delle fazioni siano coerenti.
//
// Il mondo NON ha una fazione per zona e non deve averla: ogni zona ha
// l'organizzazione che la presidia — il nome che il mondo le dà quando ci si
// lavora — e intorno a quella quanti corpi minori si vuole. Gli assassini del
// Canale, i ragazzini che rubano per campare, una gilda segreta, un diavolo
// travestito: sono organizzazioni vere, non due voci sullo stesso registro.
//
// Quindi qui non si controlla che due fazioni non condividano la zona, che
// sarebbe un mondo con quattro fazioni e nient'altro. Si controlla che ogni zona
// abbia UNA sola fazione che la presidia, e che quella sia davvero una sola:
// e' il nome con cui il gioco chiama "chi ti paga quando lavori qui".
//
// La rivalita' si dichiara e si puo' non avere. Le quattro principali si
// contendono il monopolio e quindi si fanno danno a vicenda; chi non dichiara un
// rivale semplicemente non fa scendere nessuno. `rival: null` e' una posizione
// presa, non un dato dimenticato.
//
// Controlla anche che ogni fazione arrivi al livello 60: e' il punto in cui la
// progressione si ferma a essere descritta, e una fazione che si ferma prima
// lascerebbe il giocatore con un vicolo cieco senza che nessuno lo dica.
function checkFactionData() {
  const principalRealms = new Set();
  for (const faction of Object.values(factions)) {
    if (faction.rival) {
      const rival = factions[faction.rival];
      if (!rival) return { ok: false, reason: `${faction.id} names a rival that does not exist: ${faction.rival}` };
      if (rival.rival !== faction.id) return { ok: false, reason: `${faction.id} and ${faction.rival} do not point at each other` };
    }
    if (faction.principal) {
      if (principalRealms.has(faction.realm)) return { ok: false, reason: `two factions claim to hold the realm ${faction.realm}` };
      principalRealms.add(faction.realm);
    }
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

// La fazione che PRESIDIA una zona: quella che il gioco chiama quando lavori li'.
//
// Non e' l'unica organizzazione della zona, e non pretende di esserlo. Gli
// assassini del Canale e i ragazzini che rubano stanno nelle stesse acque del
// Council of Ten e non sono il Council of Ten: si trovano guardando sotto, non
// chiedendo il nome alla piazza. Ecco perche' il nome arriva dal campo
// `principal` e non dal semplice fatto di avere la stessa zona.
//
// Attenzione alla forma della chiave: `locations[].realm` e `regions[].name`
// sono nomi leggibili ("Aether Heights"), mentre `regions[].id` e
// `factions[].realm` sono id ("aether-heights"). Il confronto passa quindi dal
// nome alla forma con i trattini, non viceversa: e' la sola direzione che tiene
// senza dover provare entrambe.
//
// Restituisce null se la zona non ha una fazione che la presidia: e' un caso da
// tollerare, non un errore, perche' un'area futura puo' anche restare senza
// organizzazione ufficiale.
function factionForRealm(realm) {
  if (!realm) return null;
  const id = String(realm).trim().toLowerCase().replace(/\s+/g, '-');
  return Object.values(factions).find((faction) => faction.principal && faction.realm === id) || null;
}

// Tutte le fazioni, non una per zona.
//
// Vengono per prime le quattro che presidiano un reame, nell'ordine in cui il
// giocatore viaggia e quindi le incontra. Poi, nell'ordine in cui sono scritte,
// le organizzazioni che si trovano dentro le zone: quelle non si raggiungono con
// un viaggio, si trovano guardando sotto, e quindi non hanno un ordine di
// arrivo che il giocatore possa seguire.
function factionList() {
  const principals = regions.map((region) => factionForRealm(region.id)).filter(Boolean);
  const underlings = Object.values(factions).filter((faction) => !faction.principal);
  return [...principals, ...underlings];
}