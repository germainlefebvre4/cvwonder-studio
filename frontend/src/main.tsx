import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/Tooltip'
import '@/app/globals.css'
import LandingPage from '@/app/page'
import StudioPage from '@/app/studio/page'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/studio/:token" element={<StudioPage />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </StrictMode>,
)
