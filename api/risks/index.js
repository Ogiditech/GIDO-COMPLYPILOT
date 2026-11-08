// GET  /api/risks: risk register for the organisation
// POST /api/risks: add a risk
import crypto from 'node:crypto';
import { getSql } from '../_lib/db.js';
import { route, body } from '../_lib/http.js';
import { requireUser, requireEditor } from '../_lib/auth.js';
import { logActivity } from '../_lib/activity.js';
import { validateRisk, checkRefs, loadRisks } from '../_lib/risks.js';

export default route({
  async GET(req, res) {
    const user = await requireUser(req);
    const risks = await loadRisks(getSql(), user.organisation_id);
    return res.status(200).json({ risks });
  },

  async POST(req, res) {
    const user = await requireUser(req);
    requireEditor(user);
    const r = validateRisk(body(req));
    const sql = getSql();
    await checkRefs(sql, user.organisation_id, r);
    const id = crypto.randomUUID();
    await sql.transaction([
      sql`INSERT INTO risks (id, organisation_id, title, description, likelihood, impact, owner_user_id, linked_policy_id, status, due_date)
          VALUES (${id}, ${user.organisation_id}, ${r.title}, ${r.description}, ${r.likelihood}, ${r.impact},
                  ${r.owner_user_id}, ${r.linked_policy_id}, ${r.status}, ${r.due_date})`,
      logActivity(sql, user, `added risk “${r.title}” (score ${r.likelihood * r.impact})`, 'risk', id),
    ]);
    const [risk] = await loadRisks(sql, user.organisation_id, id);
    return res.status(201).json({ risk });
  },
});
