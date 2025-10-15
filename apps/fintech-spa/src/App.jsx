import React, { useMemo, useState } from 'react';
import Modal from './components/Modal.jsx';
import Badge from './components/Badge.jsx';
import { osdkChat } from './lib/osdk.js';
import { uploadToCloudinary } from './lib/cloudinary.js';
import { downloadJSON, downloadText } from './lib/download.js';

const ORG_NAME = import.meta.env.VITE_ORG_NAME || 'Acme Bank';

export default function App() {
  const [positions, setPositions] = useState([
    { symbol: 'AAPL', quantity: 120, cost_basis: 125.4 },
    { symbol: 'MSFT', quantity: 80, cost_basis: 310.0 },
    { symbol: 'VOO', quantity: 150, cost_basis: 405.1 }
  ]);
  const [account, setAccount] = useState({
    institution: 'Acme Bank', account_type: 'brokerage',
    account_identifier: 'IBAN GB33BUKB20201555555555',
    routing: '021000021',
    card_number: '4111 1111 1111 1111',
    owner_email: 'jordan@example.com',
    owner_phone: '+1-212-555-7733',
    owner_address: '55 Wall Street, New York, NY'
  });

  const [goal, setGoal] = useState('balanced growth with downside protection');
  const [docUrl, setDocUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(false);

  function updatePos(i, key, val) {
    setPositions(prev => prev.map((p, idx) => idx === i ? { ...p, [key]: val } : p));
  }

  async function onUploadDoc(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const data = await uploadToCloudinary(f);
      setDocUrl(data.secure_url);
    } catch (e) { alert(e.message); }
  }

  const payload = useMemo(() => ({
    owner: 'Jordan Miles',
    goal,
    accounts: [account],
    positions
  }), [goal, account, positions]);

  async function onGenerate() {
    setLoading(true); setResult(null);
    try {
      const prompt = `Given this sanitized portfolio, provide risk and rebalance insights, with sector concentration and action list. Never include personal identifiers.\n\n${JSON.stringify(payload)}`;
      const { content } = await osdkChat({
        policyKey: 'fin_pci_pii',
        messages: [
          { role: 'system', content: 'You are a fiduciary-style portfolio analyst.' },
          { role: 'user', content: prompt }
        ]
      });
      setResult(content); setOpen(true);
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  }

  function exportMD() {
    const md = `# Portfolio Insights\n\n**Org**: ${ORG_NAME}\n\n${result}`;
    downloadText('portfolio-insights.md', md);
  }

  function exportJSON() {
    downloadJSON('portfolio-insights.json', { input: payload, docUrl, result });
  }

  return (
    <div className="relative min-h-screen">
      {/* Animated banking grid background */}
      <div className="absolute inset-0 -z-10 animated-grid" />
      
      {/* Security Overlay Elements */}
      <div className="absolute inset-0 -z-10">
        {/* Security Shield Background */}
        <div className="absolute top-10 right-10 opacity-5">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V10.7C15.4,10.9 16,11.3 16,12C16,13.1 15.1,14 14,14C13.6,14 13.3,13.9 13,13.7C12.4,13.9 11.6,13.9 11,13.7C10.7,13.9 10.4,14 10,14C8.9,14 8,13.1 8,12C8,11.3 8.6,10.9 9.2,10.7V10C9.2,8.6 10.6,7 12,7Z"/>
          </svg>
        </div>
        
        {/* GDPR Shield */}
        <div className="absolute bottom-20 left-10 opacity-5">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,3C7,3 3,7 3,12C3,17 7,21 12,21C17,21 21,17 21,12C21,7 17,3 12,3M12,5C15.9,5 19,8.1 19,12C19,15.9 15.9,19 12,19C8.1,19 5,15.9 5,12C5,8.1 8.1,5 12,5M11,10.5H11.5V13.5H11V10.5M12,8.5C11.4,8.5 11,8.9 11,9.5C11,10.1 11.4,10.5 12,10.5C12.6,10.5 13,10.1 13,9.5C13,8.9 12.6,8.5 12,8.5Z"/>
          </svg>
        </div>
        
        {/* PII Lock Icons */}
        <div className="absolute top-1/3 left-1/4 opacity-5">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
          </svg>
        </div>
      </div>

      {/* Enhanced Header with Security Badges */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 grid place-items-center border border-white/20 relative">
            <span className="text-lg">🏦</span>
            {/* Security Badge */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900">
              <div className="w-full h-full flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                  <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                </svg>
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold">Fintech • Portfolio Insights</h1>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <span>Protected by</span>
              <span className="font-bold text-green-400 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V10.7C15.4,10.9 16,11.3 16,12C16,13.1 15.1,14 14,14C13.6,14 13.3,13.9 13,13.7C12.4,13.9 11.6,13.9 11,13.7C10.7,13.9 10.4,14 10,14C8.9,14 8,13.1 8,12C8,11.3 8.6,10.9 9.2,10.7V10C9.2,8.6 10.6,7 12,7Z"/>
                </svg>
                InthraOS
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Security Status Indicators */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-lg border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>PCI DSS</span>
            </div>
            <div className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded-lg border border-blue-500/30">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
              </svg>
              <span>PII Secure</span>
            </div>
          </div>
          
          <Badge className="bg-white/10 border-white/20">
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z"/>
              </svg>
              {ORG_NAME} • Secure Demo
            </div>
          </Badge>
        </div>
      </header>

      {/* Security Status Bar */}
      <div className="px-6 py-2 bg-black/20 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-white/70">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span>Financial Data Encrypted</span>
            </div>
            <div className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,3C7,3 3,7 3,12C3,17 7,21 12,21C17,21 21,17 21,12C21,7 17,3 12,3M12,5C15.9,5 19,8.1 19,12C19,15.9 15.9,19 12,19C8.1,19 5,15.9 5,12C5,8.1 8.1,5 12,5M11,10.5H11.5V13.5H11V10.5M12,8.5C11.4,8.5 11,8.9 11,9.5C11,10.1 11.4,10.5 12,10.5C12.6,10.5 13,10.1 13,9.5C13,8.9 12.6,8.5 12,8.5Z"/>
              </svg>
              <span>GDPR Compliant</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-green-400 font-medium">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
            </svg>
            <span>All Systems Secure • InthraOS Active</span>
          </div>
        </div>
      </div>

      <main className="px-6 pb-20 max-w-6xl mx-auto">
        <section className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2 bg-bank-card rounded-2xl p-6 border border-white/10 relative">
            {/* Security Corner Badge */}
            <div className="absolute -top-2 -right-2 bg-green-500 text-black text-xs px-2 py-1 rounded-lg flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
              </svg>
              PII Protected
            </div>
            
            <h2 className="text-lg font-medium mb-4">Positions</h2>
            <div className="space-y-3">
              {positions.map((p, i) => (
                <div key={i} className="grid grid-cols-3 gap-3">
                  <input className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-green-400/50 transition-colors" value={p.symbol}
                    onChange={e=>updatePos(i,'symbol',e.target.value)} />
                  <input className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-green-400/50 transition-colors" value={p.quantity}
                    onChange={e=>updatePos(i,'quantity',e.target.value)} />
                  <input className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-green-400/50 transition-colors" value={p.cost_basis}
                    onChange={e=>updatePos(i,'cost_basis',e.target.value)} />
                </div>
              ))}
            </div>
            <button onClick={()=>setPositions(p=>[...p,{symbol:'',quantity:0,cost_basis:0}])}
              className="mt-3 px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition-colors flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
              Add Position
            </button>
          </div>

          <div className="bg-bank-card rounded-2xl p-6 border border-white/10 relative">
            {/* Security Corner Badge */}
            <div className="absolute -top-2 -right-2 bg-blue-500 text-black text-xs px-2 py-1 rounded-lg flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,3C7,3 3,7 3,12C3,17 7,21 12,21C17,21 21,17 21,12C21,7 17,3 12,3M12,5C15.9,5 19,8.1 19,12C19,15.9 15.9,19 12,19C8.1,19 5,15.9 5,12C5,8.1 8.1,5 12,5Z"/>
              </svg>
              GDPR Compliant
            </div>

            <h2 className="text-lg font-medium mb-4">Account & Goal</h2>
            {Object.entries(account).map(([k,v])=> (
              <label key={k} className="block text-sm text-white/80 mb-2">
                <span className="block mb-1 capitalize">{k.replaceAll('_',' ')}</span>
                <input className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-green-400/50 transition-colors" value={v}
                  onChange={e=>setAccount(a=>({ ...a, [k]: e.target.value }))} />
              </label>
            ))}
            <label className="block text-sm text-white/80 mb-2">
              <span className="block mb-1">Investment Goal</span>
              <input className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-green-400/50 transition-colors" value={goal}
                onChange={e=>setGoal(e.target.value)} />
            </label>

            <div className="mt-4">
              <label className="block text-sm mb-1 flex items-center gap-2">
                <span>Attach supporting doc (Cloudinary)</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z"/>
                </svg>
              </label>
              <input type="file" onChange={onUploadDoc} className="text-sm" />
              {docUrl && (
                <div className="mt-2 text-xs text-green-400/80 break-all flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                  </svg>
                  Securely uploaded: {docUrl}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 flex gap-3">
          <button onClick={onGenerate} disabled={loading}
            className="px-4 py-2 rounded-xl bg-blue-400 text-black font-medium hover:bg-blue-300 disabled:opacity-50 transition-colors flex items-center gap-2 relative overflow-hidden group">
            
            {/* Animated Security Background */}
            <div className="absolute inset-0 bg-green-400/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  Generating Secure Insights...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z"/>
                  </svg>
                  Generate Secure Insights
                </>
              )}
            </span>
          </button>
        </div>

        {/* Security Footer */}
        <div className="mt-8 p-4 bg-black/20 rounded-xl border border-white/10">
          <div className="flex items-center justify-center gap-6 text-xs text-white/60">
            <div className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z"/>
              </svg>
              <span>Bank-Grade Encryption</span>
            </div>
            <div className="w-px h-3 bg-white/30"></div>
            <div className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,3C7,3 3,7 3,12C3,17 7,21 12,21C17,21 21,17 21,12C21,7 17,3 12,3Z"/>
              </svg>
              <span>GDPR Compliant</span>
            </div>
            <div className="w-px h-3 bg-white/30"></div>
            <div className="flex items-center gap-2 font-medium text-green-400">
              <span>🛡️</span>
              <span>Protected by InthraOS Security</span>
            </div>
          </div>
        </div>
      </main>

      <Modal open={open} onClose={()=>setOpen(false)} title="Portfolio Insights"
        actions={[
          <button key="md" onClick={exportMD} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition-colors flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            Download .md
          </button>,
          <button key="json" onClick={exportJSON} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition-colors flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5,3H7V5H5V10A2,2 0 0,1 3,12A2,2 0 0,1 5,14V19H7V21H5C3.93,20.73 3,20.1 3,19V15A2,2 0 0,0 1,13H0V11H1A2,2 0 0,0 3,9V5A2,2 0 0,1 5,3M19,3A2,2 0 0,1 21,5V9A2,2 0 0,0 23,11H24V13H23A2,2 0 0,0 21,15V19A2,2 0 0,1 19,21H17V19H19V14A2,2 0 0,1 21,12A2,2 0 0,1 19,10V5H17V3H19M12,15A1,1 0 0,1 13,16A1,1 0 0,1 12,17A1,1 0 0,1 11,16A1,1 0 0,1 12,15M8,15A1,1 0 0,1 9,16A1,1 0 0,1 8,17A1,1 0 0,1 7,16A1,1 0 0,1 8,15M16,15A1,1 0 0,1 17,16A1,1 0 0,1 16,17A1,1 0 0,1 15,16A1,1 0 0,1 16,15Z"/>
            </svg>
            Download .json
          </button>
        ]}
      >
        <div className="relative">
          {/* Security Watermark */}
          <div className="absolute top-2 right-2 opacity-20">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z"/>
            </svg>
          </div>
          <pre className="whitespace-pre-wrap text-white/90 leading-relaxed">{result || '—'}</pre>
        </div>
      </Modal>
    </div>
  );
}