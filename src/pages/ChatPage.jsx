import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import RoomList from '../components/RoomList'
import ChatRoom from '../components/ChatRoom'
import FriendList from '../components/FriendList'
import ProfileModal from '../components/ProfileModal'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useTheme } from '../context/ThemeContext'
import './ChatPage.css'

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

export default function ChatPage({ user }) {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const [tab, setTab] = useState('rooms')
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  return (
    <div className="chat-wrapper">
      <div className="chat-card">
        <aside className="sidebar">
        <div className="sidebar-header">
          <button className="sidebar-avatar-btn" onClick={() => setProfileOpen(true)}>
            {user.photoURL
              ? <img src={user.photoURL} alt="" className="sidebar-avatar-img" />
              : <span>{(user.displayName || '?')[0].toUpperCase()}</span>
            }
          </button>
          <div className="sidebar-user">
            <span className="sidebar-nickname">{user.displayName || '익명'}</span>
            <span className="sidebar-email">{user.isAnonymous ? '익명 사용자' : user.email}</span>
          </div>
          <button className="sidebar-icon-btn" onClick={toggle} title="테마 전환">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="sidebar-icon-btn" onClick={handleLogout} title="로그아웃">
            <LogoutIcon />
          </button>
        </div>

        <div className="sidebar-tabs">
          <button className={tab === 'rooms' ? 'active' : ''} onClick={() => setTab('rooms')}>채팅방</button>
          <button className={tab === 'friends' ? 'active' : ''} onClick={() => setTab('friends')}>친구</button>
        </div>

        {tab === 'rooms' && <RoomList user={user} />}
        {tab === 'friends' && <FriendList user={user} />}
      </aside>

      <main className="chat-bg">
        <Routes>
          <Route index element={<EmptyState />} />
          <Route path=":roomId" element={<ChatRoomModal user={user} />} />
        </Routes>
      </main>

      {profileOpen && <ProfileModal user={user} onClose={() => setProfileOpen(false)} />}
      </div>
    </div>
  )
}

function ChatRoomModal({ user }) {
  const navigate = useNavigate()
  return (
    <>
      <div className="chat-backdrop" onClick={() => navigate('/rooms')} />
      <div className="chat-modal">
        <ChatRoom user={user} onClose={() => navigate('/rooms')} />
      </div>
    </>
  )
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">💬</div>
      <h2>채팅방을 선택하세요</h2>
      <p>왼쪽에서 방을 선택하거나 새로운 방을 만들어보세요.</p>
    </div>
  )
}
