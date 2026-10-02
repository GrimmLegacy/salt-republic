// ============================================================================
// Account e salvataggio online (Supabase).
//
// Opzionale di proposito: se questo file non viene caricato, o le credenziali
// non sono configurate, `auth.enabled` resta false e il gioco continua a
// funzionare esattamente come prima, salvando solo in locale.
//
// Configurazione: incolla le chiavi qui sotto. La `anon key` e' pensata per
// essere pubblica (la protezione sta nelle Row Level Security, che trovi
// gia' nella tabella `saves`). Non inserire mai la `service_role` key: darebbe
// a chiunque leggesse questa pagina pieno accesso al database.
//
// Istruzioni per il setup completo: vedi README.md, sezione "Account online".
// ============================================================================

// La `publishable key` (prefisso `sb_publishable_`) e' pensata per stare nel
// browser: e' pubblica per definizione e i dati sono protetti dalle policy RLS
// in supabase-schema.sql. Esiste anche la chiave `anon` legacy (eyJ...), che
// funziona allo stesso modo.
//
// La `service_role` / `sb_secret_` NON vanno mai qui dentro: darebbero a
// chiunque leggesse questa pagina pieno accesso al database, e Supabase le
// rigenera dalla Dashboard -> Settings -> API Keys.
const SUPABASE_URL = 'https://clytxlgsrwgnucimucrzb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0ksWle3_o4z5IZ2TMGE0yg_ppVXZeq';

const auth = {
  // `true` solo se le credenziali sono state compilate E la libreria ha caricato.
  enabled: false,
  // Utente attualmente connesso, oppure null (ospite, gioco solo locale).
  user: null,
  // Momento dell'ultima sincronizzazione riuscita col database (ms epoch).
  lastSyncedAt: 0,
  // Motivo per cui la sessione non e' attiva, mostrato nella pagina Profile.
  notice: '',
  // true mentre una sincronizzazione e' in corso: evita scritture sovrapposte.
  syncing: false,
  // true mentre un'azione account (login, registrazione, logout) e' in corso.
  busy: false,
  // Riga di `profiles` per l'utente corrente, se gia' stata scritta.
  profile: null,

  // Risolto il client solo se le credenziali ci sono: senza di esse non tentiamo
  // nemmeno la rete, cosi' l'app parte istantanea e senza errori in console.
  client: null,

  // Restituisce true se il gioco puo' parlare con Supabase. La libreria viene
  // inclusa come script tag prima di questo file (vedi index.html).
  init() {
    if (!SUPABASE_URL || !SUPABASE_KEY) return false;
    if (typeof window.supabase === 'undefined') return false;
    try {
      this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      this.enabled = true;
      return true;
    } catch (error) {
      // Credenziali malformate: nessun crash, solo nessun account online.
      this.client = null;
      return false;
    }
  },

  // Ripristina la sessione salvata da Supabase al caricamento della pagina.
  // Va chiamata una sola volta: se l'utente e' gia' loggato, `user` viene
  // popolato e il gioco continua senza toccare nulla in locale.
  async restoreSession() {
    if (!this.enabled) return null;
    try {
      const { data, error } = await this.client.auth.getSession();
      if (error) throw error;
      this.user = data.session ? data.session.user : null;
    } catch (error) {
      this.user = null;
      this.notice = 'The session could not be read. Playing locally.';
    }
    return this.user;
  },

  // Tiene this.user allineato in automatico a ogni login, logout o cambio
  // sessione, senza che il chiamante debba ricordarsi di aggiornarlo a mano.
  listen() {
    if (!this.enabled) return;
    this.client.auth.onAuthStateChange((event, session) => {
      this.user = session ? session.user : null;
      if (event === 'SIGNED_OUT') this.notice = 'Signed out. This chronicle stays on this device.';
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: this.user, event } }));
    });
  },
async signUpWithPassword(email, password) {
    if (!this.enabled) return { ok: false, reason: 'Online accounts are not configured in this build.' };
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) return { ok: false, reason: humaniseAuthError(error) };
    this.user = data.user;
    // Con "Confirm email" attivo Supabase non crea la sessione subito:
    // l'utente deve aprire la mail di conferma prima di poter entrare.
    this.notice = data.session
      ? 'Account created. Your chronicle is syncing.'
      : 'Account created. Open the confirmation email, then sign in.';
    return { ok: true, needsConfirmation: !data.session };
  },

  async signInWithPassword(email, password) {
    if (!this.enabled) return { ok: false, reason: 'Online accounts are not configured in this build.' };
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, reason: humaniseAuthError(error) };
    this.user = data.user;
    return { ok: true };
  },

  // Google gestisce il resto: Supabase rimanda l'utente al proprio endpoint
  // OAuth, Google rimanda qui, e la sessione viene ricostruita al ritorno
  // dalla pagina. Per questo non diamo errori sincroni, solo errori di rete.
  async signInWithGoogle() {
    if (!this.enabled) return { ok: false, reason: 'Online accounts are not configured in this build.' };
    const { error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href }
    });
    if (error) return { ok: false, reason: humaniseAuthError(error) };
    return { ok: true };
  },

  async signOut() {
    if (!this.enabled) return { ok: false, reason: 'Online accounts are not configured in this build.' };
    const { error } = await this.client.auth.signOut();
    if (error) return { ok: false, reason: humaniseAuthError(error) };
    this.user = null;
    return { ok: true };
  },

  // Tabelle `profiles`: chi e' il giocatore, separato dal save. Viene scritta
  // al primo accesso e poi solo per aggiornare `last_seen_at`. Se la riga non
  // esiste ancora la si crea: per un utente che si registra e poi chiude
  // senza mai giocare, il profilo deve comunque esistere.
  async touchProfile(displayName) {
    if (!this.enabled || !this.user) return { ok: false, skipped: true };
    const row = {
      user_id: this.user.id,
      email: this.user.email || null,
      display_name: displayName || null,
      last_seen_at: new Date().toISOString()
    };
    const { error } = await this.client
      .from('profiles')
      .upsert(row, { onConflict: 'user_id' });
    if (error) return { ok: false, reason: humaniseAuthError(error) };
    this.profile = row;
    return { ok: true };
  },

  // Quanti giocatori registrati ci sono. E' una funzione `security definer`
  // perche' le RLS vietano di leggere le righe altrui: il numero e' l'unica
  // cosa che si vuole mostrare, non chi e' dentro.
  async fetchPlayerCount() {
    if (!this.enabled) return 0;
    try {
      const { data, error } = await this.client.rpc('public_player_count');
      if (error) return 0;
      return Number(data) || 0;
    } catch (error) {
      return 0;
    }
  },

  // Salva la cronaca sul server. Il conflitto e' risolto da `user_id`: se due
  // dispositivi scrivono insieme, l'ultimo scrive e gli altri ricevono un errore
  // "nessun record aggiornato", gestito qui senza perdere nulla in locale.
  async pushSave(state) {
    if (!this.enabled || !this.user || this.syncing) return { ok: false, skipped: true };
    this.syncing = true;
    try {
      const payload = { user_id: this.user.id, state, updated_at: new Date().toISOString() };
      const { data, error } = await this.client
        .from('saves')
        .upsert(payload, { onConflict: 'user_id' })
        .select('updated_at');
      if (error) return { ok: false, reason: humaniseAuthError(error) };
      this.lastSyncedAt = data && data.length ? Date.parse(data[0].updated_at) : Date.now();
      return { ok: true };
    } finally {
      this.syncing = false;
    }
  },

  // Recupera la cronaca salvata su questo account, se presente.
  async pullSave() {
    if (!this.enabled || !this.user) return { ok: false, skipped: true };
    const { data, error } = await this.client
      .from('saves')
      .select('state, updated_at')
      .eq('user_id', this.user.id)
      .maybeSingle();
    if (error) return { ok: false, reason: humaniseAuthError(error) };
    if (!data) return { ok: false, empty: true };
    return { ok: true, state: data.state, updatedAt: Date.parse(data.updated_at) };
  }
};

// Traduce i messaggi tecnici di Supabase in qualcosa che un giocatore
// capisca. I codici sono stabili; il messaggio originale resta in console
// per chi sviluppa.
function humaniseAuthError(error) {
  const message = (error && (error.message || error.error_description || error.code)) || 'Unknown error.';
  const table = {
    'Invalid login credentials': 'Email or password not recognised.',
    'User already registered': 'An account already exists with this email.',
    'Email not confirmed': 'Confirm your email address first, then sign in.',
    'Password should be at least 6 characters': 'The password needs at least 6 characters.',
    'Unable to validate email address': 'That email address is not valid.',
    'Failed to fetch': 'No connection to the account server. Playing locally.'
  };
  if (table[message]) return table[message];
  console.warn('[auth]', message);
  return message;
}

if (typeof window !== 'undefined') window.auth = auth;