// PATCH  /api/risks/:id: edit or close a risk (partial updates allowed)
// DELETE /api/risks/:id
import { getSql } from '../_lib/db.js';
import { route, body, requireUuid } from '../_lib/http.js';
import { requireUser, requireEditor } from '../_lib/auth.js';
import { logActivity } from '../_lib/activity.js';
import { validateRisk, checkRefs, loadRisks } from '../_lib/risks.js';

export default route({
  async PATCH(req, res) {
    const user = await requireUser(req);
    requireEditor(user);
    const id = requireUuid(req.query.id, 'risk');
    const sql = getSql();
    const [current] = await loadRisks(sql, user.organisation_id, id);
    const r = validateRisk({ ...current, ...body(req) });
    await checkRefs(sql, user.organisation_id, r);

    let action = `updated risk “${r.title}”`;
    if (r.status !== current.status) action = r.status === 'Closed' ? `closed risk “${r.title}”` : `marked risk “${r.title}” as ${r.status}`;
    else if (r.linked_policy_id && r.linked_policy_id !== current.linked_policy_id) action = `linked risk “${r.title}” to a policy`;

    await sql.transaction([
      sql`UPDATE risks SET title = ${r.title}, description = ${r.description}, likelihood = ${r.likelihood}, impact = ${r.impact},
                           owner_user_id = ${r.owner_user_id}, linked_policy_id = ${r.linked_policy_id},
                           status = ${r.status}, due_date = ${r.due_date}
          WHERE id = ${id} AND organisation_id = ${user.organisation_id}`,
      logActivity(sql, user, action, 'risk', id),
    ]);
    const [risk] = await loadRisks(sql, user.organisation_id, id);
    return res.status(200).json({ risk });
  },

  async DELETE(req, res) {
    const user = await requireUser(req);
    requireEditor(user);
    const id = requireUuid(req.query.id, 'risk');
    const sql = getSql();
    const [current] = await loadRisks(sql, user.organisation_id, id);
    await sql.transaction([
      sql`DELETE FROM risks WHERE id = ${id} AND organisation_id = ${user.organisation_id}`,
      logActivity(sql, user, `deleted risk “${current.title}”`, 'risk', id),
    ]);
    return res.status(200).json({ ok: true });
  },
});
