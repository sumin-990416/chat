import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'
import AuthPage from './pages/AuthPage'
import ChatPage from './pages/ChatPage'
import './App.css'

function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u))
    return unsubscribe
  }, [])

  if (user === undefined) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <BrowserRouter basename="/chat">
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/rooms" replace /> : <AuthPage />}
        />
        <Route
          path="/rooms/*"
          element={user ? <ChatPage user={user} /> : <Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
