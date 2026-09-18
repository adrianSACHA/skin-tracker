-- ============================================================================
-- SKIN TRACKER - schemat tabel, RLS i prywatny bucket Storage
-- Uruchom CAŁOŚĆ w Supabase: Dashboard -> SQL Editor -> New query -> Run.
-- Skrypt jest idempotentny (można uruchamiać wielokrotnie).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. TABELE
-- ============================================================================

-- monitored_persons: "Ja" / "Syn" - zarządzane przez moje konto.
create table if not exists public.monitored_persons (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid not null references auth.users (id) on delete cascade,
  display_name   text not null,
  created_at     timestamptz not null default now()
);
create index if not exists monitored_persons_owner_idx
  on public.monitored_persons (owner_user_id);

-- body_maps: zdjęcie referencyjne całego ciała dla danego widoku.
create table if not exists public.body_maps (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references public.monitored_persons (id) on delete cascade,
  view_name   text not null check (view_name in ('front', 'back', 'left', 'right')),
  image_url   text, -- ścieżka w Storage (nie publiczny URL)
  created_at  timestamptz not null default now(),
  unique (person_id, view_name)
);
create index if not exists body_maps_person_idx
  on public.body_maps (person_id);

-- lesions: znamiona - pozycja w % względem zdjęcia (0-100).
create table if not exists public.lesions (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid not null references public.monitored_persons (id) on delete cascade,
  body_map_id  uuid references public.body_maps (id) on delete set null,
  label        text not null,
  pos_x        numeric not null check (pos_x >= 0 and pos_x <= 100),
  pos_y        numeric not null check (pos_y >= 0 and pos_y <= 100),
  status       text not null default 'new'
               check (status in ('new', 'stable', 'watch', 'removed', 'urgent')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists lesions_person_idx
  on public.lesions (person_id);
create index if not exists lesions_body_map_idx
  on public.lesions (body_map_id);

-- lesion_photos: sesje zdjęciowe + notatki ABCDE.
create table if not exists public.lesion_photos (
  id                uuid primary key default gen_random_uuid(),
  lesion_id         uuid not null references public.lesions (id) on delete cascade,
  photo_url         text not null, -- ścieżka w Storage
  taken_at          date not null default current_date,
  size_mm           numeric,
  notes             text,
  asymmetry         boolean not null default false,
  border_irregular  boolean not null default false,
  color_description text,
  evolution_notes   text,
  created_at        timestamptz not null default now()
);
create index if not exists lesion_photos_lesion_idx
  on public.lesion_photos (lesion_id);

-- updated_at auto-aktualizacja dla lesions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lesions_set_updated_at on public.lesions;
create trigger lesions_set_updated_at
  before update on public.lesions
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 2. RLS - WŁĄCZENIE
-- ============================================================================
alter table public.monitored_persons enable row level security;
alter table public.body_maps         enable row level security;
alter table public.lesions           enable row level security;
alter table public.lesion_photos     enable row level security;

-- ============================================================================
-- 3. FUNKCJE POMOCNICZE (łańcuch person -> owner_user_id)
--    SECURITY DEFINER: omijają RLS wewnątrz, dzięki czemu nie ma rekurencji
--    i polityki są krótkie. Zwracają tylko boolean dla zalogowanego użytkownika.
-- ============================================================================
create or replace function public.owns_person(p_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.monitored_persons p
    where p.id = p_person_id
      and p.owner_user_id = auth.uid()
  );
$$;

create or replace function public.owns_lesion(p_lesion_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lesions l
    join public.monitored_persons p on p.id = l.person_id
    where l.id = p_lesion_id
      and p.owner_user_id = auth.uid()
  );
$$;

-- ============================================================================
-- 4. POLITYKI RLS
-- ============================================================================

-- ---- monitored_persons ----
drop policy if exists persons_select_own on public.monitored_persons;
drop policy if exists persons_insert_own on public.monitored_persons;
drop policy if exists persons_update_own on public.monitored_persons;
drop policy if exists persons_delete_own on public.monitored_persons;

create policy persons_select_own on public.monitored_persons
  for select using (owner_user_id = auth.uid());

create policy persons_insert_own on public.monitored_persons
  for insert with check (owner_user_id = auth.uid());

create policy persons_update_own on public.monitored_persons
  for update using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy persons_delete_own on public.monitored_persons
  for delete using (owner_user_id = auth.uid());

-- ---- body_maps ----
drop policy if exists body_maps_select_own on public.body_maps;
drop policy if exists body_maps_insert_own on public.body_maps;
drop policy if exists body_maps_update_own on public.body_maps;
drop policy if exists body_maps_delete_own on public.body_maps;

create policy body_maps_select_own on public.body_maps
  for select using (public.owns_person(person_id));
create policy body_maps_insert_own on public.body_maps
  for insert with check (public.owns_person(person_id));
create policy body_maps_update_own on public.body_maps
  for update using (public.owns_person(person_id))
  with check (public.owns_person(person_id));
create policy body_maps_delete_own on public.body_maps
  for delete using (public.owns_person(person_id));

-- ---- lesions ----
drop policy if exists lesions_select_own on public.lesions;
drop policy if exists lesions_insert_own on public.lesions;
drop policy if exists lesions_update_own on public.lesions;
drop policy if exists lesions_delete_own on public.lesions;

create policy lesions_select_own on public.lesions
  for select using (public.owns_person(person_id));
create policy lesions_insert_own on public.lesions
  for insert with check (public.owns_person(person_id));
create policy lesions_update_own on public.lesions
  for update using (public.owns_person(person_id))
  with check (public.owns_person(person_id));
create policy lesions_delete_own on public.lesions
  for delete using (public.owns_person(person_id));

-- ---- lesion_photos ----
drop policy if exists lesion_photos_select_own on public.lesion_photos;
drop policy if exists lesion_photos_insert_own on public.lesion_photos;
drop policy if exists lesion_photos_update_own on public.lesion_photos;
drop policy if exists lesion_photos_delete_own on public.lesion_photos;

create policy lesion_photos_select_own on public.lesion_photos
  for select using (public.owns_lesion(lesion_id));
create policy lesion_photos_insert_own on public.lesion_photos
  for insert with check (public.owns_lesion(lesion_id));
create policy lesion_photos_update_own on public.lesion_photos
  for update using (public.owns_lesion(lesion_id))
  with check (public.owns_lesion(lesion_id));
create policy lesion_photos_delete_own on public.lesion_photos
  for delete using (public.owns_lesion(lesion_id));

-- ============================================================================
-- 5. STORAGE - PRYWATNY BUCKET + POLITYKI
--    Ścieżka plików: {auth.uid()}/{person_id}/{lesion_id}/{plik}
--    np.  {auth.uid()}/{person_id}/body-map/front.webp
--    RLS sprawdza, że PIERWSZY folder = auth.uid().
-- ============================================================================

-- Bucket prywatny (public = false).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesion-photos',
  'lesion-photos',
  false,
  5242880, -- 5 MB na plik (aplikacja i tak kompresuje do ~0.4 MB)
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Polityki na storage.objects (ograniczone do naszego bucketu).
drop policy if exists lesion_photos_storage_select on storage.objects;
drop policy if exists lesion_photos_storage_insert on storage.objects;
drop policy if exists lesion_photos_storage_update on storage.objects;
drop policy if exists lesion_photos_storage_delete on storage.objects;

create policy lesion_photos_storage_select on storage.objects
  for select using (
    bucket_id = 'lesion-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy lesion_photos_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'lesion-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy lesion_photos_storage_update on storage.objects
  for update using (
    bucket_id = 'lesion-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'lesion-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy lesion_photos_storage_delete on storage.objects
  for delete using (
    bucket_id = 'lesion-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 6. DANE STARTOWE (opcjonalnie) - utwórz dwa profile.
--    Albo dodaj profile przez UI aplikacji (przycisk "Dodaj profil"),
--    albo odkomentuj poniższy INSERT i podmień <TWOJE-UID> na swój
--    identyfikator z Authentication -> Users.
-- ============================================================================
-- insert into public.monitored_persons (owner_user_id, display_name)
-- values
--   ('<TWOJE-UID>', 'Ja'),
--   ('<TWOJE-UID>', 'Syn');
