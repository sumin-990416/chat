import { useState, useEffect } from 'react'
import {
  collection, query, where, getDocs,
  addDoc, onSnapshot, doc, updateDoc,
  setDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import './FriendList.css'

function Avatar({ photoURL, name, size = 32 }) {
  const initial = (name || '?')[0].toUpperCase()
  return (
    <div className="f-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {photoURL ? <img src={photoURL} alt="" /> : <span>{initial}</span>}
    </div>
  )
}

export default function FriendList({ user }) {
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResult, setSearchResult] = useState(null) // null | false | userObj
  const [searching, setSearching] = useState(false)
  const [pendingIn, setPendingIn] = useState([])
  const [friends, setFriends] = useState([])

  // 받은 친구 요청
  useEffect(() => {
    const q = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', user.uid),
      where('status', '==', 'pending'),
    )
    return onSnapshot(q, snap => setPendingIn(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [user.uid])

  // 친구 목록
  useEffect(() => {
    return onSnapshot(collection(db, 'users', user.uid, 'friends'), snap =>
      setFriends(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [user.uid])

  const handleSearch = async (e) => {
    e.preventDefault()
    const email = searchEmail.trim().toLowerCase()
    if (!email) return
    setSearching(true)
    setSearchResult(null)
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email)))
      if (snap.empty || snap.docs[0].id === user.uid) {
        setSearchResult(false)
      } else {
        setSearchResult({ id: snap.docs[0].id, ...snap.docs[0].data() })
      }
    } finally {
      setSearching(false)
    }
  }

  const sendRequest = async (target) => {
    const existing = await getDocs(query(
      collection(db, 'friendRequests'),
      where('fromUid', '==', user.uid),
      where('toUid', '==', target.id),
    ))
    if (!existing.empty) { alert('이미 요청을 보냈습니다.'); return }
    const alreadyFriend = friends.some(f => f.id === target.id)
    if (alreadyFriend) { alert('이미 친구입니다.'); return }

    await addDoc(collection(db, 'friendRequests'), {
      fromUid: user.uid,
      toUid: target.id,
      fromName: user.displayName || '익명',
      fromPhoto: user.photoURL || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    })
    setSearchResult(null)
    setSearchEmail('')
    alert('친구 요청을 보냈습니다!')
  }

  const acceptRequest = async (req) => {
    await updateDoc(doc(db, 'friendRequests', req.id), { status: 'accepted' })
    await Promise.all([
      setDoc(doc(db, 'users', user.uid, 'friends', req.fromUid), {
        uid: req.fromUid,
        displayName: req.fromName,
        photoURL: req.fromPhoto || '',
        addedAt: serverTimestamp(),
      }),
      setDoc(doc(db, 'users', req.fromUid, 'friends', user.uid), {
        uid: user.uid,
        displayName: user.displayName || '익명',
        photoURL: user.photoURL || '',
        addedAt: serverTimestamp(),
      }),
    ])
  }

  const rejectRequest = async (req) => {
    await updateDoc(doc(db, 'friendRequests', req.id), { status: 'rejected' })
  }

  return (
    <div className="friend-list">
      <form className="friend-search-form" onSubmit={handleSearch}>
        <input
          type="email"
          placeholder="이메일로 친구 찾기"
          value={searchEmail}
          onChange={e => setSearchEmail(e.target.value)}
        />
        <button type="submit" className="btn-primary f-search-btn" disabled={searching}>
          {searching ? '...' : '검색'}
        </button>
      </form>

      {searchResult === false && (
        <p className="f-not-found">사용자를 찾을 수 없습니다.</p>
      )}
      {searchResult && (
        <div className="f-result">
          <Avatar photoURL={searchResult.photoURL} name={searchResult.displayName} />
          <span className="f-name">{searchResult.displayName}</span>
          <button className="btn-primary f-add-btn" onClick={() => sendRequest(searchResult)}>추가</button>
        </div>
      )}

      {pendingIn.length > 0 && (
        <div className="f-section">
          <span className="f-section-label">친구 요청 ({pendingIn.length})</span>
          {pendingIn.map(req => (
            <div key={req.id} className="f-item">
              <Avatar photoURL={req.fromPhoto} name={req.fromName} />
              <span className="f-name">{req.fromName}</span>
              <div className="f-req-actions">
                <button className="f-accept-btn" onClick={() => acceptRequest(req)} title="수락">✓</button>
                <button className="f-reject-btn" onClick={() => rejectRequest(req)} title="거절">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="f-section">
        <span className="f-section-label">친구 {friends.length}명</span>
        {friends.length === 0 && <p className="f-empty">아직 친구가 없습니다.</p>}
        {friends.map(f => (
          <div key={f.id} className="f-item">
            <Avatar photoURL={f.photoURL} name={f.displayName} />
            <span className="f-name">{f.displayName}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
