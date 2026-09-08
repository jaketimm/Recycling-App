create policy "recycling_app_photos_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'recycling-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
