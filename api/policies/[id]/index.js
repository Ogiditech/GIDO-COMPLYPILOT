// GET    /api/policies/:id: policy details + current version content
// PATCH  /api/policies/:id: change status / title / next review date
// DELETE /api/policies/:id
import { getSql } from '../../_lib/db.js';
import { route, body, bad, notFound, requireUuid, isDate } from '../../_lib/http.js';
import { requireUser, requireEditor } from '../../_lib/auth.js';
import { logActivity } from '../../_lib/activity.js';

const STATUSES = ['Draft', 'Active', 'Under Review', 'Expired'];

async function loadPolicy(sql, id, orgId) {
  const rows = await sql`
    SELECT p.id, p.title, p.policy_type, p.status, p.current_version, p.owner_user_id,
           p.effective_date::text AS effective_date, p.next_review_date::text AS next_review_date,
           p.created_at, p.updated_at, f.code AS framework_code, f.name AS framework, u.full_name AS owner,
           o.name AS company
    FROM policies p
    JOIN organisations o ON o.id = p.organisation_id
    LEFT JOIN frameworks f ON f.id = p.framework_id
    LEFT JOIN users u ON u.id = p.owner_user_id
    WHERE p.id = ${id} AND p.organisation_id = ${orgId}`;
  if (!rows.length) throw notFound('We couldn\'t find that policy. It may have been deleted.');
  return rows[0];
}

export default route({
  async GET(req, res) {
    const user = await requireUser(req);
    const id = requireUuid(req.query.id, 'policy');
    const sql = getSql();
    const policy = await loadPolicy(sql, id, user.organisation_id);
    const v = await sql`
      SELECT version_number, content, change_note, created_at FROM policy_versions
      WHERE policy_id = ${id} AND version_number = ${policy.current_version}`;
    return res.status(200).json({ policy, version: v[0] || null });
  },

  async PATCH(req, res) {
    const user = await requireUser(req);
    requireEditor(user);
    const id = requireUuid(req.query.id, 'policy');
    const b = body(req);
    const sql = getSql();
    const current = await loadPolicy(sql, id, user.organisation_id);

    const status = b.status ?? current.status;
    if (!STATUSES.includes(status)) throw bad('That status isn\'t valid.');
    const title = b.title !== undefined ? String(b.title).trim() : current.title;
    if (!title) throw bad('The policy needs a title.');
    const review = b.next_review_date !== undefined ? b.next_review_date : current.next_review_date;
    if (review !== null && !isDate(review)) throw bad('Next review date must be a valid date.');
    // When a policy first goes Active, its effective date becomes today
    const effectiveSql = status === 'Active' && current.status !== 'Active' ? new Date().toISOString().slice(0, 10) : current.effective_date;

    const actions = [];
    if (status !== current.status) actions.push(`changed status of “${title}” from ${current.status} to ${status}`);
    if (title !== current.title) actions.push(`renamed “${current.title}” to “${title}”`);
    if (review !== current.next_review_date) actions.push(`set the next review of “${title}” to ${review}`);

    await sql.transaction([
      sql`UPDATE policies SET status = ${status}, title = ${title}, next_review_date = ${review},
                              effective_date = ${effectiveSql}, updated_at = now()
          WHERE id = ${id} AND organisation_id = ${user.organisation_id}`,
      ...actions.map((a) => logActivity(sql, user, a, 'policy', id)),
    ]);
    const policy = await loadPolicy(sql, id, user.organisation_id);
    return res.status(200).json({ policy });
  },

  async DELETE(req, res) {
    const user = await requireUser(req);
    requireEditor(user);
    const id = requireUuid(req.query.id, 'policy');
    const sql = getSql();
    const current = await loadPolicy(sql, id, user.organisation_id);
    await sql.transaction([
      sql`DELETE FROM policies WHERE id = ${id} AND organisation_id = ${user.organisation_id}`,
      logActivity(sql, user, `deleted “${current.title}”`, 'policy', id),
    ]);
    return res.status(200).json({ ok: true });
  },
});
