// GET  /api/employees: staff list (with acknowledgement counts)
// POST /api/employees: add an employee { full_name, email, department }
import crypto from 'node:crypto';
import { getSql } from './_lib/db.js';
import { route, body, bad, HttpError } from './_lib/http.js';
import { requireUser, requireEditor } from './_lib/auth.js';
import { logActivity } from './_lib/activity.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default route({
  async GET(req, res) {
    const user = await requireUser(req);
    const employees = await getSql()`
      SELECT e.id, e.full_name, e.email, e.department,
             count(a.id) FILTER (WHERE a.status = 'Signed')::int AS signed,
             count(a.id) FILTER (WHERE a.status = 'Pending')::int AS pending
      FROM employees e LEFT JOIN acknowledgements a ON a.employee_id = e.id
      WHERE e.organisation_id = ${user.organisation_id}
      GROUP BY e.id ORDER BY e.full_name`;
    return res.status(200).json({ employees });
  },

  async POST(req, res) {
    const user = await requireUser(req);
    requireEditor(user);
    const b = body(req);
    const full_name = String(b.full_name || '').trim();
    const email = String(b.email || '').trim().toLowerCase() || null;
    const department = String(b.department || '').trim() || null;
    if (!full_name) throw bad('Please enter the employee\'s full name.');
    if (email && !EMAIL.test(email)) throw bad('That email address doesn\'t look quite right.');

    const sql = getSql();
    if (email) {
      const dup = await sql`SELECT 1 FROM employees WHERE organisation_id = ${user.organisation_id} AND email = ${email}`;
      if (dup.length) throw new HttpError(409, 'An employee with that email is already on your list.');
    }
    const id = crypto.randomUUID();
    await sql.transaction([
      sql`INSERT INTO employees (id, organisation_id, full_name, email, department)
          VALUES (${id}, ${user.organisation_id}, ${full_name}, ${email}, ${department})`,
      logActivity(sql, user, `added employee ${full_name}`, 'employee', id),
    ]);
    return res.status(201).json({ employee: { id, full_name, email, department, signed: 0, pending: 0 } });
  },
});
