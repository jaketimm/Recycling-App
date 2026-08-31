-- user_profiles, roles, signup trigger, RLS
--
-- NOTE: this Supabase project is shared across multiple apps, so everything
-- that risks colliding with other apps (auth.users triggers, function
-- names) is prefixed with recycling_app_.

create type public.recycling_app_user_role as enum ('admin', 'user');

create table public.recycling_app_user_profiles (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null unique references auth.users (id) on delete cascade,
  username     text,
  role          public.recycling_app_user_role not null default 'user',
  created_at    timestamptz not null default now()
);

alter table public.recycling_app_user_profiles enable row level security;

-- Explicit table grants: service_role bypasses RLS but still needs the
-- underlying SQL privilege.
grant select, insert, update, delete on public.recycling_app_user_profiles to service_role;
grant select on public.recycling_app_user_profiles to anon, authenticated;

-- security definer so policies can check admin status without recursing into user_profiles RLS
create or replace function public.recycling_app_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.recycling_app_user_profiles
    where auth_user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- Auto-create a profile when an auth user is created (covers both magic-link
-- signups and password signups).
create or replace function public.recycling_app_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.recycling_app_user_profiles (auth_user_id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger recycling_app_on_auth_user_created
  after insert on auth.users
  for each row execute function public.recycling_app_handle_new_user();

-- RLS: owner read/update own row, admins read all.
create policy "recycling_app_user_profiles_select_own_or_admin"
  on public.recycling_app_user_profiles for select
  using (auth_user_id = auth.uid() or public.recycling_app_is_admin());

create policy "recycling_app_user_profiles_update_own"
  on public.recycling_app_user_profiles for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Column-level guard: users can edit their username but never their own role.
revoke update on public.recycling_app_user_profiles from anon, authenticated;
grant update (username) on public.recycling_app_user_profiles to authenticated;


