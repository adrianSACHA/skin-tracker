import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AuthGate from './components/AuthGate'
import Layout from './components/Layout'
import PersonSelector from './components/PersonSelector'
import BodyMap from './components/BodyMap'
import LesionsList from './components/LesionsList'
import { PersonProvider } from './context/PersonContext'

// LesionDetail importuje Recharts (wykres trendu rozmiaru) - ładowany
// leniwie, żeby nie powiększać początkowego bundle'a.
const LesionDetail = lazy(() => import('./components/LesionDetail'))

// Flow: logowanie (AuthGate) -> wybór profilu -> mapa ciała -> szczegóły znamienia.
export default function App() {
  return (
    <AuthGate>
      <PersonProvider>
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
              <Route path="/person/:personId" element={<BodyMap />} />
              <Route path="/person/:personId/list" element={<LesionsList />} />
              <Route
                path="/person/:personId/lesion/:lesionId"
                element={<LesionDetail />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </PersonProvider>
    </AuthGate>
  )
}
