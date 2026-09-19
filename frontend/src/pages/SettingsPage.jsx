import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Bot,
  Sparkles,
  Key,
  Copy,
  Check,
  Save,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Send,
  CheckCircle2,
  XCircle,
  Terminal,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    auto_reply: true,
    system_prompt: '',
    gemini_model: 'gemini-2.5-flash',
    context_limit: 10,
    temperature: 0.7,
    max_tokens: 800,
    meta_phone_number_id: '',
    meta_verify_token: 'whatsai_secure_verify_token_2026',
    has_meta_token: false,
    has_gemini_key: false,
    gemini_api_key_masked: '',
    meta_access_token_masked: ''
  });

  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaAppSecret, setMetaAppSecret] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showMetaToken, setShowMetaToken] = useState(false);

  // Testing states
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState(null);

  const [testMetaPhone, setTestMetaPhone] = useState('');
  const [testingMeta, setTestingMeta] = useState(false);
  const [metaTestResult, setMetaTestResult] = useState(null);

  const [guideOpen, setGuideOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const { autoReplyEnabled, toggleAutoReply } = useAuth();

  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/settings');
      setSettings(res.data);
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const payload = {
        auto_reply: settings.auto_reply,
        system_prompt: settings.system_prompt,
        gemini_model: settings.gemini_model,
        context_limit: Number(settings.context_limit),
        temperature: Number(settings.temperature),
        max_tokens: Number(settings.max_tokens),
        meta_phone_number_id: settings.meta_phone_number_id,
        meta_verify_token: settings.meta_verify_token
      };

      if (geminiApiKey.trim()) {
        payload.gemini_api_key = geminiApiKey.trim();
      }
      if (metaAccessToken.trim()) {
        payload.meta_access_token = metaAccessToken.trim();
      }
      if (metaAppSecret.trim()) {
        payload.meta_app_secret = metaAppSecret.trim();
      }

      const res = await api.put('/api/settings', payload);
      setSettings(res.data);
      toggleAutoReply(res.data.auto_reply);
      setGeminiApiKey('');
      setMetaAccessToken('');
      setMetaAppSecret('');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const res = await api.post('/api/settings/test-gemini', {
        api_key: geminiApiKey.trim() || undefined,
        model: settings.gemini_model
      });
      setGeminiTestResult(res.data);
      if (res.data.success) {
        fetchSettings();
      }
    } catch (err) {
      setGeminiTestResult({
        success: false,
        message: err.response?.data?.detail || err.message || 'Connection test failed.'
      });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleTestMeta = async (e) => {
    e?.preventDefault();
    if (!testMetaPhone.trim()) return;

    setTestingMeta(true);
    setMetaTestResult(null);
    try {
      const res = await api.post('/api/settings/test-meta', {
        phone_number: testMetaPhone.trim()
      });
      setMetaTestResult(res.data);
    } catch (err) {
      setMetaTestResult({
        success: false,
        error: err.response?.data?.detail || err.message || 'Failed to send test message.'
      });
    } finally {
      setTestingMeta(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'webhook') {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Engine & Live WhatsApp Setup</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Connect your live Google Gemini API key and Meta WhatsApp Cloud API credentials for actual WhatsApp messaging.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{savedSuccess ? 'Credentials Saved!' : 'Save Credentials'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Credentials updated successfully! Active WhatsApp webhook messages will now use your credentials.</span>
        </div>
      )}

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Google Gemini AI</p>
              <p className="text-[11px] text-slate-400">
                {settings.has_gemini_key ? 'Live API Key Active' : 'Simulation Fallback Mode'}
              </p>
            </div>
          </div>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
            settings.has_gemini_key
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {settings.has_gemini_key ? '● Live Ready' : '○ Key Missing'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Meta WhatsApp Cloud API</p>
              <p className="text-[11px] text-slate-400">
                {settings.has_meta_token ? 'Access Token Configured' : 'Awaiting Meta Token'}
              </p>
            </div>
          </div>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
            settings.has_meta_token
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {settings.has_meta_token ? '● Connected' : '○ Setup Required'}
          </span>
        </div>
      </div>

      {/* Step-by-Step Instructions Collapsible Box */}
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => setGuideOpen(!guideOpen)}
          className="w-full px-5 py-3.5 bg-slate-900/60 hover:bg-slate-900/80 flex items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Simple 4-Step Guide: How to Get Keys & Connect Real WhatsApp
            </span>
          </div>
          {guideOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {guideOpen && (
          <div className="p-5 space-y-4 text-xs text-slate-300 border-t border-slate-800/80">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-semibold">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Get Free Google Gemini Key</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>, sign in with your Google account, click <b>"Create API key"</b>, copy it, and paste it into the Gemini API Key field below.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Get Meta WhatsApp Credentials</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Log in to <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">Meta for Developers</a> &rarr; Select or create an App (type "Business") &rarr; Click <b>WhatsApp &rarr; API Setup</b>. Copy the <b>Phone number ID</b> and <b>Temporary Access Token</b>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Expose Port 8000 (Public Tunnel)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Meta servers require an HTTPS URL to send incoming messages. Open a terminal on your PC and run:
                  <code className="block mt-1 p-1.5 rounded bg-slate-900 font-mono text-cyan-300 text-[10px]">npx localtunnel --port 8000</code>
                  or <code className="text-cyan-300">ngrok http 8000</code> to get your public HTTPS URL.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-semibold">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">4</span>
                  <span>Configure Meta Webhook</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  In Meta Developer Portal &rarr; WhatsApp &rarr; Configuration &rarr; click <b>Edit Webhook</b>.
                  Paste Callback URL: <code className="text-purple-300 font-mono">https://&lt;tunnel&gt;/api/webhook</code> and Verify Token: <code className="text-purple-300 font-mono">whatsai_secure_verify_token_2026</code>. Click <b>Verify and Save</b>, then click <b>Manage Webhook fields</b> and subscribe to <b>messages</b>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1. Google Gemini API Configuration */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">1. Google Gemini AI Configuration</h3>
          </div>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>Get Free API Key</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5">
            Gemini API Key
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder={settings.gemini_api_key_masked || "Paste your AIzaSy... key here"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleTestGemini}
              disabled={testingGemini || (!geminiApiKey.trim() && !settings.has_gemini_key)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-blue-300 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
            >
              {testingGemini ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{testingGemini ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>

          {/* Test Result Callout */}
          {geminiTestResult && (
            <div className={`mt-2.5 p-3 rounded-xl border text-xs flex items-start gap-2 ${
              geminiTestResult.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}>
              {geminiTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{geminiTestResult.success ? 'Gemini Connected!' : 'Connection Failed'}</p>
                <p className="text-[11px] opacity-90 mt-0.5">{geminiTestResult.message}</p>
                {geminiTestResult.latency_ms > 0 && (
                  <p className="text-[10px] opacity-75 mt-1 font-mono">Response time: {geminiTestResult.latency_ms}ms</p>
                )}
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400 mt-1.5">
            Free forever from Google AI Studio. Used by the assistant to understand user questions and compose replies.
          </p>
        </div>

        {/* Model & Hyperparameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Model Version</label>
            <select
              value={settings.gemini_model}
              onChange={(e) => setSettings({ ...settings, gemini_model: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Context Memory</label>
              <span className="text-xs font-mono text-blue-400 font-medium">{settings.context_limit} msgs</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={settings.context_limit}
              onChange={(e) => setSettings({ ...settings, context_limit: parseInt(e.target.value) })}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Temperature</label>
              <span className="text-xs font-mono text-cyan-400 font-medium">{settings.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.temperature}
              onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>

        {/* System Prompt Instructions */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-300">System Instruction Prompt</label>
            <span className="text-[10px] text-slate-400 font-mono">{'{user_name}'}, {'{phone}'} supported</span>
          </div>
          <textarea
            rows={4}
            value={settings.system_prompt}
            onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
            placeholder="Define the behavior, rules, and boundaries for Gemini..."
          />
        </div>
      </div>

      {/* 2. Meta WhatsApp Cloud API Credentials */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">2. Meta WhatsApp Cloud API Credentials</h3>
          </div>
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>Meta App Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Access Token */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5">
            Meta Access Token (Temporary Token or System User Permanent Token)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type={showMetaToken ? 'text' : 'password'}
              value={metaAccessToken}
              onChange={(e) => setMetaAccessToken(e.target.value)}
              placeholder={settings.meta_access_token_masked || "Paste EAAG... access token here"}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowMetaToken(!showMetaToken)}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
            >
              {showMetaToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            From Meta Developer Portal &rarr; WhatsApp &rarr; API Setup (Temporary token works for 24h testing).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phone Number ID */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              WhatsApp Phone Number ID
            </label>
            <input
              type="text"
              value={settings.meta_phone_number_id}
              onChange={(e) => setSettings({ ...settings, meta_phone_number_id: e.target.value })}
              placeholder="e.g. 105928374829103"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <p className="text-[10px] text-slate-500 mt-1">Found under WhatsApp &rarr; API Setup &rarr; Phone number ID</p>
          </div>

          {/* App Secret */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Meta App Secret (Optional HMAC validation)
            </label>
            <input
              type="password"
              value={metaAppSecret}
              onChange={(e) => setMetaAppSecret(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <p className="text-[10px] text-slate-500 mt-1">Found in App Settings &rarr; Basic &rarr; App Secret</p>
          </div>
        </div>

        {/* Live Test WhatsApp Ping */}
        <div className="pt-2 border-t border-slate-800/80">
          <label className="text-xs font-medium text-slate-300 block mb-1.5">
            Send Test WhatsApp Message to Your Phone
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={testMetaPhone}
              onChange={(e) => setTestMetaPhone(e.target.value)}
              placeholder="Your phone number with country code, e.g. +919876543210"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="button"
              onClick={handleTestMeta}
              disabled={testingMeta || !testMetaPhone.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
            >
              {testingMeta ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{testingMeta ? 'Sending...' : 'Send Test Ping'}</span>
            </button>
          </div>

          {metaTestResult && (
            <div className={`mt-2.5 p-3 rounded-xl border text-xs flex items-start gap-2 ${
              metaTestResult.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}>
              {metaTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{metaTestResult.success ? 'WhatsApp Message Sent!' : 'Send Failed'}</p>
                <p className="text-[11px] opacity-90 mt-0.5">{metaTestResult.success ? 'Check your WhatsApp on your phone now.' : metaTestResult.error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Webhook Configuration Details */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mt-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Webhook Callback Details for Meta Developer Portal</span>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">
                1. Webhook Callback URL:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={settings.webhook_url || "https://exjvd-103-68-11-123.free.pinggy.net/api/webhook"}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(settings.webhook_url || "https://exjvd-103-68-11-123.free.pinggy.net/api/webhook", 'webhook')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">
                2. Webhook Verify Token:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settings.meta_verify_token}
                  onChange={(e) => setSettings({ ...settings, meta_verify_token: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-300"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(settings.meta_verify_token, 'token')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
