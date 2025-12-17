-- Allow authenticated users to UPDATE files in rendered-id-cards (needed for upsert)
create policy "Allow authenticated users to update rendered-id-cards"
on storage.objects for update
to authenticated
using ( bucket_id = 'rendered-id-cards' )
with check ( bucket_id = 'rendered-id-cards' );

-- Allow authenticated users to DELETE files in rendered-id-cards (good practice for cleanup)
create policy "Allow authenticated users to delete rendered-id-cards"
on storage.objects for delete
to authenticated
using ( bucket_id = 'rendered-id-cards' );

-- Constraint existing INSERT policy if needed, or just leave it since permissive policies are OR'd.
-- But adding explicit bucket check is cleaner.
-- We can't easily alter existing policies via migration without dropping, so we'll just add the missing ones.
