import { v4 as uuid } from 'uuid';
import { pool, getOrgByKey } from '../db.js';

export function consentRouter(app) {
  app.post('/api/consents', async (req, res) => {
    const orgKey = req.header('X-Org-Key');
    if (!orgKey) return res.status(401).json({ error: 'missing org key' });
    const org = await getOrgByKey(orgKey);
    if (!org) return res.status(403).json({ error: 'invalid org key' });

    const { subject_id, purpose, scopes = [], version = 'v1', meta = {} } = req.body || {};
    const id = uuid();

    await pool.query(
      `INSERT INTO consents (id, org_id, subject_id, purpose, scopes, version, granted_at, meta)
       VALUES ($1,$2,$3,$4,$5,$6,now(),$7)`,
      [id, org.id, subject_id, purpose, scopes, version, meta]
    );

    res.json({ id });
  });

  app.post('/api/consents/:id/revoke', async (req, res) => {
    const orgKey = req.header('X-Org-Key');
    const org = await getOrgByKey(orgKey);
    if (!org) return res.status(403).json({ error: 'invalid org key' });

    await pool.query(
      'UPDATE consents SET revoked_at=now() WHERE id=$1 AND org_id=$2',
      [req.params.id, org.id]
    );

    res.json({ ok: true });
  });
}
