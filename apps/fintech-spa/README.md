# InthraOSDK React Examples (Healthtech & Fintech)


These SPAs are **frontend-only** and assume your **reverse proxy** exposes a protected route `/osdk/chat` that connects to the **InthraOSDK Gateway**.


## 0) Prereqs
- Node 18+
- Tailwind included via Vite
- A proxy/API that handles `/osdk/chat` → OSDK Gateway


## 1) Env for local dev
Create `.env.local` in each app (or set vite env):


VITE_API_BASE=http://localhost:8787 # your proxy base (dev)
VITE_ORG_NAME=Acme Demo Org
VITE_ORG_KEY=DEMO_ORG_KEY


# Fintech only (Cloudinary unsigned upload)
VITE_CLOUDINARY_CLOUD=your_cloud
VITE_CLOUDINARY_PRESET=your_unsigned_preset


## 2) Dev
cd apps/healthtech-spa && npm i && npm run dev
cd apps/fintech-spa && npm i && npm run dev


## 3) Proxy Contract (/osdk/chat)
POST /osdk/chat
Content-Type: application/json
X-Org-Key: <org key>
{
"policyKey": "health_pii_phi" | "fin_pci_pii",
"messages": [{"role":"system"|"user"|"assistant","content":"..."}]
}


Response:
{ "content": "...model output...", "meta": {"session":"..."} }


> The proxy should forward to OSDK Gateway with **sanitize + guard** using the policyKey, and send **receipts** to the Control Plane.


## 4) Production Notes
- Enforce org auth & rate-limits at the proxy. No secrets should be exposed to the browser.
- Configure CORS/CSRF on your proxy.
- Use real policy files on the gateway (PII/PHI and PCI/PII).