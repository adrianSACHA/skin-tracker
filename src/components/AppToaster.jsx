import { Toaster } from 'sonner'
import { useTheme } from '../context/ThemeContext'

// Globalny system toastów (sonner). Motyw zgodny z przełącznikiem jasny/ciemny.
export default function AppToaster() {
  const { theme } = useTheme()
  return (
    <Toaster
      position="bottom-center"
      theme={theme === 'dark' ? 'dark' : 'light'}
      duration={2500}
      richColors
      closeButton
    />
  )
}
