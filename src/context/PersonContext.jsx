import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'skin-tracker:selected-person'

const PersonContext = createContext(null)

// Wybrany profil ("Ja" / "Syn") trzymany globalnie + w localStorage,
// żeby przetrwał odświeżenie strony.
export function PersonProvider({ children }) {
  const [person, setPersonState] = useState(null)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        setPersonState(JSON.parse(raw))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const setPerson = (nextPerson) => {
    setPersonState(nextPerson)
    if (nextPerson) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPerson))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <PersonContext.Provider value={{ person, setPerson }}>
      {children}
    </PersonContext.Provider>
  )
}

export function usePerson() {
  const ctx = useContext(PersonContext)
  if (!ctx) throw new Error('usePerson musi być użyty wewnątrz <PersonProvider>.')
  return ctx
}
