import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth'
import { auth } from './firebase/config'
import { useUserSync } from './hooks/useUserSync'
import AuthPage from './pages/AuthPage'
import ChatPage from './pages/ChatPage'
import InvitePage from './pages/InvitePage'
import GoogleAuthPage from './pages/GoogleAuthPage'
import './App.css'

function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    let unsubscribe = () => {}
    // getRedirectResult를 먼저 처리한 뒤 onAuthStateChanged 구독
    // 순서를 지키지 않으면 redirect 복귀 시 null이 먼저 와서 로그인 페이지로 튕김
    getRedirectResult(auth)
      .catch(() => {})
      .finally(() => {
        unsubscribe = onAuthStateChanged(auth, (u) => setUser(u ?? null))
      })
    return () => unsubscribe()
  }, [])

  useUserSync(user)

  if (user === undefined) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/rooms" replace /> : <AuthPage />}
        />
        <Route
          path="/auth-google"
          element={<GoogleAuthPage />}
        />
        <Route
          path="/invite/:inviteCode"
          element={user ? <InvitePage user={user} /> : <AuthPage />}
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
