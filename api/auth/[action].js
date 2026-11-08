// /api/auth/signup | /api/auth/login | /api/auth/logout | /api/auth/me
// One file (dynamic segment) keeps the Vercel function count low.
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { getSql } from '../_lib/db.js';
import { route, body, bad, HttpError, notFound, clampInt } from '../_lib/http.js';
import { signSession, setSessionCookie, clearSessionCookie, getUser, publicUser } from '../_lib/auth.js';
import { logActivity } from '../_lib/activity.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Used to keep login timing similar whether or not the email exists
const DUMMY_HASH = bcrypt.hashSync('complypilot-timing-guard', 10);

async function signup(req, res) {
  const b = body(req);
  const full_name = String(b.full_name || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  const company = String(b.company_name || '').trim();
  const industry = String(b.industry || '').trim() || null;
  const location = String(b.emirate_or_country || '').trim() || null;
  const employees = b.employee_count === '' || b.employee_count == null ? null : clampInt(b.employee_count, 1, 1_000_000);

  if (!full_name) throw bad('Please enter your full name.');
  if (!EMAIL.test(email)) throw bad('Please enter a valid work email address.');
  if (password.length < 8) throw bad('Your password needs at least 8 characters.');
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) throw bad('Use at least one letter and one number in your password.');
  if (!company) throw bad('Please enter your company name.');
  if (b.employee_count !== '' && b.employee_count != null && employees === null) throw bad('Number of employees must be a whole number of at least 1.');

  const sql = getSql();
  const existing = await sql`SELECT 1 FROM users WHERE email = ${email}`;
  if (existing.length) throw new HttpError(409, 'An account with that email already exists. Try logging in instead.');

  const orgId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const hash = await bcrypt.hash(password, 10);
  const user = { id: userId, organisation_id: orgId };

  await sql.transaction([
    sql`INSERT INTO organisations (id, name, industry, employee_count, emirate_or_country, plan)
        VALUES (${orgId}, ${company}, ${industry}, ${employees}, ${location}, 'Starter')`,
    sql`INSERT INTO users (id, organisation_id, email, password_hash, full_name, role)
        VALUES (${userId}, ${orgId}, ${email}, ${hash}, ${full_name}, 'Admin')`,
    logActivity(sql, user, `created the ${company} workspace`, 'organisation', orgId),
  ]);

  setSessionCookie(res, await signSession(user));
  return res.status(201).json({
    user: { id: userId, email, full_name, role: 'Admin', organisation: { id: orgId, name: company, industry, employee_count: employees, emirate_or_country: location, plan: 'Starter' } },
  });
}

async function login(req, res) {
  const b = body(req);
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  if (!email || !password) throw bad('Please enter your email and password.');

  const sql = getSql();
  const rows = await sql`SELECT id, organisation_id, password_hash FROM users WHERE email = ${email}`;
  const ok = await bcrypt.compare(password, rows[0]?.password_hash || DUMMY_HASH);
  if (!rows.length || !ok) throw new HttpError(401, 'That email and password don\'t match. Please try again.');

  setSessionCookie(res, await signSession(rows[0]));
  const full = await sql`
    SELECT u.id, u.email, u.full_name, u.role, o.id AS org_id, o.name, o.industry, o.employee_count, o.emirate_or_country, o.plan
    FROM users u JOIN organisations o ON o.id = u.organisation_id WHERE u.id = ${rows[0].id}`;
  const r = full[0];
  return res.status(200).json({
    user: { id: r.id, email: r.email, full_name: r.full_name, role: r.role, organisation: { id: r.org_id, name: r.name, industry: r.industry, employee_count: r.employee_count, emirate_or_country: r.emirate_or_country, plan: r.plan } },
  });
}

async function logout(req, res) {
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
}

async function me(req, res) {
  const user = await getUser(req);
  // 200 with null keeps the browser console clean when simply logged out
  return res.status(200).json({ user: user ? publicUser(user) : null });
}

const ACTIONS = {
  signup: { POST: signup },
  login: { POST: login },
  logout: { POST: logout },
  me: { GET: me },
};

export default async function handler(req, res) {
  const action = req.query.action;
  const handlers = ACTIONS[action];
  if (!handlers) return route({ [req.method]: () => { throw notFound('Unknown auth action.'); } })(req, res);
  return route(handlers)(req, res);
}
