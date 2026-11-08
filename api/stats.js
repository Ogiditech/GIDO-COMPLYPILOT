// GET /api/stats: public counts for the landing page (no organisation data exposed)
import { getSql } from './_lib/db.js';
import { route } from './_lib/http.js';

export default route({
  async GET(req, res) {
    const sql = getSql();
    const [row] = await sql`
      SELECT (SELECT count(*) FROM policies)::int       AS policies_generated,
             (SELECT count(*) FROM organisations)::int  AS organisations_protected,
             (SELECT count(*) FROM frameworks)::int     AS frameworks_covered`;
    return res.status(200).json(row);
  },
});
