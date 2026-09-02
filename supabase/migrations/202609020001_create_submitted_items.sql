-- Per-user history of submitted identification photos.
create table public.recycling_app_submitted_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.recycling_app_user_profiles (id) on delete cascade,
  image_url     text not null,
  material_type text references public.recycling_app_material_info (material_type),
  item_description text,
  confidence    numeric,
  created_at    timestamptz not null default now()
);

alter table public.recycling_app_submitted_items enable row level security;

grant select, insert, update, delete on public.recycling_app_submitted_items to service_role;
grant select, insert, delete on public.recycling_app_submitted_items to authenticated;

create policy "recycling_app_submitted_items_select_own_or_admin"
  on public.recycling_app_submitted_items for select
  using (
    user_id = (select id from public.recycling_app_user_profiles where auth_user_id = auth.uid())
    or public.recycling_app_is_admin()
  );

create policy "recycling_app_submitted_items_insert_own"
  on public.recycling_app_submitted_items for insert
  with check (
    user_id = (select id from public.recycling_app_user_profiles where auth_user_id = auth.uid())
  );

create policy "recycling_app_submitted_items_delete_own"
  on public.recycling_app_submitted_items for delete
  using (
    user_id = (select id from public.recycling_app_user_profiles where auth_user_id = auth.uid())
  );