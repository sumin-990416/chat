import { useEffect, useRef, useState } from 'react'
import {
  collection, addDoc, onSnapshot, doc,
  query, orderBy, serverTimestamp, limit,
  getDocs, updateDoc, arrayUnion,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import { useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import Message from './Message'
import './ChatRoom.css'

const MAX_FILE_MB = 10

export default function ChatRoom({ user, onClose }) {
  const { roomId } = useParams()
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteSearch, setInviteSearch] = useState('')
  const [inviteResults, setInviteResults] = useState([])
  const [friends, setFriends] = useState([])
  const [filesOpen, setFilesOpen] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  /* 방 정보 구독 */
  useEffect(() => {
    if (!roomId) return
    const unsub = onSnapshot(doc(db, 'rooms', roomId), (snap) => {
      if (snap.exists()) setRoom({ id: snap.id, ...snap.data() })
    })
    return unsub
  }, [roomId])

  /* 메시지 구독 */
  useEffect(() => {
    if (!roomId) return
    const q = query(
      collection(db, 'rooms', roomId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(200),
    )
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [roomId])

  /* 친구 목록 */
  useEffect(() => {
    return onSnapshot(collection(db, 'users', user.uid, 'friends'), snap =>
      setFriends(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [user.uid])

  /* 읽음 처리 */
  useEffect(() => {
    if (!roomId || !user.uid) return
    const msgRef = collection(db, 'rooms', roomId, 'messages')
    const unsub = onSnapshot(query(msgRef, orderBy('createdAt', 'asc'), limit(200)), (snap) => {
      snap.docs.forEach(d => {
        const data = d.data()
        const readBy = data.readBy || []
        if (!readBy.includes(user.uid)) {
          updateDoc(d.ref, { readBy: arrayUnion(user.uid) }).catch(() => {})
        }
      })
    })
    return unsub
  }, [roomId, user.uid])

  /* 불필요한 파일 목록 */
  const fileMessages = messages.filter(m => m.type === 'file' || m.type === 'image')

  /* 스크롤 아래로 */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')
    try {
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        type: 'text',
        content,
        uid: user.uid,
        displayName: user.displayName || '익명',
        createdAt: serverTimestamp(),
      })
    } finally {
      setSending(false)
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      alert(`파일 크기는 ${MAX_FILE_MB}MB 이하만 가능합니다.`)
      return
    }

    const ext = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${ext}`
    const storageRef = ref(storage, `uploads/${roomId}/${fileName}`)

    setUploadProgress(0)
    try {
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      const isImage = file.type.startsWith('image/')

      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        type: isImage ? 'image' : 'file',
        content: url,
        fileName: file.name,
        fileSize: file.size,
        uid: user.uid,
        displayName: user.displayName || '익명',
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      alert('파일 업로드에 실패했습니다.')
      console.error(err)
    } finally {
      setUploadProgress(null)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  const handleInviteSearch = (val) => {
    setInviteSearch(val)
    if (!val.trim()) { setInviteResults([]); return }
    const members = room?.members || []
    const results = friends.filter(f =>
      !members.includes(f.uid || f.id) &&
      (f.displayName || '').toLowerCase().includes(val.toLowerCase())
    )
    setInviteResults(results)
  }

  const inviteFriend = async (friend) => {
    const friendUid = friend.uid || friend.id
    await updateDoc(doc(db, 'rooms', roomId), {
      members: arrayUnion(friendUid)
    })
    setInviteSearch('')
    setInviteResults([])
  }

  const filteredMessages = searchQuery.trim()
    ? messages.filter(m =>
        m.type === 'text'
          ? m.content.toLowerCase().includes(searchQuery.toLowerCase())
          : m.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages

  return (
    <div className="chatroom">
      <div className="chatroom-header">
        <span className="chatroom-hash">#</span>
        <span className="chatroom-title">{room?.name ?? '...'}</span>
        <button className={`btn-invite ${inviteOpen ? 'active' : ''}`} onClick={() => setInviteOpen(o => !o)} title="친구 초대">
          👥 초대
        </button>
        <button
          className={`chatroom-icon-btn ${searchOpen ? 'active' : ''}`}
          onClick={() => { setSearchOpen(s => !s); setSearchQuery('') }}
          title="검색"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button
          className={`chatroom-icon-btn ${filesOpen ? 'active' : ''}`}
          onClick={() => setFilesOpen(o => !o)}
          title="파일 목록"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        </button>
        {onClose && (
          <button className="chatroom-icon-btn" onClick={onClose} title="닫기">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {searchOpen && (
        <div className="chatroom-search-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            autoFocus
            placeholder="메시지 또는 파일명 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <span className="search-count">
              {filteredMessages.length}건
            </span>
          )}
        </div>
      )}

      {inviteOpen && (
        <div className="invite-modal-backdrop" onClick={() => setInviteOpen(false)}>
          <div className="invite-modal" onClick={e => e.stopPropagation()}>
            <div className="invite-modal-header">
              <h3>👥 친구 초대</h3>
              <button className="invite-modal-close" onClick={() => setInviteOpen(false)}>✕</button>
            </div>
            <div className="invite-modal-body">
              <input
                autoFocus
                placeholder="친구 이름으로 검색..."
                value={inviteSearch}
                onChange={e => handleInviteSearch(e.target.value)}
              />
              {inviteResults.length > 0 && (
                <div className="invite-results">
                  {inviteResults.map(f => (
                    <div key={f.id} className="invite-item">
                      <span>{f.displayName}</span>
                      <button onClick={() => inviteFriend(f)}>초대</button>
                    </div>
                  ))}
                </div>
              )}
              {inviteSearch && inviteResults.length === 0 && (
                <p className="invite-empty">초대할 친구가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {filesOpen && (
        <div className="chatroom-files-panel">
          <div className="files-panel-header">📁 전송된 파일 ({fileMessages.length})</div>
          <div className="files-panel-list">
            {fileMessages.length === 0 && <p className="files-empty">전송된 파일이 없습니다.</p>}
            {fileMessages.map(m => (
              <a key={m.id} className="files-item" href={m.content} target="_blank" rel="noreferrer">
                <span className="files-icon">{m.type === 'image' ? '🖼️' : '📄'}</span>
                <span className="files-info">
                  <span className="files-name">{m.fileName || '이미지'}</span>
                  <span className="files-sender">{m.displayName}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="chatroom-messages">
        {filteredMessages.length === 0 && (
          <div className="chatroom-empty">
            {searchQuery ? '검색 결과가 없습니다.' : '아직 메시지가 없습니다. 첫 메시지를 보내보세요!'}
          </div>
        )}
        {filteredMessages.map((msg, i) => (
          <Message
            key={msg.id}
            msg={msg}
            isOwn={msg.uid === user.uid}
            showAvatar={i === 0 || filteredMessages[i - 1]?.uid !== msg.uid}
            memberCount={room?.members?.length || 1}
            readCount={msg.readBy?.length || 0}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {uploadProgress !== null && (
        <div className="upload-progress">
          <div className="upload-bar" style={{ width: `${uploadProgress}%` }} />
          <span>업로드 중...</span>
        </div>
      )}

      <form className="chatroom-input-area" onSubmit={sendMessage}>
        <button
          type="button"
          className="btn-attach"
          onClick={() => fileInputRef.current?.click()}
          title="파일/이미지 첨부"
        >
          📎
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
        <textarea
          className="chatroom-input"
          placeholder="메시지를 입력하세요... (Shift+Enter: 줄바꿈)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={2000}
        />
        <button type="submit" className="btn-send" disabled={!text.trim() || sending}>
          ➤
        </button>
      </form>
    </div>
  )
}
