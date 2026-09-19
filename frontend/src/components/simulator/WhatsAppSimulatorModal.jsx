import React, { useState } from 'react';
import {
  X,
  Send,
  Smartphone,
  Zap,
  CheckCheck,
  Bot,
  User,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const quickPrompts = [
  "Hi! What are your pricing plans?",
  "How fast does the Gemini 2.5 Flash reply?",
  "Can I schedule a product demo for my team?",
  "Can you help me reset my account password?"
];

const WhatsAppSimulatorModal = () => {
  const { simulatorOpen, setSimulatorOpen } = useAuth();
  const [phone, setPhone] = useState('+1 (555) 382-9012');
  const [name, setName] = useState('Alex Rivera');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLog, setChatLog] = useState([
    {
      role: 'assistant',
      text: "Hello Alex! 👋 Welcome to WhatsAI. I'm your AI WhatsApp assistant powered by Gemini 2.5 Flash. Send me any question to test our real-time responses!",
      time: '10:00 AM',
      latency_ms: 190.4
    }
  ]);

  if (!simulatorOpen) return null;

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = inputMessage.trim();
    if (!text || loading) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user', text, time: currentTime };

    setChatLog((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.post('/api/simulator/incoming', {
        phone,
        name,
        message: text
      });

      if (res.data.outgoing_reply) {
        setChatLog((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: res.data.outgoing_reply.message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            latency_ms: res.data.latency_ms
          }
        ]);
      } else {
        setChatLog((prev) => [
          ...prev,
          {
            role: 'system',
            text: '[Message received, but AI Auto-Reply is currently toggled OFF in settings.]',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error("Simulation error", err);
      setChatLog((prev) => [
        ...prev,
        {
          role: 'system',
          text: `Simulation error: ${err.response?.data?.detail || err.message}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top bar */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm text-slate-100">WhatsApp Webhook Simulator</span>
          </div>
          <button
            onClick={() => setSimulatorOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sender configuration pills */}
        <div className="px-5 py-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>Sender:</span>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-slate-200 w-28 text-xs focus:outline-none focus:border-blue-500"
            placeholder="User Name"
          />
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-slate-200 w-36 font-mono text-xs focus:outline-none focus:border-blue-500"
            placeholder="+1 (555) 000-0000"
          />
        </div>

        {/* WhatsApp Mobile Mockup Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0B141A] min-h-[340px]">
          {/* WhatsApp Header badge */}
          <div className="text-center my-1">
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#182229] text-slate-400 border border-slate-800">
              🔒 End-to-end encrypted with Meta WhatsApp Cloud API
            </span>
          </div>

          {chatLog.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : msg.role === 'system' ? 'items-center' : 'items-start'
              }`}
            >
              {msg.role === 'system' ? (
                <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/30 text-amber-300 text-xs text-center max-w-sm">
                  {msg.text}
                </div>
              ) : (
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm relative ${
                    msg.role === 'user'
                      ? 'bg-[#005C4B] text-slate-100 rounded-tr-none'
                      : 'bg-[#202C33] text-slate-100 rounded-tl-none border border-slate-700/40'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 mb-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Gemini 2.5 Flash</span>
                      {msg.latency_ms && (
                        <span className="ml-1 text-[10px] text-slate-400 font-mono">
                          ⚡ {msg.latency_ms}ms
                        </span>
                      )}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{msg.text}</p>

                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                    <span>{msg.time}</span>
                    {msg.role === 'user' && <CheckCheck className="w-3 h-3 text-blue-400" />}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start">
              <div className="bg-[#202C33] text-slate-300 rounded-2xl rounded-tl-none px-4 py-2 text-xs flex items-center gap-2 border border-slate-700/40">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Gemini 2.5 Flash is generating reply...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompt pills */}
        <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
          {quickPrompts.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInputMessage(q)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition-colors border border-slate-700/60"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Input Footer */}
        <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type WhatsApp message as user..."
            disabled={loading}
            className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium transition-colors shadow-sm"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppSimulatorModal;
