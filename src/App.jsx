import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth'
import { auth } from './firebase/config'
import { useUserSync } from './hooks/useUserSync'
import AuthPage from './pages/AuthPage'
import ChatPage from './pages/ChatPage'
import InvitePage from './pages/InvitePage'
import './App.css'

// Google redirect 복귀 후 onAuthStateChanged가 null을 먼저 반환하는 타이밍 문제 해결
// 방법: 로그인 시도 시 localStorage 플래그 저장 → 복귀 시 getRedirectResult 완료 후 구독 시작
function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    let unsubscribe = () => {}

    const subscribe = () => {
      unsubscribe = onAuthStateChanged(auth, (u) => setUser(u ?? null))
    }

    if (localStorage.getItem('googleLoginPending')) {
      // redirect 복귀 케이스: getRedirectResult 먼저 처리 후 구독
      getRedirectResult(auth)
        .catch(() => {})
        .finally(() => {
          localStorage.removeItem('googleLoginPending')
          subscribe()
        })
    } else {
      subscribe()
    }

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
