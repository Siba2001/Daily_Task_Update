import { useEffect, useState } from 'react';
import { api } from './api.js';
import Login from './components/Login.jsx';
import Gate from './components/Gate.jsx';
import MessageBoard from './components/MessageBoard.jsx';

const TOKEN_KEY = 'smb_token';
const DECOY_TITLE = 'Site not found · GitHub Pages';
const REAL_TITLE = 'Secure Message Board';

export default function App() {
  // Default view is the decoy page so the very first paint already looks
  // like a normal 404 — never a blank/loading flash before it appears.
  const [view, setView] = useState('gate'); // gate | blocked | login | board
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.title = view === 'login' || view === 'board' ? REAL_TITLE : DECOY_TITLE;
  }, [view]);

  async function init() {
    try {
      const statusRes = await api.status();
      if (statusRes.locked) {
        setView('blocked');
        return;
      }
    } catch {
      // If the status check fails (e.g. offline), fall through to login.
    }

    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      try {
        const res = await api.getMessages(savedToken);
        if (res.success) {
          setToken(savedToken);
          setMessages(res.messages);
          setView('board');
          return;
        }
      } catch {
        // ignore, fall through to login
      }
      localStorage.removeItem(TOKEN_KEY);
    }

    setView('gate');
  }

  function handleReveal() {
    setView('login');
  }

  async function handleLogin(password) {
    setError('');
    try {
      const res = await api.login(password);
      if (res.success) {
        localStorage.setItem(TOKEN_KEY, res.token);
        setToken(res.token);
        const msgRes = await api.getMessages(res.token);
        setMessages(msgRes.success ? msgRes.messages : []);
        setView('board');
      } else if (res.locked) {
        setView('blocked');
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err) {
      console.error('Login request failed:', err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not reach the server. Please try again.'
      );
    }
  }

  function handleSessionExpired() {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setMessages([]);
    setError('Session expired. Please log in again.');
    setView('login');
  }

  async function handlePost(text) {
    const res = await api.postMessage(token, text);
    if (res.success) {
      setMessages((prev) => [res.message, ...prev]);
    } else if (res.message === 'Unauthorized') {
      handleSessionExpired();
    }
  }

  async function handleClear() {
    const res = await api.clearMessages(token);
    if (res.success) {
      setMessages([]);
    } else if (res.message === 'Unauthorized') {
      handleSessionExpired();
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setMessages([]);
    setView('gate');
  }

  if (view === 'gate') return <Gate interactive onReveal={handleReveal} />;
  if (view === 'blocked') return <Gate interactive={false} />;
  if (view === 'board') {
    return (
      <MessageBoard
        messages={messages}
        onPost={handlePost}
        onClear={handleClear}
        onLogout={handleLogout}
      />
    );
  }
  return <Login onSubmit={handleLogin} error={error} />;
}
