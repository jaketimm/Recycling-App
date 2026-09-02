-- Storage bucket for user-submitted identification photos, keyed by auth_user_id/uuid.jpg
-- (see identify_service.save_submission). Public bucket (paths are unguessable UUIDs) so
-- image URLs never expire; RLS below still scopes writes/authenticated reads to the owner.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recycling-photos', 'recycling-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "recycling_app_photos_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'recycling-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "recycling_app_photos_select_own_folder_or_admin"
  on storage.objects for select
  using (
    bucket_id = 'recycling-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.recycling_app_is_admin()
    )
  );
