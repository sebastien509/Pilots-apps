// api/index.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";

import { osdkRouter } from "./routes/osdk.js";
import { consentRouter } from "./routes/consent.js";
import { contextRouter } from "./routes/context.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));

osdkRouter(app);
consentRouter(app);
contextRouter(app);

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    env: { node_env: process.env.NODE_ENV, port: process.env.PORT },
    db: !!process.env.DATABASE_URL
  });
});

export default app;               // <— This is what Vercel runs

// Local-only
if (!process.env.VERCEL && !process.env.AWS_REGION) {
  const port = process.env.PORT || 8787;
  app.listen(port, () => console.log(`API listening on :${port}`));
}
