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

-- ============================================================================
-- The Drowned Serenissima - profili giocatore
--
-- Esegui questo file nel SQL Editor di Supabase DOPO supabase-schema.sql
-- (Dashboard > SQL Editor > New query > Incolla > Run).
--
-- Differenza rispetto a `saves`: la tabella `saves` contiene il SAVE, cioe'
-- tutto lo stato di gioco. Questa contiene l'IDENTITA', cioe' chi e' il
-- giocatore. Sono due cose separate per una ragione precisa: si puo' essere
-- un giocatore iscritto senza aver ancora mai salvato nulla, e questo e' il
-- posto dove si tiene traccia di loro senza fingere che esista una partita.
--
-- `auth.users` e' la tabella di Supabase che registra chi si e' loggato.
-- Non la tocchiamo e non la copiamo: `profiles` la guarda soltanto, e puo'
-- anche non avere righe se un utente non ha ancora aperto il gioco.
-- ============================================================================

create table if not exists public.profiles (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  email         text,
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- Il contatore dei personaggi registrati: e' l'unica aggregazione sull'intero
-- database che l'app puo' fare senza violare le RLS, perche' restituisce solo
-- un numero e non righe altrui.
create or replace function public.public_player_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from public.profiles;
$$;

-- La funzione va eseguita dal browser, quindi va concessa anche agli anonimi.
-- Restituisce solo un conteggio, quindi non espone nulla di personale.
grant execute on function public.public_player_count() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security, stesso principio di `saves`: ognuno vede e tocca solo
-- la propria riga, identificata dal user_id firmato nel token di Supabase.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

-- Il giocatore legge solo se stesso. Nessuna policy per gli altri: non esiste
-- un modo di chiedere "tutti i profili", quindi la lista dei giocatori resta
-- illeggibile anche per un account autenticato.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Verifica (facoltativa): questa query deve restituire una riga sola, e con il
-- tuo nome. Se ne restituisce piu', le RLS non sono attive e va fermato tutto.
--
--   select user_id, display_name, email, last_seen_at from public.profiles;
--
-- Nota: dopo aver eseguito questo file, il gioco crea la riga al primo login,
-- quindi finche' non ti sei loggato la tabella e' giustamente vuota.
-- ---------------------------------------------------------------------------