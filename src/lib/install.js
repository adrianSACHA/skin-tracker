import { useEffect, useState } from 'react'

// Czy aplikacja działa już jako zainstalowana (tryb standalone / iOS)?
export function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

// iOS/iPadOS (Safari) nie wspiera `beforeinstallprompt` — instalacja ręczna
// przez „Udostępnij -> Dodaj do ekranu początkowego".
export function isIos() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const iPadOs =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return iOS || iPadOs
}

// Przechwytuje `beforeinstallprompt`, żeby pokazać WŁASNY przycisk „Zainstaluj".
// Natywny prompt Chrome pojawia się raz i po odrzuceniu trudno go przywołać —
// trzymając zdarzenie w stanie, dajemy stały dostęp (dopóki apka nie jest
// zainstalowana).
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [installed, setInstalled] = useState(() => isStandalone())

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
    }
    const onInstalled = () => {
      setDeferred(null)
      setInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferred) return
    try {
      deferred.prompt()
      await deferred.userChoice
    } catch {
      /* użytkownik zamknął / brak promptu - ignorujemy */
    }
    setDeferred(null)
  }

  return {
    canInstall: Boolean(deferred) && !installed,
    // iOS nie da się „wypromtować" — pokazujemy tylko instrukcję.
    iosHint: isIos() && !installed,
    promptInstall,
  }
}
