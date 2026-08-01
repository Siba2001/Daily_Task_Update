const API_URL = import.meta.env.VITE_API_URL;

function getClientId() {
  let id = localStorage.getItem('smb_clientId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('smb_clientId', id);
  }
  return id;
}

async function callApi(action, payload = {}) {
  if (!API_URL || API_URL.includes('XXXX')) {
    throw new Error(
      'VITE_API_URL is not set to a real deployed Apps Script URL. Check frontend/.env — see setup.md Part 5.'
    );
  }

  // Sending Content-Type: text/plain avoids a CORS preflight request,
  // which Google Apps Script web apps do not handle. The body is still
  // parsed as JSON on the server.
  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch (err) {
    throw new Error(
      'Could not reach the Apps Script server. Confirm the Web App is deployed with "Who has access: Anyone" — see setup.md Part 4.'
    );
  }

  if (!res.ok) {
    throw new Error(`Server responded with an error (HTTP ${res.status}).`);
  }
  return res.json();
}

export const api = {
  status: () => callApi('status', { clientId: getClientId() }),
  login: (password) => callApi('login', { password, clientId: getClientId() }),
  getMessages: (token) => callApi('getMessages', { token }),
  postMessage: (token, text) => callApi('postMessage', { token, text }),
  clearMessages: (token) => callApi('clearMessages', { token }),
};
