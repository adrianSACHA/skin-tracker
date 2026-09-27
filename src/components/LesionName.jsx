import { areaContextFor } from '../lib/bodyAreas'

// Nazwa znamienia + (gdy została nadpisana ręcznie) kontekst okolicy ciała,
// np. „Tył · znamię przy łopatce". Dla auto-nazw (`Tył-3`) okolica jest już
// w nazwie, więc nie dublujemy jej — dlatego pokazujemy tylko gdy trzeba.
export default function LesionName({ label, viewName, areaClassName = '' }) {
  const area = areaContextFor(label, viewName)
  if (!area) return label
  return (
    <>
      <span className={areaClassName}>{area} · </span>
      {label}
    </>
  )
}
