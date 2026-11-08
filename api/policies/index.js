// GET  /api/policies: list the organisation's policies
// POST /api/policies: generate a policy from a template, save as Draft v1
import crypto from 'node:crypto';
import { getSql } from '../_lib/db.js';
import { route, body, bad, clampInt } from '../_lib/http.js';
import { requireUser, requireEditor } from '../_lib/auth.js';
import { logActivity } from '../_lib/activity.js';
import { generatePolicy } from '../_lib/policyGenerator.js';

const isoDate = (d) => d.toISOString().slice(0, 10);

export default route({
  async GET(req, res) {
    const user = await requireUser(req);
    const sql = getSql();
    const policies = await sql`
      SELECT p.id, p.title, p.policy_type, p.status, p.current_version,
             p.effective_date::text AS effective_date, p.next_review_date::text AS next_review_date,
             p.created_at, p.updated_at, f.code AS framework_code, f.name AS framework,
             u.full_name AS owner, p.owner_user_id
      FROM policies p
      LEFT JOIN frameworks f ON f.id = p.framework_id
      LEFT JOIN users u ON u.id = p.owner_user_id
      WHERE p.organisation_id = ${user.organisation_id}
      ORDER BY p.updated_at DESC`;
    return res.status(200).json({ policies });
  },

  async POST(req, res) {
    const user = await requireUser(req);
    requireEditor(user);
    const b = body(req);
    const policyType = String(b.policy_type || '');
    const frameworkCode = String(b.framework_code || '');
    if (!policyType) throw bad('Choose a policy type.');
    if (!frameworkCode) throw bad('Choose a framework.');

    const d = b.details || {};
    const org = user.organisation;
    const details = {
      company_name: String(d.company_name || org.name).trim() || org.name,
      industry: String(d.industry || org.industry || '').trim(),
      employee_count: clampInt(d.employee_count ?? org.employee_count, 1, 1_000_000) ?? org.employee_count,
      location: String(d.location || org.emirate_or_country || '').trim(),
    };

    const sql = getSql();
    const rows = await sql`
      SELECT t.id, t.policy_type, t.sections, f.id AS framework_id, f.code, f.name
      FROM policy_templates t JOIN frameworks f ON f.id = t.framework_id
      WHERE t.policy_type = ${policyType} AND f.code = ${frameworkCode}`;
    if (!rows.length) throw bad(`There's no ${policyType} template for that framework yet. Please choose another framework.`);
    const t = rows[0];

    const today = new Date();
    const review = new Date(today); review.setUTCFullYear(review.getUTCFullYear() + 1);
    const effectiveDate = isoDate(today);
    const reviewDate = isoDate(review);

    const doc = await generatePolicy({
      template: { policy_type: t.policy_type, sections: t.sections },
      details,
      framework: { code: t.code, name: t.name },
      include: b.include || {},
      effectiveDate,
      reviewDate,
    });
    if (!doc?.sections?.length) throw bad('The generator returned an empty policy. Please try again.');

    const id = crypto.randomUUID();
    await sql.transaction([
      sql`INSERT INTO policies (id, organisation_id, template_id, title, policy_type, framework_id, status, owner_user_id,
                                current_version, effective_date, next_review_date)
          VALUES (${id}, ${user.organisation_id}, ${t.id}, ${doc.title}, ${t.policy_type}, ${t.framework_id}, 'Draft', ${user.id},
                  1, ${effectiveDate}, ${reviewDate})`,
      sql`INSERT INTO policy_versions (policy_id, version_number, content, change_note, created_by)
          VALUES (${id}, 1, ${JSON.stringify(doc.sections)}::jsonb, ${`Generated from the ${t.name} template`}, ${user.id})`,
      logActivity(sql, user, `generated “${doc.title}” (${t.name})`, 'policy', id),
    ]);

    return res.status(201).json({ id, title: doc.title });
  },
});
