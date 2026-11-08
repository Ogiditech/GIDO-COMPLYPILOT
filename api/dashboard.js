// GET /api/dashboard: compliance score, cards, upcoming reviews and activity for the user's organisation
import { getSql } from './_lib/db.js';
import { route } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';

export default route({
  async GET(req, res) {
    const user = await requireUser(req);
    const org = user.organisation_id;
    const sql = getSql();

    const [p, r, a, upcoming, activity] = await Promise.all([
      sql`SELECT count(*)::int AS total,
                 count(*) FILTER (WHERE status = 'Active')::int AS active,
                 count(*) FILTER (WHERE status = 'Active' AND (next_review_date IS NULL OR next_review_date >= CURRENT_DATE))::int AS active_in_date,
                 count(*) FILTER (WHERE status <> 'Expired' AND next_review_date <= CURRENT_DATE + 30)::int AS due_soon,
                 count(*) FILTER (WHERE status <> 'Expired' AND next_review_date < CURRENT_DATE)::int AS overdue
          FROM policies WHERE organisation_id = ${org}`,
      sql`SELECT count(*) FILTER (WHERE status = 'Open')::int AS open,
                 count(*) FILTER (WHERE likelihood * impact >= 15)::int AS high_total,
                 count(*) FILTER (WHERE likelihood * impact >= 15 AND status IN ('Mitigated', 'Closed'))::int AS high_mitigated,
                 count(*) FILTER (WHERE likelihood * impact >= 15 AND status = 'Open')::int AS high_open
          FROM risks WHERE organisation_id = ${org}`,
      sql`SELECT count(*)::int AS total,
                 count(*) FILTER (WHERE a.status = 'Signed')::int AS signed,
                 count(*) FILTER (WHERE a.status = 'Pending')::int AS pending
          FROM acknowledgements a JOIN policies p ON p.id = a.policy_id
          WHERE p.organisation_id = ${org}`,
      sql`SELECT p.id, p.title, p.status, p.next_review_date::text AS next_review_date, f.name AS framework, u.full_name AS owner
          FROM policies p
          LEFT JOIN frameworks f ON f.id = p.framework_id
          LEFT JOIN users u ON u.id = p.owner_user_id
          WHERE p.organisation_id = ${org} AND p.next_review_date IS NOT NULL AND p.status <> 'Expired'
          ORDER BY p.next_review_date ASC LIMIT 6`,
      sql`SELECT l.id, l.action, l.entity_type, l.entity_id, l.created_at, COALESCE(u.full_name, 'Someone') AS who
          FROM activity_log l LEFT JOIN users u ON u.id = l.user_id
          WHERE l.organisation_id = ${org}
          ORDER BY l.created_at DESC LIMIT 8`,
    ]);

    const P = p[0]; const R = r[0]; const A = a[0];
    const policyPart = P.total ? P.active_in_date / P.total : 0;
    const ackPart = A.total ? A.signed / A.total : 0;
    const riskPart = R.high_total ? R.high_mitigated / R.high_total : 1;
    const score = P.total ? Math.round(((policyPart + ackPart + riskPart) / 3) * 100) : 0;

    return res.status(200).json({
      score,
      breakdown: {
        policies: Math.round(policyPart * 100),
        acknowledgements: Math.round(ackPart * 100),
        high_risks_mitigated: Math.round(riskPart * 100),
      },
      cards: {
        active_policies: P.active,
        total_policies: P.total,
        due_for_review: P.due_soon,
        overdue: P.overdue,
        open_risks: R.open,
        critical_open_risks: R.high_open,
        pending_acknowledgements: A.pending,
        signed_acknowledgements: A.signed,
        total_acknowledgements: A.total,
      },
      upcoming,
      activity,
    });
  },
});
