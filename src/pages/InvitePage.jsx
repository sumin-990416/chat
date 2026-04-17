import { useEffect, useState } from 'react'
import {
  collection, query, where, limit,
  getDocs, updateDoc, doc, arrayUnion,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useParams, useNavigate } from 'react-router-dom'
import './InvitePage.css'

export default function InvitePage({ user }) {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const findRoom = async () => {
      try {
        const q = query(
          collection(db, 'rooms'),
          where('inviteCode', '==', inviteCode),
          limit(1),
        )
        const snap = await getDocs(q)
        if (snap.empty) {
          setError('유효하지 않은 초대 링크입니다.')
        } else {
          const roomData = { id: snap.docs[0].id, ...snap.docs[0].data() }
          setRoom(roomData)
          // 이미 멤버면 바로 이동
          if (roomData.members?.includes(user.uid)) {
            navigate(`/rooms/${roomData.id}`, { replace: true })
          }
        }
      } catch {
        setError('오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }
    findRoom()
  }, [inviteCode, user.uid, navigate])

  const handleJoin = async () => {
    setJoining(true)
    try {
      await updateDoc(doc(db, 'rooms', room.id), {
        members: arrayUnion(user.uid),
      })
      navigate(`/rooms/${room.id}`, { replace: true })
    } catch {
      setError('참여에 실패했습니다.')
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="invite-screen">
        <div className="spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="invite-screen">
        <div className="invite-card">
          <div className="invite-icon">❌</div>
          <h2>{error}</h2>
          <button className="btn-primary" onClick={() => navigate('/rooms')}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="invite-screen">
      <div className="invite-card">
        <div className="invite-icon">💬</div>
        <p className="invite-label">채팅방 초대</p>
        <h2 className="invite-room-name"># {room?.name}</h2>
        <p className="invite-desc">
          <strong>{user.displayName || '익명'}</strong> 님, 이 채팅방에 입장하시겠습니까?
        </p>
        <div className="invite-actions">
          <button className="btn-ghost" onClick={() => navigate('/rooms')}>취소</button>
          <button className="btn-primary" onClick={handleJoin} disabled={joining}>
            {joining ? '입장 중...' : '입장하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
