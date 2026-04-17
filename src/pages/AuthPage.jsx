import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInAnonymously,
} from 'firebase/auth'
import { auth } from '../firebase/config'
import './AuthPage.css'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // login | register | anonymous
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => { setEmail(''); setPassword(''); setNickname(''); setError('') }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!nickname.trim()) { setError('닉네임을 입력해주세요.'); return }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(user, { displayName: nickname.trim() })
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('이미 사용 중인 이메일입니다.')
      else setError('회원가입에 실패했습니다.')
    } finally {
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
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); reset() }}>로그인</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); reset() }}>회원가입</button>
          <button className={mode === 'anonymous' ? 'active' : ''} onClick={() => { setMode('anonymous'); reset() }}>익명</button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="auth-form">
            <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? '로그인 중...' : '로그인'}</button>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="auth-form">
            <input type="text" placeholder="닉네임" value={nickname} onChange={e => setNickname(e.target.value)} required maxLength={20} />
            <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? '가입 중...' : '회원가입'}</button>
          </form>
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
