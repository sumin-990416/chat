import { useEffect, useState } from 'react'
import {
  collection, addDoc, onSnapshot, doc,
  query, serverTimestamp, where,
  updateDoc, arrayRemove, deleteDoc, getDocs,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useNavigate, useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import './RoomList.css'

export default function RoomList({ user }) {
  const [rooms, setRooms] = useState([])
  const [newRoomName, setNewRoomName] = useState('')
  const [creating, setCreating] = useState(false)
  const { roomId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'rooms'),
      where('members', 'array-contains', user.uid),
    )
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      setRooms(list)
    })
    return unsub
  }, [user])

  const createRoom = async (e) => {
    e.preventDefault()
    const name = newRoomName.trim()
    if (!name) return
    setCreating(true)
    try {
      const docRef = await addDoc(collection(db, 'rooms'), {
        name,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        members: [user.uid],
        inviteCode: uuidv4().replace(/-/g, '').slice(0, 12),
      })
      setNewRoomName('')
      navigate(`/rooms/${docRef.id}`)
    } finally {
      setCreating(false)
    }
  }

  const leaveRoom = async (e, room) => {
    e.stopPropagation()
    if (!window.confirm(`'${room.name}' 방에서 나가시겠습니까?`)) return
    await updateDoc(doc(db, 'rooms', room.id), { members: arrayRemove(user.uid) })
    if (roomId === room.id) navigate('/rooms')
  }

  const deleteRoom = async (e, room) => {
    e.stopPropagation()
    if (!window.confirm(`'${room.name}' 방을 삭제하시겠습니까? 모든 메시지가 사라집니다.`)) return
    // 서브컬렉션 메시지 전체 삭제
    const msgSnap = await getDocs(collection(db, 'rooms', room.id, 'messages'))
    await Promise.all(msgSnap.docs.map(d => deleteDoc(d.ref)))
    await deleteDoc(doc(db, 'rooms', room.id))
    if (roomId === room.id) navigate('/rooms')
  }

  return (
    <div className="room-list">
      <div className="room-list-section">
        <span className="room-list-label">채팅방</span>
      </div>

      <div className="room-list-items">
        {rooms.length === 0 && (
          <p className="room-list-empty">아직 채팅방이 없습니다.</p>
        )}
        {rooms.map(room => (
          <div
            key={room.id}
            className={`room-item ${roomId === room.id ? 'active' : ''}`}
            onClick={() => navigate(`/rooms/${room.id}`)}
          >
            <span className="room-hash">#</span>
            <span className="room-name">{room.name}</span>
            <div className="room-actions">
              <button
                className="room-action-btn"
                onClick={e => leaveRoom(e, room)}
                title="나가기"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
              {room.createdBy === user.uid && (
                <button
                  className="room-action-btn danger"
                  onClick={e => deleteRoom(e, room)}
                  title="삭제"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <form className="room-create" onSubmit={createRoom}>
        <input
          placeholder="새 채팅방 이름"
          value={newRoomName}
          onChange={e => setNewRoomName(e.target.value)}
          maxLength={30}
        />
        <button type="submit" className="btn-primary room-create-btn" disabled={creating}>+</button>
      </form>
    </div>
  )
}
