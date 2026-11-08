// GET  /api/policies/:id/versions             → version history (without content)
// GET  /api/policies/:id/versions?version=2   → one version including content
// POST /api/policies/:id/versions             → save edited sections as a new version { sections, change_note }
import { getSql } from '../../_lib/db.js';
import { route, body, bad, notFound, requireUuid, clampInt } from '../../_lib/http.js';
import { requireUser, requireEditor } from '../../_lib/auth.js';
import { logActivity } from '../../_lib/activity.js';

async function assertPolicy(sql, id, orgId) {
  const rows = await sql`SELECT id, title, current_version FROM policies WHERE id = ${id} AND organisation_id = ${orgId}`;
  if (!rows.length) throw notFound('We couldn\'t find that policy.');
  return rows[0];
}

export default route({
  async GET(req, res) {
    const user = await requireUser(req);
    const id = requireUuid(req.query.id, 'policy');
    const sql = getSql();
    await assertPolicy(sql, id, user.organisation_id);

    if (req.query.version !== undefined) {
      const n = clampInt(req.query.version, 1, 100000);
      if (!n) throw bad('Version must be a positive number.');
      const rows = await sql`
        SELECT v.version_number, v.content, v.change_note, v.created_at, u.full_name AS author
        FROM policy_versions v LEFT JOIN users u ON u.id = v.created_by
        WHERE v.policy_id = ${id} AND v.version_number = ${n}`;
      if (!rows.length) throw notFound(`Version ${n} doesn't exist.`);
      return res.status(200).json({ version: rows[0] });
    }

    const versions = await sql`
      SELECT v.version_number, v.change_note, v.created_at, COALESCE(u.full_name, 'GIDO ComplyPilot') AS author
      FROM policy_versions v LEFT JOIN users u ON u.id = v.created_by
      WHERE v.policy_id = ${id}
      ORDER BY v.version_number DESC`;
    return res.status(200).json({ versions });
  },

  async POST(req, res) {
    const user = await requireUser(req);
    requireEditor(user);
    const id = requireUuid(req.query.id, 'policy');
    const b = body(req);
    const changeNote = String(b.change_note || '').trim();
    if (!changeNote) throw bad('Please add a short change note so others know what changed.');
    if (changeNote.length > 500) throw bad('Keep the change note under 500 characters.');
    if (!Array.isArray(b.sections) || !b.sections.length) throw bad('A policy needs at least one section.');
    const sections = b.sections.map((s, i) => {
      const title = String(s?.title || '').trim();
      const content = String(s?.content || '').trim();
      if (!title || !content) throw bad(`Section ${i + 1} needs both a title and some text.`);
      return { number: i + 1, title, content };
    });

    const sql = getSql();
    const policy = await assertPolicy(sql, id, user.organisation_id);
    const next = policy.current_version + 1;

    await sql.transaction([
      sql`INSERT INTO policy_versions (policy_id, version_number, content, change_note, created_by)
          VALUES (${id}, ${next}, ${JSON.stringify(sections)}::jsonb, ${changeNote}, ${user.id})`,
      sql`UPDATE policies SET current_version = ${next}, updated_at = now()
          WHERE id = ${id} AND organisation_id = ${user.organisation_id} AND current_version = ${policy.current_version}`,
      logActivity(sql, user, `saved version ${next} of “${policy.title}”: ${changeNote}`, 'policy', id),
    ]);
    return res.status(201).json({ version_number: next });
  },
});
