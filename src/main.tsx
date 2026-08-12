import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import AppRoutes from './AppRoutes.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* The consent banner lives inside AppRoutes now: it has to know the
          current route so it can stay off the operations dashboard. */}
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>,
)
