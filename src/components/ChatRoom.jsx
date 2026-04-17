import { useEffect, useRef, useState } from 'react'
import {
  collection, addDoc, onSnapshot, doc,
  query, orderBy, serverTimestamp, limit,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import { useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import Message from './Message'
import './ChatRoom.css'

const MAX_FILE_MB = 10

export default function ChatRoom({ user }) {
  const { roomId } = useParams()
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [copied, setCopied] = useState(false)
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

  const copyInviteLink = () => {
    if (!room?.inviteCode) return
    const url = `${window.location.origin}/chat/invite/${room.inviteCode}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="chatroom">
      <div className="chatroom-header">
        <span className="chatroom-hash">#</span>
        <span className="chatroom-title">{room?.name ?? '...'}</span>
        <button className="btn-invite" onClick={copyInviteLink} title="초대 링크 복사">
          {copied ? '✅ 복사됨' : '🔗 초대 링크'}
        </button>
      </div>

      <div className="chatroom-messages">
        {messages.length === 0 && (
          <div className="chatroom-empty">아직 메시지가 없습니다. 첫 메시지를 보내보세요!</div>
        )}
        {messages.map((msg, i) => (
          <Message
            key={msg.id}
            msg={msg}
            isOwn={msg.uid === user.uid}
            showAvatar={i === 0 || messages[i - 1]?.uid !== msg.uid}
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
