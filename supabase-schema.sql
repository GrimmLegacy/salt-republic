-- ============================================================================
-- The Drowned Serenissima - schema del database online
--
-- Esegui questo file una volta sola nel SQL Editor di Supabase
-- (Dashboard > SQL Editor > New query > Incolla > Run).
--
-- Cosa fa: crea la tabella `saves`, che tiene una cronaca per ogni account.
-- La parte importante sono le policy RLS in fondo: senza quelle, chiunque
-- potrebbe leggere la cronaca di tutti gli altri giocatori.
-- ============================================================================

-- Una riga per utente. `user_id` e' la primary key, cosi' un account non
-- puo' avere due cronache e l'upsert dell'app fa sempre un overwrite pulito.
create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Indice per le query "le cronache piu' recenti", utili se in futuro vuoi
-- una classifica. Non serve al salvataggio, ma costa nulla.
create index if not exists saves_updated_at_idx on public.saves (updated_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security: il cuore della sicurezza.
--
-- La `anon key` e' pubblica (sta in auth.js, e chiunque puo' leggere il
-- sorgente della pagina). Quello che protegge i dati non e' la chiave, sono
-- queste regole: ogni utente autenticato vede e tocca SOLO la propria riga,
-- identificata dal `user_id` che Supabase mette nel token JWT. Un utente non
-- puo' ne' leggere ne' scrivere la cronaca di un altro, neppure inventandosi
-- un user_id, perche' le policy controllano il valore firmato nel token.
-- ---------------------------------------------------------------------------

alter table public.saves enable row level security;

-- Lettura: solo la propria cronaca.
drop policy if exists "read own save" on public.saves;
create policy "read own save"
  on public.saves for select
  using (auth.uid() = user_id);

-- Creazione: solo se stai scrivendo il tuo stesso user_id.
drop policy if exists "insert own save" on public.saves;
create policy "insert own save"
  on public.saves for insert
  with check (auth.uid() = user_id);

-- Aggiornamento: solo la propria riga.
drop policy if exists "update own save" on public.saves;
create policy "update own save"
  on public.saves for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Non si cancella: la `on delete cascade` sul foreign key pulisce tutto
-- automaticamente quando un utente elimina il proprio account su Supabase.

-- ---------------------------------------------------------------------------
-- Verifica (facoltativa): dopo aver creato un account e fatto un salvataggio,
-- questa query deve restituire esattamente una riga con il tuo nome.
--
--   select user_id, updated_at, state->'player'->>'name' as player_name
--   from public.saves;
-- ---------------------------------------------------------------------------