import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import AuthGate from './components/AuthGate'
import Layout from './components/Layout'
import PersonSelector from './components/PersonSelector'
import BodyMap from './components/BodyMap'
import LesionsList from './components/LesionsList'
import { PersonProvider } from './context/PersonContext'
import AppToaster from './components/AppToaster'

// LesionDetail importuje Recharts (wykres trendu rozmiaru) - ładowany
// leniwie, żeby nie powiększać początkowego bundle'a.
const LesionDetail = lazy(() => import('./components/LesionDetail'))

// Flow: logowanie (AuthGate) -> wybór profilu -> mapa ciała -> szczegóły znamienia.
export default function App() {
  return (
    <AuthGate>
      <PersonProvider>
        <AppToaster />
        <Layout>
          <Suspense
            fallback={
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Wczytywanie widoku…
              </p>
            }
          >
            <Routes>
              <Route path="/" element={<PersonSelector />} />
              {/* Zagnieżdżone trasy pod profilem - czytelna hierarchia */}
              <Route path="/person/:personId">
                <Route index element={<BodyMap />} />
                <Route path="list" element={<LesionsList />} />
                <Route path="lesion/:lesionId" element={<LesionDetail />} />
              </Route>
              {/* Nieznany adres -> ekran wyboru profilu.
                  Celowo BEZ <Navigate replace> - taki redirect podmieniał wpis
                  w historii i psuł "wstecz" (pkt 7). */}
              <Route path="*" element={<PersonSelector />} />
            </Routes>
          </Suspense>
        </Layout>
      </PersonProvider>
    </AuthGate>
  )
}
