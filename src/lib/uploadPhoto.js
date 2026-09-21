import imageCompression from 'browser-image-compression'
import { supabase } from './supabase'

export const PHOTOS_BUCKET = 'lesion-photos'

// Ustawienia kompresji: Web Worker (nie zawiesza UI na telefonie),
// automatyczna obsługa orientacji EXIF, docelowy format webp.
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 1800,
  useWebWorker: true,
  fileType: 'image/webp',
}

export async function compressImage(file) {
  return imageCompression(file, COMPRESSION_OPTIONS)
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8)
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) throw new Error('Brak zalogowania.')
  return data.user.id
}

// Signed URL - zdjęcia w prywatnym bucketcie są dostępne tylko tak.
export async function getSignedUrl(path, expiresInSeconds = 3600) {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrl(path, expiresInSeconds)
  if (error) throw error
  return data.signedUrl
}

export async function getSignedUrls(paths, expiresInSeconds = 3600) {
  if (!paths || paths.length === 0) return []
  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrls(paths, expiresInSeconds)
  if (error) throw error
  return data // [{ path, signedUrl, error }]
}

// Upload zdjęcia znamienia. Ścieżka: {auth.uid()}/{person_id}/{lesion_id}/{plik}
export async function uploadLesionPhoto({ file, personId, lesionId }) {
  const userId = await currentUserId()
  const compressed = await compressImage(file)
  const path = `${userId}/${personId}/${lesionId}/${Date.now()}-${randomSuffix()}.webp`

  const { error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, compressed, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: false,
    })
  if (error) throw error

  return { path, compressed }
}

// Zdjęcie referencyjne mapy ciała. Ścieżka: {auth.uid()}/{person_id}/body-map/{view}.webp
// (nadpisujemy to samo zdjęcie dla danego widoku).
export async function uploadBodyMapImage({ file, personId, view }) {
  const userId = await currentUserId()
  const compressed = await compressImage(file)
  const path = `${userId}/${personId}/body-map/${view}.webp`

  const { error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, compressed, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: true,
    })
  if (error) throw error

  return path
}

export async function removeStorageFile(path) {
  if (!path) return
  await supabase.storage.from(PHOTOS_BUCKET).remove([path])
}
