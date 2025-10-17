import React, { useMemo, useState } from 'react';
import Modal from './components/Modal.jsx';
import Badge from './components/Badge.jsx';
import { osdkChat } from './lib/osdk.js';
import { downloadJSON, downloadText } from './lib/download.js';

const ORG_NAME = import.meta.env.VITE_ORG_NAME || 'Acme Health Org';

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

  const prompt = useMemo(() => `Given the sanitized patient intake below, list 6–10 documents a patient should bring for hospital registration and care. Then add a short instruction block.\n\n${JSON.stringify(form)}`, [form]);

  async function onGenerate() {
    setLoading(true);
    setResult(null);
    try {
      const { content } = await osdkChat({
        policyKey: 'health_pii_phi',
        messages: [
          { role: 'system', content: 'You generate hospital document checklists.' },
          { role: 'user', content: prompt }
        ]
      });
      setResult(content);
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
      {/* Enhanced Tech Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Reinstated Animated Orbs */}
        <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-teal-300/10 blur-3xl animate-float" />
        
        {/* Additional Tech Elements */}
        <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-blue-400/5 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        
        {/* Circuit Board Grid */}
        <div className="absolute inset-0 opacity-[0.02] bg-[length:60px_60px] bg-[linear-gradient(to_right,#1e40af_1px,transparent_1px),linear-gradient(to_bottom,#1e40af_1px,transparent_1px)]" />
        
        {/* Floating Tech Elements */}
        <div className="absolute top-20 left-10 w-6 h-6 rounded-full border-2 border-blue-400/20 animate-pulse" />
        <div className="absolute top-40 right-20 w-4 h-4 rounded-full bg-teal-400/10 animate-bounce" />
        <div className="absolute bottom-32 left-1/4 w-8 h-8 border border-blue-300/10 rotate-45 animate-pulse" />
        <div className="absolute top-1/2 right-32 w-3 h-3 rounded-full bg-blue-500/10 animate-ping" />
        
        {/* Data Flow Lines */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent animate-pulse" />
        <div className="absolute bottom-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-teal-400/10 to-transparent animate-pulse" />
      </div>

      {/* Slimmer Enhanced Tech Banner Header */}
      <header className="bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-2xl sticky top-0 z-50">
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-sm grid place-items-center border border-white/30 shadow-lg">
                  <span className="text-xl sm:text-2xl">🩺</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                    HEALTHTECH AI
                  </h1>
                  <p className="text-blue-100 text-sm sm:text-base font-medium truncate">
                    Document Checklist Generator
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <Badge variant="premium" size="md" className="whitespace-nowrap">
                  {ORG_NAME}
                </Badge>
                <div className="hidden sm:flex items-center gap-2 text-xs text-blue-100">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  SECURE
                </div>
              </div>
            </div>
            
            {/* Compact Tech Stats Bar with Aggressive Security */}
            <div className="mt-3 flex items-center justify-between text-xs text-blue-100">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span>ENCRYPTED</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  <span>HIPAA COMPLIANT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-red-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">PII LOCKED</span>
                </div>
              </div>
              
              {/* Conversion-Focused Powered By Section */}
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                <svg className="w-3.5 h-3.5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-bold text-white">
                  SECURED BY <span className="text-green-300">InthraOS</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 sm:py-8">
        <section className="max-w-6xl mx-auto bg-white/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-gray-200/60 shadow-2xl">
          {/* Security Trust Bar */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200/60">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-green-700">HIPAA Certified</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.5 1A1.5 1.5 0 001 2.5v13A1.5 1.5 0 002.5 17h15a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0017.5 1h-15zm0 2h15a.5.5 0 01.5.5v13a.5.5 0 01-.5.5h-15a.5.5 0 01-.5-.5v-13a.5.5 0 01.5-.5z" />
                  <path d="M5 5.5a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5zM5 8.5a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5zM5 11.5a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5z" />
                </svg>
                <span className="text-sm font-semibold text-blue-700">Data Encrypted</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-green-300 shadow-sm">
              <svg className="w-4 h-4 text-green-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-bold text-green-700">PATIENT DATA SECURE</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Patient Intake Form</h2>
            <div className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full self-start">
              DEMO MODE • SANITIZED DATA
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Object.keys(form).map((k) => (
              <label key={k} className="block">
                <span className="block mb-2 font-medium text-gray-700 text-sm sm:text-base capitalize">
                  {k.replaceAll('_', ' ')}
                </span>
                <input
                  type="text"
                  value={form[k]}
                  onChange={e => setForm({ ...form, [k]: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white text-teal-700 border border-gray-300 focus:outline-none focus:ring-2 sm:focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all duration-200 text-sm sm:text-base"
                />
              </label>
            ))}
          </div>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onGenerate} 
              disabled={loading}
              className="flex-1 px-4 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold hover:from-blue-600 hover:to-teal-600 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  GENERATING...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  GENERATE SECURE CHECKLIST
                </span>
              )}
            </button>
            <button 
              onClick={() => setForm({ ...form })} 
              className="px-4 sm:px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 border border-gray-300 transition-all duration-200 text-sm sm:text-base"
            >
              Reset Form
            </button>
          </div>

          {/* Enhanced Trust Footer */}
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Enterprise-Grade Security</span>
              </div>
              <div className="w-px h-3 bg-gray-300"></div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>PII Protection Active</span>
              </div>
              <div className="w-px h-3 bg-gray-300"></div>
              <div className="flex items-center gap-1.5 font-semibold text-blue-600">
                <span>🔒</span>
                <span>Powered by InthraOS Security</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Modal 
        open={open} 
        onClose={() => setOpen(false)} 
        title="Hospital Document Checklist"
        actions={[
          <button key="md" onClick={exportMD} className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors text-sm sm:text-base">
            Download .md
          </button>,
          <button key="json" onClick={exportJSON} className="px-4 py-2 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors text-sm sm:text-base">
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