import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
// Rejestruje web component <add-to-calendar-button>.
import 'add-to-calendar-button'
import App from './App.jsx'
import './index.css'

// HashRouter: na GitHub Pages (bez backendu) nie wymaga żadnych przekierowań
// ani pliku 404.html - odświeżenie dowolnego widoku działa od razu.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
