import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import RoomList from '../components/RoomList'
import ChatRoom from '../components/ChatRoom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useTheme } from '../context/ThemeContext'
import './ChatPage.css'

export default function ChatPage({ user }) {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  return (
    <div className="chat-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">💬</span>
          <div className="sidebar-user">
            <span className="sidebar-nickname">{user.displayName || '익명'}</span>
            <span className="sidebar-email">{user.isAnonymous ? '익명 사용자' : user.email}</span>
          </div>
          <button className="btn-ghost sidebar-icon-btn" onClick={toggle} title="테마 전환">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn-ghost sidebar-icon-btn" onClick={handleLogout} title="로그아웃">↪</button>
        </div>
        <RoomList user={user} />
      </aside>

      <main className="chat-main">
        <Routes>
          <Route index element={<EmptyState />} />
          <Route path=":roomId" element={<ChatRoom user={user} />} />
        </Routes>
      </main>
    </div>
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
