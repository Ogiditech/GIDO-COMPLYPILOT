// Shared risk validation + loading (used by api/risks/index.js and api/risks/[id].js)
import { bad, clampInt, isDate, isUuid, notFound } from './http.js';

export const RISK_STATUSES = ['Open', 'Mitigated', 'Closed'];

export function validateRisk(input) {
  const title = String(input.title ?? '').trim();
  if (!title) throw bad('Give the risk a short, clear description.');
  if (title.length > 200) throw bad('Keep the risk title under 200 characters.');
  const likelihood = clampInt(input.likelihood, 1, 5);
  const impact = clampInt(input.impact, 1, 5);
  if (!likelihood || !impact) throw bad('Likelihood and impact must each be between 1 and 5.');
  const status = input.status ?? 'Open';
  if (!RISK_STATUSES.includes(status)) throw bad('Status must be Open, Mitigated or Closed.');
  const due = input.due_date || null;
  if (due !== null && !isDate(due)) throw bad('Due date must be a valid date.');
  const owner = input.owner_user_id || null;
  if (owner !== null && !isUuid(owner)) throw bad('Please choose a valid owner.');
  const linked = input.linked_policy_id || null;
  if (linked !== null && !isUuid(linked)) throw bad('Please choose a valid policy.');
  return {
    title, description: String(input.description ?? '').trim() || null,
    likelihood, impact, status, due_date: due, owner_user_id: owner, linked_policy_id: linked,
  };
}

/** Ensures owner and linked policy belong to the same organisation */
export async function checkRefs(sql, orgId, r) {
  if (r.owner_user_id) {
    const u = await sql`SELECT 1 FROM users WHERE id = ${r.owner_user_id} AND organisation_id = ${orgId}`;
    if (!u.length) throw bad('That owner isn\'t part of your organisation.');
  }
  if (r.linked_policy_id) {
    const p = await sql`SELECT 1 FROM policies WHERE id = ${r.linked_policy_id} AND organisation_id = ${orgId}`;
    if (!p.length) throw bad('That policy isn\'t in your library.');
  }
}

export async function loadRisks(sql, orgId, id = null) {
  const rows = await sql`
    SELECT r.id, r.title, r.description, r.likelihood, r.impact, (r.likelihood * r.impact)::int AS score,
           r.status, r.due_date::text AS due_date, r.created_at,
           r.owner_user_id, u.full_name AS owner, r.linked_policy_id, p.title AS linked_policy_title
    FROM risks r
    LEFT JOIN users u ON u.id = r.owner_user_id
    LEFT JOIN policies p ON p.id = r.linked_policy_id
    WHERE r.organisation_id = ${orgId} AND (${id}::uuid IS NULL OR r.id = ${id}::uuid)
    ORDER BY (r.likelihood * r.impact) DESC, r.created_at DESC`;
  if (id && !rows.length) throw notFound('We couldn\'t find that risk.');
  return rows;
}
