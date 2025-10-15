import { v4 as uuid } from 'uuid';
import { pool, getOrgByKey } from '../db.js';

export function contextRouter(app) {
  app.post('/api/contexts', async (req, res) => {
    const orgKey = req.header('X-Org-Key');
    const org = await getOrgByKey(orgKey);
    if (!org) return res.status(403).json({ error: 'invalid org key' });

    const { subject_id, label, json } = req.body || {};
    const id = uuid();

    await pool.query(
      `INSERT INTO contexts (id, org_id, subject_id, label, json)
       VALUES ($1,$2,$3,$4,$5)`,
      [id, org.id, subject_id, label || null, json]
    );

    res.json({ id });
  });

  app.get('/api/contexts/:id', async (req, res) => {
    const orgKey = req.header('X-Org-Key');
    const org = await getOrgByKey(orgKey);
    if (!org) return res.status(403).json({ error: 'invalid org key' });

    const { rows } = await pool.query(
      'SELECT * FROM contexts WHERE id=$1 AND org_id=$2',
      [req.params.id, org.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  });

  app.get('/api/contexts/by-subject/:subjectId/latest', async (req, res) => {
    const orgKey = req.header('X-Org-Key');
    const org = await getOrgByKey(orgKey);
    if (!org) return res.status(403).json({ error: 'invalid org key' });

    const { rows } = await pool.query(
      `SELECT * FROM contexts
       WHERE org_id=$1 AND subject_id=$2
       ORDER BY created_at DESC
       LIMIT 1`,
      [org.id, req.params.subjectId]
    );

    res.json(rows[0] || null);
  });
}
