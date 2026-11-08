// Activity log helper. Returns a (lazy) query so it can be included in sql.transaction([...]).
export function logActivity(sql, user, action, entityType, entityId) {
  return sql`
    INSERT INTO activity_log (organisation_id, user_id, action, entity_type, entity_id)
    VALUES (${user.organisation_id}, ${user.id}, ${action}, ${entityType}, ${entityId ? String(entityId) : null})`;
}
