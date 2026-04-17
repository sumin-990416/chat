import { useState } from 'react'
import {
  signInAnonymously,
  updateProfile,
  GoogleAuthProvider,
  signInWithRedirect,
} from 'firebase/auth'
import { auth } from '../firebase/config'
import './AuthPage.css'

const googleProvider = new GoogleAuthProvider()

export default function AuthPage() {
  const [mode, setMode] = useState('google')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      // localStorage 플래그 저장 → 복귀 시 App.jsx에서 감지해 로그인 페이지 플래시 방지
      localStorage.setItem('googleLoginPending', '1')
      await signInWithRedirect(auth, googleProvider)
    } catch (err) {
      localStorage.removeItem('googleLoginPending')
      setError(`Google 로그인에 실패했습니다. (${err.code})`)
      setLoading(false)
    }
  }

  const handleAnonymous = async (e) => {
    e.preventDefault()
    setError('')
    if (!nickname.trim()) { setError('닉네임을 입력해주세요.'); return }
    setLoading(true)
    try {
      const { user } = await signInAnonymously(auth)
      await updateProfile(user, { displayName: nickname.trim() })
    } catch {
      setError('익명 로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">💬 채팅</h1>
        <p className="auth-subtitle">실시간 채팅 서비스</p>

        <div className="auth-tabs">
          <button className={mode === 'google' ? 'active' : ''} onClick={() => { setMode('google'); setError('') }}>Google 로그인</button>
          <button className={mode === 'anonymous' ? 'active' : ''} onClick={() => { setMode('anonymous'); setError('') }}>익명</button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {mode === 'google' && (
          <div className="auth-form">
            <button type="button" className="btn-google" onClick={handleGoogle} disabled={loading}>
              <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.7-3.3-11.3-8H6.3C9.7 35.7 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.4-2.5 4.5-4.6 5.9l6.2 5.2C42.8 36.3 44 30.6 44 24c0-1.2-.1-2.4-.4-3.5z"/></svg>
              {loading ? '로그인 중...' : 'Google로 로그인'}
            </button>
          </div>
        )}

        {mode === 'anonymous' && (
          <form onSubmit={handleAnonymous} className="auth-form">
            <input type="text" placeholder="사용할 닉네임" value={nickname} onChange={e => setNickname(e.target.value)} required maxLength={20} />
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? '입장 중...' : '익명으로 입장'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
