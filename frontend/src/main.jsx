import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import AppContextProvider from './Context/AppContext.jsx'
import ChatProvider from './Context/ChatContext.jsx'
import App from './App.jsx'
import './index.css'

/**
 * VITE_GOOGLE_CLIENT_ID must be set in frontend/.env for Google OAuth to work.
 * If not set, the GoogleOAuthProvider wraps silently and the "Continue with Google"
 * button will show an error when clicked (graceful degradation).
 */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AppContextProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </AppContextProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>
)