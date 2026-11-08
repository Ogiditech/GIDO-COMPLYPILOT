// GET   /api/organisation: organisation profile + team
// PATCH /api/organisation: { name, industry, employee_count, emirate_or_country, plan } or { user_id, role }  (Admin only)
// POST  /api/organisation: invite a team member { full_name, email, role } → returns a one-time temporary password (Admin only)
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { getSql } from './_lib/db.js';
import { route, body, bad, HttpError, requireUuid, clampInt } from './_lib/http.js';
import { requireUser, requireAdmin } from './_lib/auth.js';
import { logActivity } from './_lib/activity.js';

const PLANS = ['Starter', 'Business', 'Enterprise'];
const ROLES = ['Admin', 'Compliance Officer', 'Viewer'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function load(sql, orgId) {
  const [org, users] = await Promise.all([
    sql`SELECT id, name, industry, employee_count, emirate_or_country, plan, created_at FROM organisations WHERE id = ${orgId}`,
    sql`SELECT id, full_name, email, role, created_at FROM users WHERE organisation_id = ${orgId} ORDER BY created_at`,
  ]);
  return { organisation: org[0], users };
}

export default route({
  async GET(req, res) {
    const user = await requireUser(req);
    return res.status(200).json(await load(getSql(), user.organisation_id));
  },

  async PATCH(req, res) {
    const user = await requireUser(req);
    requireAdmin(user);
    const b = body(req);
    const sql = getSql();
    const org = user.organisation_id;

    if (b.user_id) {
      const target = requireUuid(b.user_id, 'team member');
      if (!ROLES.includes(b.role)) throw bad('Role must be Admin, Compliance Officer or Viewer.');
      if (target === user.id && b.role !== 'Admin') throw bad('You can\'t remove your own Admin role. Ask another Admin to do it.');
      const rows = await sql`SELECT full_name FROM users WHERE id = ${target} AND organisation_id = ${org}`;
      if (!rows.length) throw bad('That person isn\'t on your team.');
      await sql.transaction([
        sql`UPDATE users SET role = ${b.role} WHERE id = ${target} AND organisation_id = ${org}`,
        logActivity(sql, user, `changed ${rows[0].full_name}'s role to ${b.role}`, 'user', target),
      ]);
      return res.status(200).json(await load(sql, org));
    }

    const cur = user.organisation;
    const name = b.name !== undefined ? String(b.name).trim() : cur.name;
    if (!name) throw bad('Your organisation needs a name.');
    const plan = b.plan ?? cur.plan;
    if (!PLANS.includes(plan)) throw bad('Plan must be Starter, Business or Enterprise.');
    const employees = b.employee_count !== undefined && b.employee_count !== '' ? clampInt(b.employee_count, 1, 1_000_000) : cur.employee_count;
    if (b.employee_count !== undefined && b.employee_count !== '' && employees === null) throw bad('Number of employees must be at least 1.');
    const industry = b.industry !== undefined ? String(b.industry).trim() || null : cur.industry;
    const location = b.emirate_or_country !== undefined ? String(b.emirate_or_country).trim() || null : cur.emirate_or_country;

    await sql.transaction([
      sql`UPDATE organisations SET name = ${name}, industry = ${industry}, employee_count = ${employees},
                                   emirate_or_country = ${location}, plan = ${plan}
          WHERE id = ${org}`,
      logActivity(sql, user, plan !== cur.plan ? `switched to the ${plan} plan` : 'updated the organisation profile', 'organisation', org),
    ]);
    return res.status(200).json(await load(sql, org));
  },

  async POST(req, res) {
    const user = await requireUser(req);
    requireAdmin(user);
    const b = body(req);
    const full_name = String(b.full_name || '').trim();
    const email = String(b.email || '').trim().toLowerCase();
    const role = b.role || 'Viewer';
    if (!full_name) throw bad('Please enter a name.');
    if (!EMAIL.test(email)) throw bad('That email address doesn\'t look quite right.');
    if (!ROLES.includes(role)) throw bad('Role must be Admin, Compliance Officer or Viewer.');

    const sql = getSql();
    const exists = await sql`SELECT 1 FROM users WHERE email = ${email}`;
    if (exists.length) throw new HttpError(409, 'Someone with that email already has a GIDO ComplyPilot account.');

    const tempPassword = `${crypto.randomBytes(6).toString('base64url')}-${crypto.randomInt(10, 99)}`;
    const id = crypto.randomUUID();
    await sql.transaction([
      sql`INSERT INTO users (id, organisation_id, email, password_hash, full_name, role)
          VALUES (${id}, ${user.organisation_id}, ${email}, ${await bcrypt.hash(tempPassword, 10)}, ${full_name}, ${role})`,
      logActivity(sql, user, `invited ${full_name} as ${role}`, 'user', id),
    ]);
    return res.status(201).json({ temp_password: tempPassword, ...(await load(sql, user.organisation_id)) });
  },
});
