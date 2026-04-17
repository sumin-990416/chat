import { useEffect, useState } from 'react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../firebase/config'

const googleProvider = new GoogleAuthProvider()

// 이 페이지는 새 탭에서 열려 signInWithPopup으로 Google 로그인 처리 후 자동으로 닫힘
// 새 탭(window.open으로 열림)은 COOP 제한 없이 popup 사용 가능
export default function GoogleAuthPage() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    signInWithPopup(auth, googleProvider)
      .then(() => {
        setStatus('success')
        window.close()
      })
      .catch((err) => {
        if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
          setStatus('cancelled')
        } else {
          setStatus('error')
        }
        setTimeout(() => window.close(), 1500)
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
