import React, { useState, useEffect } from 'react';
import { db, auth } from '../core/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { MessageSquare, Send, Paperclip, BrainCircuit, Plus, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Meeting } from '../types';
export const Chat: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetings, setSelectedMeetings] = useState<Meeting[]>([]);
  const [queryText, setQueryText] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; sources?: string[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMeetingPicker, setShowMeetingPicker] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchMeetings = async () => {
      const q = query(collection(db, 'meetings'), where('authorId', '==', auth.currentUser?.uid));
      const snapshot = await getDocs(q);
      setMeetings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meeting)));
    };
    fetchMeetings();
  }, []);

  const handleSend = async () => {
    if (!queryText) return;

    const userMsg = queryText;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQueryText('');
    setLoading(true);

    try {
      const contextMeetings = selectedMeetings.length > 0 ? selectedMeetings : meetings;
      const meetingIds = contextMeetings.map(m => m.id);

      const token = await auth.currentUser?.getIdToken();
      const targetUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

      const response = await fetch(`${targetUrl}/chat-inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: userMsg,
          meetingIds: meetingIds
        })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch from backend chat proxy");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: "Error: Could not reach Narrative Intelligence Hub backend." }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMeeting = (m: Meeting) => {
    setSelectedMeetings(prev =>
      prev.find(p => p.id === m.id) ? prev.filter(p => p.id !== m.id) : [...prev, m]
    );
  };

  return (
    <div className="flex h-full overflow-hidden bg-surface">
      <div className="w-80 bg-surface-container-low border-r border-outline-variant/10 flex flex-col shrink-0">
        <div className="p-6">
          <h2 className="font-headline text-lg font-bold text-on-surface mb-6">Inquiry Hub</h2>
          <div className="space-y-6">
            <section>
              <h3 className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-3">Suggested Questions</h3>
              <div className="flex flex-col gap-2">
                {["What were the main decisions made?", "Who is responsible for the next steps?", "Summarize the overall sentiment."].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQueryText(q)}
                    className="text-left text-xs text-primary font-medium p-2 bg-primary/5 rounded border border-primary/10 hover:bg-primary/10"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center  text-on-surface-variant space-y-4">
              <BrainCircuit className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Ask anything about your meeting intelligence...</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end max-w-2xl ml-auto' : 'items-start max-w-4xl mr-auto'}`}>
              {msg.role === 'ai' && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center">
                    <BrainCircuit className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-tighter">Narrative AI Intelligence</span>
                </div>
              )}
              <div className={`p-5 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-on-surface rounded-tl-none prose prose-sm md:prose-base prose-slate max-w-none prose-headings:font-headline prose-headings:text-primary prose-a:text-blue-600'}`}>
                {msg.role === 'user' ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                ) : (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-primary animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-bold uppercase">Thinking...</span>
            </div>
          )}
        </div>

        <div className="p-8 pt-0">
          <div className="glass-panel border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto">
            <div className="px-4 py-2 bg-surface-container-low border-b border-outline-variant/10 flex items-center gap-2">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase">Querying Across:</span>
              <div className="flex gap-1 overflow-x-auto">
                {selectedMeetings.map(m => (
                  <div key={m.id} className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-outline-variant/30 text-[10px] font-medium text-on-secondary-container whitespace-nowrap">
                    {m.title}
                    <button onClick={() => toggleMeeting(m)}><X className="w-3 h-3" /></button>
                  </div>
                ))}
                <button
                  onClick={() => setShowMeetingPicker(!showMeetingPicker)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-primary hover:bg-primary/5"
                >
                  <Plus className="w-3 h-3" />
                  Add Meeting
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showMeetingPicker && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="bg-white border-b border-outline-variant/10 overflow-hidden"
                >
                  <div className="p-4 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {meetings.map(m => (
                      <button
                        key={m.id}
                        onClick={() => toggleMeeting(m)}
                        className={`text-left p-2 rounded text-xs font-medium transition-colors ${selectedMeetings.find(p => p.id === m.id) ? 'bg-primary text-white' : 'hover:bg-slate-100'
                          }`}
                      >
                        {m.title}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4 flex items-end gap-3 bg-white">
              <div className="flex-1">
                <textarea
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  className="w-full border-none focus:ring-0 text-sm font-body resize-none p-[0.5rem] placeholder:text-slate-400"
                  placeholder="Ask anything about your meeting intelligence..."
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSend}
                  className="bg-primary text-white p-3 rounded-xl hover:opacity-90 active:scale-90 transition-all shadow-md flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-on-surface-variant mt-4 font-medium opacity-60">
            Narrative AI may produce inaccurate information about people, places, or facts.
          </p>
        </div>
      </div>
    </div>
  );
};
