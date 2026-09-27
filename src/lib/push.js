// Web Push: rejestracja service workera, subskrypcja i zapis do Supabase.
// Powiadomienia w tle wysyła GitHub Actions (skrypt `scripts/send-reminders.mjs`),
// więc nie potrzebujemy własnego serwera ani płatnych funkcji.
import { supabase } from './supabase'

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function getVapidPublicKey() {
  return import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
}

// Czy w ogóle da się włączyć push (wsparcie + skonfigurowany klucz VAPID).
export function pushConfigured() {
  return pushSupported() && getVapidPublicKey().length > 0
}

// VAPID public key (base64url) → bajty wymagane przez pushManager.subscribe.
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register(
      `${import.meta.env.BASE_URL}sw.js`
    )
  } catch {
    return null
  }
}

export async function getPushSubscription() {
  if (!pushSupported()) return null
  try {
    const reg = await navigator.serviceWorker.ready
    return await reg.pushManager.getSubscription()
  } catch {
    return null
  }
}

// Zwraca 'granted' | 'denied' | 'unsupported' | 'unconfigured' | 'error'.
export async function enablePush() {
  if (!pushSupported()) return 'unsupported'
  if (!getVapidPublicKey()) return 'unconfigured'

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'

  try {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    const sub =
      existing ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey()),
      }))

    const json = sub.toJSON()
    const { data: userRes } = await supabase.auth.getUser()
    const owner = userRes?.user?.id
    if (!owner) return 'error'

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        owner_user_id: owner,
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      },
      { onConflict: 'endpoint' }
    )
    if (error) return 'error'
    return 'granted'
  } catch {
    return 'error'
  }
}

export async function disablePush() {
  const sub = await getPushSubscription()
  if (!sub) return
  try {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', sub.endpoint)
  } catch {
    /* brak w tabeli - ignorujemy */
  }
  try {
    await sub.unsubscribe()
  } catch {
    /* ignorujemy */
  }
}
