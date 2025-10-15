// api/index.js
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { osdkRouter } from './routes/osdk.js';
import { consentRouter } from './routes/consent.js';
import { contextRouter } from './routes/context.js';

const app = express();

// --- CORS allowlist (prod + previews + local) ---
const ORIGIN_RULES = [
  // Production domains you gave me:
  /^https:\/\/healthtech-spa(?:-[a-z0-9-]+)?\.vercel\.app$/i,
  /^https:\/\/fintech-spa-tan(?:-[a-z0-9-]+)?\.vercel\.app$/i,

  // Local dev
  'http://localhost:5173',
  'http://localhost:5174',
];

function isAllowedOrigin(origin) {
  return ORIGIN_RULES.some(rule =>
    typeof rule === 'string' ? rule === origin : rule.test(origin)
  );
}

const corsOptions = {
  origin(origin, cb) {
    // allow server-to-server / curl (no Origin header)
    if (!origin) return cb(null, true);
    if (isAllowedOrigin(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  // include both cases to satisfy strict preflight checks
  allowedHeaders: ['Content-Type', 'X-Org-Key', 'x-org-key'],
  maxAge: 86400,
  credentials: false,
};

// CORS first (preflight + routes)
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Hardening & essentials
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

// Routers
osdkRouter(app);
consentRouter(app);
contextRouter(app);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    env: { node_env: process.env.NODE_ENV, port: process.env.PORT },
    db: !!process.env.DATABASE_URL,
  });
});

// Root — helps when opening the API URL in a browser
app.get('/', (_req, res) => {
  res.type('text/plain').send(
    [
      'Inthra API',
      'Endpoints:',
      '  • GET  /health',
      '  • POST /osdk/chat',
    ].join('\n')
  );
});

// Export the Express app for Vercel
export default app;

// Local dev server (skipped on Vercel/AWS)
if (!process.env.VERCEL && !process.env.AWS_REGION) {
  const port = process.env.PORT || 8787;
  app.listen(port, () => console.log(`API listening on :${port}`));
}
