import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/react'
import App from './App.jsx'
import './motif.css'

// Clerk's redirect props take router paths, so the provider sits inside
// BrowserRouter. The publishable key comes from VITE_CLERK_PUBLISHABLE_KEY —
// Vite only exposes variables with the VITE_ prefix to browser code.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
)
