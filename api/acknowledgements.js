// GET   /api/acknowledgements                → per-policy progress summary
// GET   /api/acknowledgements?policy_id=…    → employees assigned to one policy and their status
// POST  /api/acknowledgements { action: 'assign', policy_id }  → assign a policy to all employees
// POST  /api/acknowledgements { action: 'remind', policy_id }  → stamp last_reminder_at on pending rows
// PATCH /api/acknowledgements { id, status: 'Signed' | 'Pending' }
import { getSql } from './_lib/db.js';
import { route, body, bad, notFound, requireUuid } from './_lib/http.js';
import { requireUser, requireEditor } from './_lib/auth.js';
import { logActivity } from './_lib/activity.js';

async function policyInOrg(sql, policyId, orgId) {
  const rows = await sql`SELECT id, title, status FROM policies WHERE id = ${policyId} AND organisation_id = ${orgId}`;
  if (!rows.length) throw notFound('We couldn\'t find that policy.');
  return rows[0];
}

export default route({
  async GET(req, res) {
    const user = await requireUser(req);
    const org = user.organisation_id;
    const sql = getSql();

    if (req.query.policy_id) {
      const policyId = requireUuid(req.query.policy_id, 'policy');
      const policy = await policyInOrg(sql, policyId, org);
      const [rows, unassigned] = await Promise.all([
        sql`SELECT a.id, a.status, a.signed_at, a.last_reminder_at, e.id AS employee_id, e.full_name, e.email, e.department
            FROM acknowledgements a JOIN employees e ON e.id = a.employee_id
            WHERE a.policy_id = ${policyId} AND e.organisation_id = ${org}
            ORDER BY e.full_name`,
        sql`SELECT count(*)::int AS n FROM employees e
            WHERE e.organisation_id = ${org}
              AND NOT EXISTS (SELECT 1 FROM acknowledgements a WHERE a.policy_id = ${policyId} AND a.employee_id = e.id)`,
      ]);
      return res.status(200).json({ policy, rows, unassigned_count: unassigned[0].n });
    }

    const [policies, emp] = await Promise.all([
      sql`SELECT p.id, p.title, p.status,
                 count(a.id)::int AS total,
                 count(a.id) FILTER (WHERE a.status = 'Signed')::int AS signed,
                 count(a.id) FILTER (WHERE a.status = 'Pending')::int AS pending
          FROM policies p LEFT JOIN acknowledgements a ON a.policy_id = p.id
          WHERE p.organisation_id = ${org} AND p.status <> 'Expired'
          GROUP BY p.id ORDER BY (p.status = 'Active') DESC, p.updated_at DESC`,
      sql`SELECT count(*)::int AS n FROM employees WHERE organisation_id = ${org}`,
    ]);
    return res.status(200).json({ policies, employee_count: emp[0].n });
  },

  async POST(req, res) {
    const user = await requireUser(req);
    requireEditor(user);
    const b = body(req);
    const policyId = requireUuid(b.policy_id, 'policy');
    const sql = getSql();
    const policy = await policyInOrg(sql, policyId, user.organisation_id);

    if (b.action === 'assign') {
      const inserted = await sql`
        INSERT INTO acknowledgements (policy_id, employee_id, status)
        SELECT ${policyId}, e.id, 'Pending' FROM employees e WHERE e.organisation_id = ${user.organisation_id}
        ON CONFLICT (policy_id, employee_id) DO NOTHING
        RETURNING id`;
      if (inserted.length) {
        await logActivity(sql, user, `assigned “${policy.title}” to ${inserted.length} employee${inserted.length === 1 ? '' : 's'}`, 'policy', policyId);
      }
      return res.status(200).json({ assigned: inserted.length });
    }

    if (b.action === 'remind') {
      const updated = await sql`
        UPDATE acknowledgements SET last_reminder_at = now()
        WHERE policy_id = ${policyId} AND status = 'Pending'
        RETURNING id`;
      if (updated.length) {
        await logActivity(sql, user, `sent ${updated.length} reminder${updated.length === 1 ? '' : 's'} for “${policy.title}”`, 'policy', policyId);
      }
      return res.status(200).json({ reminded: updated.length });
    }

    throw bad('Unknown action. Use "assign" or "remind".');
  },

  async PATCH(req, res) {
    const user = await requireUser(req);
    requireEditor(user);
    const b = body(req);
    const id = requireUuid(b.id, 'acknowledgement');
    if (!['Signed', 'Pending'].includes(b.status)) throw bad('Status must be Signed or Pending.');
    const sql = getSql();
    const rows = await sql`
      SELECT a.id, a.status, p.id AS policy_id, p.title, e.full_name
      FROM acknowledgements a JOIN policies p ON p.id = a.policy_id JOIN employees e ON e.id = a.employee_id
      WHERE a.id = ${id} AND p.organisation_id = ${user.organisation_id}`;
    if (!rows.length) throw notFound('We couldn\'t find that acknowledgement.');
    const row = rows[0];
    if (row.status === b.status) return res.status(200).json({ ok: true, unchanged: true });

    await sql.transaction([
      sql`UPDATE acknowledgements
          SET status = ${b.status}, signed_at = CASE WHEN ${b.status}::text = 'Signed' THEN now() ELSE NULL END
          WHERE id = ${id}`,
      logActivity(sql, user, b.status === 'Signed'
        ? `recorded ${row.full_name}'s signature on “${row.title}”`
        : `marked ${row.full_name} as pending on “${row.title}”`, 'acknowledgement', id),
    ]);
    return res.status(200).json({ ok: true });
  },
});
