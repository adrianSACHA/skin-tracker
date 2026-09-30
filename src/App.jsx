import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AuthGate from './components/AuthGate'
import Layout from './components/Layout'
import PersonSelector from './components/PersonSelector'
import BodyMap from './components/BodyMap'
import Reminders from './components/Reminders'
import { PersonProvider } from './context/PersonContext'
import AppToaster from './components/AppToaster'

// LesionDetail importuje Recharts (wykres trendu rozmiaru) - ładowany
// leniwie, żeby nie powiększać początkowego bundle'a.
const LesionDetail = lazy(() => import('./components/LesionDetail'))

// Flow: logowanie (AuthGate) -> wybór osoby -> mapa ciała -> szczegóły znamienia.
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
              {/* Zagnieżdżone trasy pod osobą - czytelna hierarchia */}
              <Route path="/person/:personId">
                <Route index element={<BodyMap />} />
                {/* „Lista znamion” została wchłonięta przez Kontrole (ticket 14):
                    stary adres przekierowujemy, żeby zakładki i historia
                    przeglądarki dalej działały. */}
                <Route path="list" element={<Navigate to="reminders" replace />} />
                <Route path="reminders" element={<Reminders />} />
                <Route path="lesion/:lesionId" element={<LesionDetail />} />
              </Route>
              {/* Nieznany adres -> ekran wyboru osoby.
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
