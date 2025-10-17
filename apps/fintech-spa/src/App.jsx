// src/App.jsx
import React, { useMemo, useState } from 'react';
import Modal from './components/Modal.jsx';
import Badge from './components/Badge.jsx';
import { osdkChat } from './lib/osdk.js';
import { downloadJSON, downloadText } from './lib/download.js';

const ORG_NAME = import.meta.env.VITE_ORG_NAME || 'Acme Health Org';
const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '');
const ORG_KEY  = import.meta.env.VITE_ORG_KEY || 'DEMO_ORG_KEY';

export default function App() {
  const [form, setForm] = useState({
    full_name: 'Ava Johnson',
    email: 'ava.johnson@example.com',
    phone: '+1 (415) 555-1212',
    address: '123 Market St, San Francisco, CA',
    dob: '1989-04-17',
    ssn: '123-45-6789',
    mrn: 'MRN-88A31K',
    insurance_provider: 'BlueCross',
    insurance_member_id: 'BC-99887766',
    reason_for_visit: 'Pre-op consult'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(false);

  // NEW: track the session we’ll show in the drawer
  const [lastSessionId, setLastSessionId] = useState('');

  const prompt = useMemo(
    () =>
      `Given the sanitized patient intake below, list 6–10 documents a patient should bring for hospital registration and care. Then add a short instruction block.\n\n${JSON.stringify(
        form
      )}`,
    [form]
  );

  async function onGenerate() {
    setLoading(true);
    setResult(null);
    try {
      const { content, meta } = await osdkChat({
        policyKey: 'health_pii_phi',
        messages: [
          { role: 'system', content: 'You generate hospital document checklists.' },
          { role: 'user', content: prompt }
        ]
      });
      setResult(content);
      setLastSessionId(meta?.session || '');  // <-- save session for egress drawer
      setOpen(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  function exportMD() {
    const md = `# Hospital Document Checklist\n\n**Patient (sanitized)**: ${form.full_name}\n\n${result}`;
    downloadText('hospital-checklist.md', md);
  }

  function exportJSON() {
    downloadJSON('hospital-checklist.json', { input: form, result });
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* (… your header / body unchanged …) */}

      {/* Results modal with the privacy drawer embedded */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Hospital Document Checklist"
        // NEW: pass API base, orgKey, and session so the modal’s drawer can fetch
        apiBase={API_BASE}
        orgKey={ORG_KEY}
        sessionId={lastSessionId}
        actions={[
          <button
            key="md"
            onClick={exportMD}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors text-sm sm:text-base"
          >
            Download .md
          </button>,
          <button
            key="json"
            onClick={exportJSON}
            className="px-4 py-2 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors text-sm sm:text-base"
          >
            Download .json
          </button>
        ]}
      >
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed font-sans text-sm sm:text-base">
            {result || '—'}
          </pre>
        </div>
      </Modal>
    </div>
  );
}
