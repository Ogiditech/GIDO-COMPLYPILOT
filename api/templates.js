// GET /api/templates: frameworks and which policy types have a template for each
import { getSql } from './_lib/db.js';
import { route } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';

const TYPE_ORDER = ['Health & Safety', 'Fire Safety', 'Data Protection', 'Information Security', 'Anti-Bribery', 'Incident Reporting', 'Emergency Evacuation', 'Code of Conduct'];

export default route({
  async GET(req, res) {
    await requireUser(req);
    const sql = getSql();
    const [frameworks, templates] = await Promise.all([
      sql`SELECT code, name, description FROM frameworks ORDER BY id`,
      sql`SELECT t.id, t.policy_type, f.code AS framework_code, jsonb_array_length(t.sections)::int AS section_count
          FROM policy_templates t JOIN frameworks f ON f.id = t.framework_id ORDER BY f.id`,
    ]);
    const byType = new Map();
    for (const t of templates) {
      if (!byType.has(t.policy_type)) byType.set(t.policy_type, []);
      byType.get(t.policy_type).push(t.framework_code);
    }
    const policy_types = [...byType.keys()]
      .sort((a, b) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b))
      .map((type) => ({ type, frameworks: byType.get(type) }));
    return res.status(200).json({ frameworks, policy_types, template_count: templates.length });
  },
});
