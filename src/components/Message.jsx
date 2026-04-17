import './Message.css'

function formatTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function getInitial(name = '?') {
  return name.charAt(0).toUpperCase()
}

export default function Message({ msg, isOwn, showAvatar, memberCount, readCount }) {
  return (
    <div className={`message ${isOwn ? 'own' : ''} ${showAvatar ? 'show-avatar' : ''}`}>
      {!isOwn && (
        <div className="avatar" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
          {getInitial(msg.displayName)}
        </div>
      )}
      <div className="message-body">
        {showAvatar && (
          <div className="message-meta">
            <span className="message-name">{msg.displayName}</span>
            <span className="message-time">{formatTime(msg.createdAt)}</span>
          </div>
        )}
        {msg.type === 'text' && (
          <div className="bubble text-bubble">
            <p>{msg.content}</p>
            <div className="bubble-footer">
              {memberCount > 1 && <span className="read-count">{readCount}/{memberCount}</span>}
              <span className="bubble-time">{formatTime(msg.createdAt)}</span>
            </div>
          </div>
        )}
        {msg.type === 'image' && (
          <div className="bubble image-bubble">
            <a href={msg.content} target="_blank" rel="noreferrer">
              <img src={msg.content} alt={msg.fileName || '이미지'} />
            </a>
            <div className="bubble-footer">
              {memberCount > 1 && <span className="read-count">{readCount}/{memberCount}</span>}
              <span className="bubble-time">{formatTime(msg.createdAt)}</span>
            </div>
          </div>
        )}
        {msg.type === 'file' && (
          <div className="bubble file-bubble">
            <a href={msg.content} target="_blank" rel="noreferrer" className="file-link">
              <span className="file-icon">📄</span>
              <span className="file-info">
                <span className="file-name">{msg.fileName}</span>
                <span className="file-size">{formatBytes(msg.fileSize)}</span>
              </span>
              <span className="file-dl">⬇</span>
            </a>
            <div className="bubble-footer">
              {memberCount > 1 && <span className="read-count">{readCount}/{memberCount}</span>}
              <span className="bubble-time">{formatTime(msg.createdAt)}</span>
            </div>
          </div>
        )}
      </div>
      {isOwn && <div className="avatar own-avatar">{getInitial(msg.displayName)}</div>}
    </div>
  )
}
