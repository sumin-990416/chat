import { useEffect, useState } from 'react'
import {
  collection, addDoc, onSnapshot,
  query, serverTimestamp, where,
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
          <button
            key={room.id}
            className={`room-item ${roomId === room.id ? 'active' : ''}`}
            onClick={() => navigate(`/rooms/${room.id}`)}
          >
            <span className="room-hash">#</span>
            <span className="room-name">{room.name}</span>
          </button>
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
