import { useEffect } from 'react'
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth'
import { auth } from '../firebase/config'

const googleProvider = new GoogleAuthProvider()

// 이 페이지는 새 탭에서 열려 Google 로그인을 처리하고 자동으로 닫힘
// 원본 탭은 onAuthStateChanged로 로그인 상태를 감지
export default function GoogleAuthPage() {
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // 로그인 성공 → 탭 닫기
          window.close()
        } else {
          // 아직 redirect 안 된 상태 → Google로 redirect
          signInWithRedirect(auth, googleProvider)
        }
      })
      .catch(() => {
        // 에러 시에도 탭 닫기
        window.close()
      })
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '16px',
      fontFamily: 'sans-serif',
      color: '#555'
    }}>
      <div style={{
        width: 40, height: 40,
        border: '4px solid #eee',
        borderTop: '4px solid #4285F4',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p>Google 로그인 처리 중...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
