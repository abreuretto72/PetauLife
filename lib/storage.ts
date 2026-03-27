import { supabase } from './supabase';

export async function uploadPetPhoto(
  userId: string,
  petId: string,
  uri: string,
  fileName: string,
) {
  const response = await fetch(uri);
  const blob = await response.blob();

  const path = `${userId}/${petId}/${Date.now()}_${fileName}`;
  const { data, error } = await supabase.storage
    .from('pet-photos')
    .upload(path, blob, { contentType: 'image/webp', upsert: false });

  if (error) throw error;
  return data.path;
}

export async function uploadAvatar(userId: string, uri: string) {
  const response = await fetch(uri);
  const blob = await response.blob();

  const path = `${userId}/avatar_${Date.now()}.webp`;
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { contentType: 'image/webp', upsert: true });

  if (error) throw error;
  return data.path;
}

export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
