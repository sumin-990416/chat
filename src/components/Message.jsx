import './Message.css'

function formatTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function getInitial(name = '?') {
  const cleaned = name.replace(/[\[\](){}]/g, '').trim()
  return (cleaned || '?').charAt(0).toUpperCase()
}

export default function Message({ msg, isOwn, showAvatar, memberCount, readCount }) {
  const unread = memberCount > 1 ? memberCount - readCount : 0

  return (
    <div className={`message ${isOwn ? 'own' : ''} ${showAvatar ? 'show-avatar' : ''}`}>
      {!isOwn && (
        <div className="avatar" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
          {getInitial(msg.displayName)}
        </div>
      )}
      <div className="message-body">
        {showAvatar && !isOwn && (
          <div className="message-meta">
            <span className="message-name">{msg.displayName}</span>
          </div>
        )}
        <div className="bubble-row">
          {isOwn && (
            <div className="bubble-side">
              {unread > 0 && <span className="unread-count">{unread}</span>}
              <span className="bubble-time">{formatTime(msg.createdAt)}</span>
            </div>
          )}
          {msg.type === 'text' && (
            <div className="bubble text-bubble">
              <p>{msg.content}</p>
            </div>
          )}
          {msg.type === 'image' && (
            <div className="bubble image-bubble">
              <img src={msg.content} alt="이미지" style={{ maxWidth: '280px', maxHeight: '280px', borderRadius: '8px', display: 'block' }} />
            </div>
          )}
          {!isOwn && (
            <div className="bubble-side">
              {unread > 0 && <span className="unread-count">{unread}</span>}
              <span className="bubble-time">{formatTime(msg.createdAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
