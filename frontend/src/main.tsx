import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRouter from './AppRouter.tsx'

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

import { CssBaseline } from '@mui/material'
import { BrowserRouter } from "react-router"
import { ThemeContextProvider } from './theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeContextProvider>
      <CssBaseline />
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ThemeContextProvider>
  </StrictMode>,
)
