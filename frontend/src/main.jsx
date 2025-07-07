import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './utils/dataMigration.js' // Auto-cleanup legacy data
import './utils/initializeSettings.js' // Auto-initialize settings
import { TaxRateProvider } from './contexts/TaxRateContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TaxRateProvider>
      <App />
    </TaxRateProvider>
  </React.StrictMode>,
) 