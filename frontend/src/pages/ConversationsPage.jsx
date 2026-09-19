import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  Download,
  FileText,
  Smartphone,
  Sparkles,
  Bot,
  User,
  CheckCheck,
  RefreshCw,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  SlidersHorizontal
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const quickReplies = [
  "Hello! How can I assist you today?",
  "Our support team has logged your inquiry.",
  "You can view full pricing at https://whatsai.ai/pricing",
  "Is there anything else I can clarify for you?"
];

const ConversationsPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Resizable contacts slider state
  const [contactsWidth, setContactsWidth] = useState(() => {
    const saved = localStorage.getItem('whatsai_contacts_width');
    return saved ? Math.max(240, Math.min(550, parseInt(saved, 10))) : 340;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(340);
  const chatBottomRef = useRef(null);
  const { setSimulatorOpen } = useAuth();

  // Mouse drag handler for the slider
  const handleSliderMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = contactsWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const delta = e.clientX - dragStartXRef.current;
      const newWidth = Math.min(Math.max(dragStartWidthRef.current + delta, 220), 550);
      setContactsWidth(newWidth);
      if (isCollapsed && newWidth > 220) setIsCollapsed(false);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        localStorage.setItem('whatsai_contacts_width', contactsWidth.toString());
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, contactsWidth, isCollapsed]);

  // Fetch users list
  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data);
      if (res.data.length > 0 && !selectedUser) {
        setSelectedUser(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch messages for selected user
  const fetchMessages = async (userId) => {
    if (!userId) return;
    setLoadingMessages(true);
    try {
      const res = await api.get(`/api/messages?user_id=${userId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedUser || sending) return;

    setSending(true);
    try {
      const res = await api.post('/api/send-message', {
        user_id: selectedUser.id,
        message: text
      });
      setMessages((prev) => [...prev, res.data]);
      setInputText('');
      fetchUsers();
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  const handleExportCSV = () => {
    if (!selectedUser) return;
    window.open(`/api/export/csv?user_id=${selectedUser.id}`, '_blank');
  };

  const handleExportPDF = () => {
    if (!selectedUser) return;
    window.open(`/api/export/pdf?user_id=${selectedUser.id}`, '_blank');
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.phone.toLowerCase().includes(q) ||
      (u.last_message && u.last_message.toLowerCase().includes(q))
    );
  });

  const effectiveWidth = isCollapsed ? 64 : contactsWidth;

  return (
    <div className="flex-1 min-h-0 h-full w-full rounded-2xl bg-slate-900/70 border border-slate-800 flex overflow-hidden shadow-sm relative">
      {/* Left Sidebar: Contact Thread List with Resizable Slider */}
      <div
        style={{ width: `${effectiveWidth}px`, minWidth: `${effectiveWidth}px`, maxWidth: `${effectiveWidth}px` }}
        className="border-r border-slate-800 flex flex-col h-full bg-slate-950/70 shrink-0 min-h-0 transition-[width] duration-100 ease-out overflow-hidden"
      >
        {/* Search & Slider Controls Header */}
        <div className="p-3 border-b border-slate-800 space-y-2.5 shrink-0 bg-slate-900/50">
          <div className="flex items-center justify-between gap-1">
            {!isCollapsed ? (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider truncate">Contacts</h2>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono shrink-0">
                    {users.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setSimulatorOpen(true)}
                    title="Launch WhatsApp Webhook Simulator"
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center gap-1 transition-colors"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span className="hidden sm:inline">Simulate</span>
                  </button>
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? "Expand Contacts List" : "Collapse Contacts List"}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full flex items-center justify-center">
                <button
                  onClick={() => setIsCollapsed(false)}
                  title="Expand Contacts Panel"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            )}
          </div>

          {/* Search Bar (shown when expanded) */}
          {!isCollapsed && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contact name, phone..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Contact List */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden divide-y divide-slate-800/40">
          {loadingUsers ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading contacts...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No contacts found.</div>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedUser?.id === user.id;
              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  title={`${user.name || 'WhatsApp Contact'} (${user.phone})`}
                  className={`p-3 flex items-center gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600/15 border-l-4 border-blue-500'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  {/* Contact Avatar */}
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>

                  {/* Contact Details (Visible when expanded) */}
                  {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-100 truncate">
                          {user.name || 'WhatsApp Contact'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {user.last_active ? new Date(user.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{user.phone}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {user.last_message || 'No messages yet'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom width indicator & quick slider adjustment buttons */}
        {!isCollapsed && (
          <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
            <span className="flex items-center gap-1 font-mono">
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
              <span>{contactsWidth}px</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setContactsWidth(260)}
                className={`px-1.5 py-0.5 rounded transition-colors ${contactsWidth <= 280 ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                Compact
              </button>
              <button
                onClick={() => setContactsWidth(340)}
                className={`px-1.5 py-0.5 rounded transition-colors ${contactsWidth > 280 && contactsWidth <= 380 ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                Default
              </button>
              <button
                onClick={() => setContactsWidth(440)}
                className={`px-1.5 py-0.5 rounded transition-colors ${contactsWidth > 380 ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                Wide
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Draggable Divider Slider Handle */}
      <div
        onMouseDown={handleSliderMouseDown}
        onDoubleClick={() => setContactsWidth(340)}
        className={`w-2.5 -ml-1 cursor-col-resize select-none shrink-0 flex items-center justify-center z-10 transition-colors ${
          isDragging ? 'bg-blue-500 shadow-lg' : 'hover:bg-blue-500/30 bg-transparent'
        }`}
        title="Drag slider left/right to resize contacts list (Double-click to reset)"
      >
        <div className="w-1 h-8 rounded-full bg-slate-700 hover:bg-blue-400 flex items-center justify-center transition-colors">
          <GripVertical className="w-3 h-3 text-slate-400 opacity-60 pointer-events-none" />
        </div>
      </div>

      {/* Right Main Chat View */}
      {selectedUser ? (
        <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden bg-[#090D16]/70">
          {/* Conversation Header */}
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 shrink-0 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                {selectedUser.name ? selectedUser.name[0].toUpperCase() : 'W'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-tight truncate">{selectedUser.name || 'WhatsApp Contact'}</h3>
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    WhatsApp
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate">{selectedUser.phone}</p>
              </div>
            </div>

            {/* Actions: Export PDF & CSV */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportCSV}
                title="Export as CSV spreadsheet"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={handleExportPDF}
                title="Print or Export as PDF transcript"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3.5 bg-[#090D16]/50 min-w-0">
            {loadingMessages ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Loading transcript...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                <Bot className="w-8 h-8 text-slate-600" />
                <p>No messages recorded for this user yet.</p>
                <p>Send a message below or trigger the simulator to begin.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === 'user' ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl p-3.5 shadow-sm relative ${
                      m.role === 'user'
                        ? 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-none'
                        : 'bg-blue-600 text-white rounded-tr-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1 text-[11px]">
                      <span className="font-semibold flex items-center gap-1 opacity-90">
                        {m.role === 'user' ? (
                          <>
                            <User className="w-3 h-3 text-emerald-400" />
                            {selectedUser.name || 'User'}
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-cyan-200" />
                            WhatsAI (Gemini 2.5)
                          </>
                        )}
                      </span>
                      {m.latency_ms > 0 && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          m.role === 'user' ? 'bg-slate-900 text-cyan-300' : 'bg-blue-700 text-blue-100'
                        }`}>
                          {m.latency_ms}ms
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">{m.message}</p>

                    <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] opacity-75 font-mono">
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {m.role === 'assistant' && <CheckCheck className="w-3 h-3 text-cyan-200" />}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Replies Tray */}
          <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800/70 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0 min-w-0 scrollbar-none">
            <span className="text-slate-500 font-medium shrink-0">Quick prompts:</span>
            {quickReplies.map((reply, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputText(reply)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 whitespace-nowrap border border-slate-800 transition-colors shrink-0"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Message Input Footer */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2.5 shrink-0 min-w-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Send WhatsApp reply to ${selectedUser.name || selectedUser.phone}...`}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors min-w-0"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
            >
              {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Send</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm">
          Select a contact to view transcript
        </div>
      )}
    </div>
  );
};

export default ConversationsPage;
