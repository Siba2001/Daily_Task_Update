import { useState } from 'react';
import { formatTimestamp } from '../utils.js';

export default function MessageBoard({ messages, onPost, onClear, onLogout }) {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      await onPost(trimmed);
      setText('');
    } finally {
      setPosting(false);
    }
  }

  function handleClear() {
    if (window.confirm('Clear all messages? This cannot be undone.')) {
      onClear();
    }
  }

  return (
    <div className="board-page">
      <header className="board-header">
        <h1>Secure Message Board</h1>
        <button className="link-button" onClick={onLogout}>
          Logout
        </button>
      </header>

      <form className="post-form" onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          rows={3}
          maxLength={2000}
        />
        <div className="post-form-actions">
          <button type="submit" disabled={posting || !text.trim()}>
            {posting ? 'Posting…' : 'Post'}
          </button>
          <button type="button" className="danger" onClick={handleClear}>
            Clear All
          </button>
        </div>
      </form>

      <div className="message-list">
        {messages.length === 0 && <p className="empty-state">No messages yet.</p>}
        {messages.map((m, i) => (
          <div key={m.id || i}>
            <div className="message-item">
              <div className="message-timestamp">{formatTimestamp(m.timestamp)}</div>
              <div className="message-text">{m.text}</div>
            </div>
            {i < messages.length - 1 && <hr />}
          </div>
        ))}
      </div>
    </div>
  );
}
