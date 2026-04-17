import { useEffect } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useUserSync(user) {
  useEffect(() => {
    if (!user || user.isAnonymous) return
    setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      email: user.email || '',
    }, { merge: true }).catch(console.error)
  }, [user?.uid, user?.displayName, user?.photoURL])
}
