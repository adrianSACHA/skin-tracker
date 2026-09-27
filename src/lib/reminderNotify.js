// Lekkie przypomnienie o zaległych kontrolach (wariant bez Web Push).
// Pokazuje lokalne powiadomienie przeglądarki przy otwarciu aplikacji —
// tylko jeśli użytkownik to włączył i wyraził zgodę. Max raz dziennie.
import { todayYMD } from './date'

export const NOTIFY_ON_OPEN_KEY = 'skin-tracker:notify-on-open'
const NOTIFY_LAST_KEY = 'skin-tracker:notify-last'

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function isNotifyOnOpenEnabled() {
  try {
    return localStorage.getItem(NOTIFY_ON_OPEN_KEY) === '1'
  } catch {
    return false
  }
}

export function setNotifyOnOpenEnabled(on) {
  try {
    if (on) localStorage.setItem(NOTIFY_ON_OPEN_KEY, '1')
    else localStorage.removeItem(NOTIFY_ON_OPEN_KEY)
  } catch {
    /* brak localStorage - ignorujemy */
  }
}

// Zwraca 'granted' | 'denied' | 'default' | 'unsupported'.
export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'default'
  }
}

// Pokaż powiadomienie, gdy są zaległe kontrole i użytkownik to włączył.
// Co najwyżej raz dziennie, żeby nie spamować przy każdym otwarciu.
export function notifyOverdueOnce(overdue) {
  if (overdue <= 0) return
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  if (!isNotifyOnOpenEnabled()) return
  try {
    const today = todayYMD()
    if (localStorage.getItem(NOTIFY_LAST_KEY) === today) return
    new Notification('Skin Tracker — kontrole', {
      body:
        overdue === 1
          ? 'Masz 1 zaległą kontrolę znamienia.'
          : `Masz ${overdue} zaległych kontroli znamion.`,
      tag: 'skin-tracker-overdue',
    })
    localStorage.setItem(NOTIFY_LAST_KEY, today)
  } catch {
    /* brak dostępu do Notification/localStorage - ignorujemy */
  }
}
