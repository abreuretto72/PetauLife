import * as FileSystem from 'expo-file-system/legacy';
import { decode as base64Decode } from 'base-64';
import { supabase } from './supabase';
import { MEDIA_LIMITS } from '../constants/media';

export type MediaType = 'photo' | 'video';

const AUDIO_EXT_MIME: Record<string, string> = {
  mp3:  'audio/mpeg',
  m4a:  'audio/mp4',
  aac:  'audio/mp4',
  wav:  'audio/wav',
  ogg:  'audio/ogg',
  flac: 'audio/flac',
  opus: 'audio/opus',
};

/** Derive storage extension + content-type from the original filename or URI. */
function getExtAndMime(
  uri: string,
  mediaType: MediaType,
  originalName?: string,
): { ext: string; contentType: string } {
  if (mediaType !== 'video') {
    // Photos are always re-encoded to WebP by the caller
    if (uri.endsWith('.png')) return { ext: 'webp', contentType: 'image/png' };
    if (uri.endsWith('.jpg') || uri.endsWith('.jpeg')) return { ext: 'webp', contentType: 'image/jpeg' };
    return { ext: 'webp', contentType: 'image/webp' };
  }

  // For the video/audio bucket: derive extension from originalName → uri → default mp4
  const nameToCheck = originalName ?? uri;
  const rawExt = nameToCheck.split('.').pop()?.toLowerCase().split('?')[0] ?? '';

  if (rawExt in AUDIO_EXT_MIME) {
    return { ext: rawExt, contentType: AUDIO_EXT_MIME[rawExt] };
  }
  if (rawExt === 'mov')  return { ext: 'mov',  contentType: 'video/quicktime' };
  if (rawExt === 'webm') return { ext: 'webm', contentType: 'video/webm' };
  if (rawExt === 'm4v')  return { ext: 'm4v',  contentType: 'video/mp4' };
  return { ext: 'mp4', contentType: 'video/mp4' };
}

/**
 * Read a local file URI as Uint8Array.
 * Android content:// URIs from the media documents provider cannot be read
 * with readAsStringAsync directly — they must be copied to a local cache
 * path first (FileSystem.copyAsync supports the content:// scheme).
 */
async function readFileAsBytes(uri: string): Promise<Uint8Array> {
  let localUri = uri;
  let tmpPath: string | null = null;

  if (uri.startsWith('content://')) {
    tmpPath = `${FileSystem.cacheDirectory}tmp_upload_${Date.now()}`;
    console.log('[STORAGE] content:// detectado — copiando para cache:', tmpPath);
    const t0 = Date.now();
    await FileSystem.copyAsync({ from: uri, to: tmpPath });
    console.log('[STORAGE] copyAsync OK em', Date.now() - t0, 'ms');
    localUri = tmpPath;
  }

  try {
    const b64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const binaryString = base64Decode(b64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } finally {
    if (tmpPath) {
      FileSystem.deleteAsync(tmpPath, { idempotent: true }).catch(() => {});
    }
  }
}

export async function uploadPetPhoto(
  userId: string,
  petId: string,
  uri: string,
  fileName: string,
) {
  const bytes = await readFileAsBytes(uri);
  const path = `${userId}/${petId}/${Date.now()}_${fileName}`;
  const { contentType } = getExtAndMime(uri, 'photo');

  const { data, error } = await supabase.storage
    .from('pet-photos')
    .upload(path, bytes, { contentType, upsert: false });

  if (error) throw error;
  return data.path;
}

/**
 * Upload a photo, video, or audio to pet-photos bucket.
 * Pass `originalName` (e.g. "latido.mp3") to preserve the original extension.
 * Returns the storage path (not the public URL).
 */
export async function uploadPetMedia(
  userId: string,
  petId: string,
  uri: string,
  mediaType: MediaType,
  originalName?: string,
): Promise<string> {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists && 'size' in info && info.size != null) {
    const limitBytes = mediaType === 'video'
      ? MEDIA_LIMITS.video.maxSizeBytes
      : MEDIA_LIMITS.photo.maxSizeBytes;
    const limitMB = mediaType === 'video'
      ? MEDIA_LIMITS.video.maxSizeMB
      : MEDIA_LIMITS.photo.maxSizeMB;
    if (info.size > limitBytes) throw new Error(`FILE_TOO_LARGE:${limitMB}`);
  }
  const bytes = await readFileAsBytes(uri);

  const { ext, contentType } = getExtAndMime(uri, mediaType, originalName);
  const path = `${userId}/${petId}/${Date.now()}_diary.${ext}`;

  const { data, error } = await supabase.storage
    .from('pet-photos')
    .upload(path, bytes, { contentType, upsert: false });

  if (error) throw error;
  return data.path;
}

export async function uploadAvatar(userId: string, uri: string) {
  const bytes = await readFileAsBytes(uri);
  const path = `${userId}/avatar_${Date.now()}.webp`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, { contentType: 'image/webp', upsert: true });

  if (error) throw error;
  return data.path;
}

export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
