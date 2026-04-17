import { useState, useRef } from 'react'
import { updateProfile } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, setDoc } from 'firebase/firestore'
import { auth, storage, db } from '../firebase/config'
import './ProfileModal.css'

function getInitial(name) { return (name || '?')[0].toUpperCase() }

export default function ProfileModal({ user, onClose }) {
  const [name, setName] = useState(user.displayName || '')
  const [preview, setPreview] = useState(user.photoURL || '')
  const [photoFile, setPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('5MB 이하 이미지만 가능합니다.'); return }
    setPhotoFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      let photoURL = user.photoURL || ''
      if (photoFile) {
        const storageRef = ref(storage, `profiles/${user.uid}/avatar`)
        await uploadBytes(storageRef, photoFile)
        photoURL = await getDownloadURL(storageRef)
      }
      await updateProfile(auth.currentUser, { displayName: name.trim(), photoURL })
      if (!user.isAnonymous) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          displayName: name.trim(),
          photoURL,
          email: user.email || '',
        }, { merge: true })
      }
      onClose()
    } catch (err) {
      console.error(err)
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="profile-modal">
        <div className="profile-modal-header">
          <h2>프로필 편집</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="profile-form">
          <div className="profile-photo-wrap">
            <div className="profile-photo-btn" onClick={() => fileRef.current?.click()}>
              {preview
                ? <img src={preview} alt="프로필" className="profile-photo-img" />
                : <span className="profile-initial">{getInitial(name)}</span>
              }
              <div className="profile-photo-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            </div>
            <input type="file" ref={fileRef} accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <p className="profile-photo-hint">클릭하여 사진 변경</p>
          </div>
          <label className="profile-label">
            <span>닉네임</span>
            <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={20} required />
          </label>
          <div className="profile-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>취소</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
