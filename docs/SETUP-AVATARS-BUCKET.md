# SETUP — Avatars Storage Bucket

The profile overlay already supports photo upload (`dashboard.html` lines ~1367-1423) — it writes to a Supabase Storage bucket called `avatars`. If the bucket doesn't exist, the upload fails silently for the user.

## One-time setup

Supabase Dashboard → **Storage → New bucket**

| Field | Value |
|---|---|
| Name | `avatars` |
| Public bucket | ✅ Yes (avatars need to load on public crew cards) |
| File size limit | `5 MB` |
| Allowed MIME types | `image/png, image/jpeg, image/webp` |

## RLS policies (Storage → Policies → New policy on `avatars`)

Each user can read public avatars, and write **only** their own folder (`<user_id>/...`).

```sql
-- SELECT: anyone can read
create policy "Public read on avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- INSERT: authenticated users can upload to their own folder
create policy "Users upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: same constraint
create policy "Users replace own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: same constraint
create policy "Users delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

The frontend uploads to `<user_id>/avatar.<ext>` and writes the public URL back to `profiles.avatar_url`. No code change needed once the bucket exists.

## Verify

1. Sign in on the live site.
2. Open the profile overlay → click the avatar circle → upload a photo.
3. Confirm the status text turns "Saved" (green).
4. Refresh the page → the photo persists in the dashboard header.
