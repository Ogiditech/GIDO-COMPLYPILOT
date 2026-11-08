import { SignJWT, jwtVerify } from 'jose';
import { getSql } from './db.js';
import { HttpError } from './http.js';

export const COOKIE = 'cp_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error('JWT_SECRET is missing or too short (min 32 characters).');
  return new TextEncoder().encode(s);
}

export async function signSession(user) {
  return new SignJWT({ org: user.organisation_id })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

const secure = () => process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

export function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure() ? '; Secure' : ''}`);
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure() ? '; Secure' : ''}`);
}

function readCookie(req) {
  if (req.cookies && req.cookies[COOKIE]) return req.cookies[COOKIE];
  const header = req.headers?.cookie || '';
  const m = header.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** Returns the logged-in user (with organisation) or null. */
export async function getUser(req) {
  const token = readCookie(req);
  if (!token) return null;
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] }));
  } catch {
    return null;
  }
  const sql = getSql();
  const rows = await sql`
    SELECT u.id, u.email, u.full_name, u.role, u.organisation_id,
           o.name AS org_name, o.industry, o.employee_count, o.emirate_or_country, o.plan
    FROM users u JOIN organisations o ON o.id = u.organisation_id
    WHERE u.id = ${payload.sub}`;
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id, email: r.email, full_name: r.full_name, role: r.role, organisation_id: r.organisation_id,
    organisation: { id: r.organisation_id, name: r.org_name, industry: r.industry, employee_count: r.employee_count, emirate_or_country: r.emirate_or_country, plan: r.plan },
  };
}

/** Throws 401 if not logged in. Every org-scoped route uses user.organisation_id from here, never from the request. */
export async function requireUser(req) {
  const user = await getUser(req);
  if (!user) throw new HttpError(401, 'Please log in to continue.', 'UNAUTHENTICATED');
  return user;
}

/** Viewers are read-only. */
export function requireEditor(user) {
  if (user.role === 'Viewer') throw new HttpError(403, 'Your role is read-only. Ask an Admin to give you edit access.');
}

export function requireAdmin(user) {
  if (user.role !== 'Admin') throw new HttpError(403, 'Only Admins can do that.');
}

export const publicUser = (u) => ({ id: u.id, email: u.email, full_name: u.full_name, role: u.role, organisation: u.organisation });
