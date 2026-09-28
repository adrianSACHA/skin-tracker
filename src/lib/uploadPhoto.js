import imageCompression from 'browser-image-compression'
import { supabase } from './supabase'
import { cropImageToBlob } from './crop'
import { slugify } from './bodyAreas'

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
// Opcjonalny `crop` (znormalizowany kadr z segmentatora, ticket 11) stosujemy PO
// kompresji - wtedy orientacja EXIF jest już znormalizowana, więc kadr nie rotuje.
export async function uploadLesionPhoto({ file, personId, lesionId, crop }) {
  const userId = await currentUserId()
  const compressed = await compressImage(file)
  const finalBlob = crop ? await cropImageToBlob(compressed, crop) : compressed
  const path = `${userId}/${personId}/${lesionId}/${Date.now()}-${randomSuffix()}.webp`

  const { error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(path, finalBlob, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: false,
    })
  if (error) throw error

  return { path, compressed: finalBlob }
}

// Zdjęcie referencyjne mapy ciała. Ścieżka: {auth.uid()}/{person_id}/body-map/{view}.webp
// (nadpisujemy to samo zdjęcie dla danego widoku).
export async function uploadBodyMapImage({ file, personId, view }) {
  const userId = await currentUserId()
  const compressed = await compressImage(file)
  // Klucz widoku może być własną nazwą (ze spacjami/znakami) → slug dla ścieżki.
  const path = `${userId}/${personId}/body-map/${slugify(view)}.webp`

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

// Usuwa WSZYSTKIE pliki osoby ze Storage (best-effort). Ścieżki mają postać
// {auth.uid()}/{person_id}/... — kasujemy cały folder osoby (rekurencyjnie).
export async function removePersonFiles(personId) {
  if (!personId) return
  let userId
  try {
    userId = await currentUserId()
  } catch {
    return
  }
  const root = userId + '/' + personId
  const paths = []

  async function collect(prefix) {
    const { data, error } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .list(prefix, { limit: 1000 })
    if (error || !data) return
    for (const item of data) {
      const full = prefix + '/' + item.name
      // Folder nie ma własnego id — schodzimy głębiej; plik ma id.
      if (!item.id) await collect(full)
      else paths.push(full)
    }
  }

  await collect(root)
  if (paths.length > 0) {
    await supabase.storage.from(PHOTOS_BUCKET).remove(paths)
  }
}

export async function removeStorageFile(path) {
  if (!path) return
  await supabase.storage.from(PHOTOS_BUCKET).remove([path])
}
