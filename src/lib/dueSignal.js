// Sygnał: „dane, z których liczą się terminy kontroli, się zmieniły”.
//
// Znacznik przy „Kontrole” w nagłówku liczy się ze znamion i dat zdjęć, a sam
// nagłówek (`Layout`) przetrwa zmiany ekranów. Bez takiego sygnału po edycji
// statusu pokazywałby starą liczbę aż do przeładowania aplikacji.
//
// To celowo NIE jest magazyn danych ani cache — tylko dzwonek. Kto zmienia dane
// wpływające na terminy, woła `notifyDueChanged()`; `useDueReminders` przelicza
// wtedy swoje liczby. Sygnał jest też wysyłany przy zmianie ekranu i powrocie
// do aplikacji (patrz `useDueReminders`), więc pojedyncze przeoczone miejsce
// nie zostawia znacznika na stałe ze starą liczbą.
const EVENT = 'skin-tracker:due-changed'

export function notifyDueChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EVENT))
}

export function subscribeDueChanged(handler) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
