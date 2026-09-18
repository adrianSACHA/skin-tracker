import { useEffect, useState } from 'react'
import { getSignedUrl } from '../lib/uploadPhoto'

// Rozwiązuje ścieżkę w prywatnym bucketcie na tymczasowy signed URL
// i wyświetla obrazek. Przy błędzie/braku ścieżki pokazuje placeholder.
export default function SignedImage({
  path,
  alt = '',
  className = '',
  style,
  ...rest
}) {
  const [url, setUrl] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | ready | error

  useEffect(() => {
    let active = true

    if (!path) {
      setUrl(null)
      setStatus('idle')
      return undefined
    }

    setStatus('loading')
    getSignedUrl(path)
      .then((signed) => {
        if (!active) return
        setUrl(signed)
        setStatus('ready')
      })
      .catch(() => {
        if (!active) return
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [path])

  if (status === 'error') {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-xs text-slate-400 dark:bg-slate-800 dark:text-slate-500 ${className}`}
        style={style}
      >
        Nie udało się wczytać zdjęcia
      </div>
    )
  }

  if (!url) {
    return (
      <div
        className={`animate-pulse bg-slate-100 dark:bg-slate-800 ${className}`}
        style={style}
        aria-hidden="true"
      />
    )
  }

  return (
    <img src={url} alt={alt} className={className} style={style} {...rest} />
  )
}
