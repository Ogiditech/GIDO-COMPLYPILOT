// Small helpers shared by every /api function (works on Vercel and in the local Express server).

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const bad = (msg) => new HttpError(400, msg);
export const notFound = (msg = 'Not found.') => new HttpError(404, msg);

const DB_DOWN = /fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|getaddrinfo|Error connecting to database|password authentication failed|could not connect|Connection terminated/i;

export function body(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { throw bad('Request body must be valid JSON.'); }
  }
  return req.body;
}

/** route({ GET: fn, POST: fn }) → Vercel-style handler with consistent error responses */
export function route(handlers) {
  return async function handler(req, res) {
    const fn = handlers[req.method];
    if (!fn) {
      res.setHeader('Allow', Object.keys(handlers).join(', '));
      return res.status(405).json({ error: `Method ${req.method} not allowed.` });
    }
    try {
      res.setHeader('Cache-Control', 'no-store');
      return await fn(req, res);
    } catch (err) {
      if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code });
      const msg = String(err?.message || err);
      if (err?.code === 'DB_NOT_CONFIGURED') {
        return res.status(503).json({ code: 'DB_UNAVAILABLE', error: 'The database is not configured yet. Add DATABASE_URL to your .env file and restart.' });
      }
      if (err?.code === '42P01' || /relation .* does not exist/i.test(msg)) {
        return res.status(503).json({ code: 'DB_NOT_SET_UP', error: 'The database tables are missing. Run "npm run db:setup" and try again.' });
      }
      if (DB_DOWN.test(msg) || DB_DOWN.test(String(err?.cause?.message || ''))) {
        console.error('[api] database unreachable:', msg);
        return res.status(503).json({ code: 'DB_UNAVAILABLE', error: 'We can\'t reach the database right now. Check your internet connection and try again in a moment.' });
      }
      if (err?.code === '23505') return res.status(409).json({ error: 'That record already exists.' });
      if (err?.code === '22P02') return res.status(400).json({ error: 'One of the IDs in your request is not valid.' });
      console.error(`[api] ${req.method} ${req.url} failed:`, err);
      return res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
    }
  };
}

export const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export function requireUuid(v, label = 'id') {
  if (!isUuid(v)) throw notFound(`That ${label} could not be found.`);
  return v;
}

export const clampInt = (v, min, max) => {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n) || n < min || n > max) return null;
  return n;
};

export const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
