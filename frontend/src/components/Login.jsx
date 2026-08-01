import { useState } from 'react';

export default function Login({ onSubmit, error }) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(password);
    } finally {
      setSubmitting(false);
      setPassword('');
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Secure Message Board</h1>
        <label htmlFor="password">Enter Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={submitting || !password}>
          {submitting ? 'Checking…' : 'Login'}
        </button>
      </form>
    </div>
  );
}
