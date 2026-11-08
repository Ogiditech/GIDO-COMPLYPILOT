// Browser → /api client. The browser never talks to the database directly.
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const SERVER_DOWN = 'We can\'t reach the GIDO ComplyPilot server. Make sure "npm run dev" is running, then try again.';

export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(SERVER_DOWN, 0, 'NETWORK');
  }

  let data = null;
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  if (isJson) {
    try { data = await res.json(); } catch { data = null; }
  }

  if (!res.ok) {
    if (!isJson && res.status >= 500) throw new ApiError(SERVER_DOWN, res.status, 'NETWORK');
    if (res.status === 401) window.dispatchEvent(new Event('cp:unauthorized'));
    throw new ApiError(data?.error || `Something went wrong (error ${res.status}).`, res.status, data?.code);
  }
  return data;
}

export const isDbError = (err) => err?.code === 'DB_UNAVAILABLE' || err?.code === 'DB_NOT_SET_UP' || err?.code === 'NETWORK';
