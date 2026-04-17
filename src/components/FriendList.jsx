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
  const [searchName, setSearchName] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [pendingIn, setPendingIn] = useState([])
  const [friends, setFriends] = useState([])
  const [modalOpen, setModalOpen] = useState(false)

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
    const name = searchName.trim()
    if (!name) return
    setSearching(true)
    setSearchResults(null)
    try {
      const snap = await getDocs(collection(db, 'users'))
      const results = snap.docs
        .filter(d => d.id !== user.uid && (d.data().displayName || '').toLowerCase().includes(name.toLowerCase()))
        .map(d => ({ id: d.id, ...d.data() }))
      setSearchResults(results)
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
    setSearchResults(null)
    setSearchName('')
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

  const closeModal = () => {
    setModalOpen(false)
    setSearchName('')
    setSearchResults(null)
  }

  return (
    <div className="friend-list">
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

      <button className="f-add-friend-btn" onClick={() => setModalOpen(true)}>+ 친구 추가</button>

      {modalOpen && (
        <div className="f-modal-backdrop" onClick={closeModal}>
          <div className="f-modal" onClick={e => e.stopPropagation()}>
            <div className="f-modal-header">
              <h3>친구 추가</h3>
              <button className="f-modal-close" onClick={closeModal}>✕</button>
            </div>
            <form className="f-modal-search" onSubmit={handleSearch}>
              <input
                autoFocus
                type="text"
                placeholder="이름으로 검색..."
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
              />
              <button type="submit" className="btn-primary f-search-btn" disabled={searching}>
                {searching ? '...' : '검색'}
              </button>
            </form>
            <div className="f-modal-results">
              {searchResults !== null && searchResults.length === 0 && (
                <p className="f-not-found">사용자를 찾을 수 없습니다.</p>
              )}
              {searchResults && searchResults.length > 0 && searchResults.map(result => (
                <div key={result.id} className="f-result">
                  <Avatar photoURL={result.photoURL} name={result.displayName} />
                  <span className="f-name">{result.displayName}</span>
                  <button className="btn-primary f-add-btn" onClick={() => sendRequest(result)}>추가</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
