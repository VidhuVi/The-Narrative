import React, { useEffect, useState } from 'react';
import { db, auth } from '../core/firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { BrainCircuit, Gavel, CheckCircle2, ChevronRight, Download, MessageSquare, Send, Paperclip, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Meeting } from '../types';

export const Intelligence: React.FC<{ meetingId: string }> = ({ meetingId }) => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const fetchMeeting = async () => {
      const docRef = doc(db, 'meetings', meetingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMeeting({ id: docSnap.id, ...docSnap.data() } as Meeting);
      }
    };

    fetchMeeting();
  }, [meetingId]);

  const handleChat = async () => {
    if (!chatQuery || !meeting) return;
    setChatLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const targetUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
      
      const response = await fetch(`${targetUrl}/chat-inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: chatQuery,
          meetingIds: [meeting.id]
        })
      });

      if (!response.ok) throw new Error("Backend query failed");
      const data = await response.json();
      setChatResponse(data.response);
    } catch (err) {
      console.error(err);
      setChatResponse("Error: Could not reach Narrative Intelligence Hub backend.");
    } finally {
      setChatLoading(false);
      setChatQuery(''); // clear the input box
    }
  };


  if (!meeting) return <div className="p-10 text-center">Loading meeting intelligence...</div>;

  if (meeting.status === 'processing' || !meeting.sentimentData?.segments) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4 max-w-md mx-auto mt-20 bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <h3 className="font-headline font-bold text-xl text-primary mt-2">Agents Active</h3>
        <p className="text-on-surface-variant text-sm leading-relaxed">The LangGraph swarm is currently processing this transcript. This screen will automatically populate when the intelligence report is finalized by the Executive agent.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 font-headline">Sentiment Narrative</h2>
            <p className="text-sm text-on-surface-variant">Real-time tone analysis of the conversation</p>
          </div>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Agreement</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Neutral</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Conflict</span>
            </div>
          </div>
        </div>
        
        <div className="relative h-24 w-full flex items-end space-x-1">
          {meeting.sentimentData.segments.map((seg, i) => (
            <div 
              key={i}
              title={`${seg.time}: ${seg.sentiment}`}
              className={`flex-1 rounded-t transition-all cursor-pointer ${
                seg.sentiment === 'Agreement' ? 'bg-emerald-500/40 hover:bg-emerald-500' :
                seg.sentiment === 'Conflict' ? 'bg-error/40 hover:bg-error' :
                'bg-amber-500/40 hover:bg-amber-500'
              }`}
              style={{ height: `${Math.min(100, 30 + (seg.text.length % 70))}%` }}
            />
          ))}
          <div className="absolute left-[45%] top-0 bottom-0 w-0.5 bg-primary/20 flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-primary -mt-1"></div>
          </div>
        </div>
      </section>

      {/* Speaker Analysis */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-outline-variant/10">
        <h3 className="font-bold text-lg font-headline mb-4">Speaker Sentiment Alignment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(new Set(meeting.sentimentData.segments.map(s => s.speaker).filter(Boolean))).map(speaker => {
            const spkSegs = meeting.sentimentData.segments.filter(s => s.speaker === speaker);
            const agreement = spkSegs.filter(s => s.sentiment === 'Agreement').length;
            const conflict = spkSegs.filter(s => s.sentiment === 'Conflict').length;
            const neutral = spkSegs.filter(s => s.sentiment === 'Neutral').length;
            const total = spkSegs.length || 1;
            
            return (
              <div key={speaker} className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
                <div className="flex items-center space-x-3 mb-3">
                   <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                     {speaker![0].toUpperCase()}
                   </div>
                   <p className="font-bold text-sm text-on-surface">{speaker}</p>
                </div>
                <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-200">
                  <div style={{width: `${(agreement/total)*100}%`}} className="bg-emerald-500"></div>
                  <div style={{width: `${(neutral/total)*100}%`}} className="bg-amber-500"></div>
                  <div style={{width: `${(conflict/total)*100}%`}} className="bg-error"></div>
                </div>
                <div className="mt-2 text-[10px] font-medium text-on-surface-variant flex justify-between">
                  <span>{Math.round((agreement/total)*100)}% Align</span>
                  <span>{Math.round((conflict/total)*100)}% Conflict</span>
                </div>
              </div>
            );
          })}
          {meeting.sentimentData.segments.every(s => !s.speaker) && (
            <p className="text-sm text-on-surface-variant col-span-full">No speaker attribution available for this meeting's sentiment data.</p>
          )}
        </div>
      </section>

      {/* AI Summary Insert */}
      <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
        <div className="flex items-center space-x-2 mb-3">
          <BrainCircuit className="text-primary w-5 h-5" />
          <h4 className="text-sm font-bold text-primary uppercase">Executive Narrative Synthesis</h4>
        </div>
        <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
          {meeting.summary}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/10">
          <div className="p-6 border-b border-surface-container flex items-center justify-between">
            <h3 className="font-bold text-lg font-headline">Dialogue Flow</h3>
          </div>
          <div className="p-8 space-y-10 overflow-y-auto max-h-[800px]">
            {meeting.sentimentData.segments.map((seg, i) => (
              <div key={i} className="flex space-x-6 relative">
                {seg.sentiment === 'Conflict' && <div className="absolute -left-8 top-0 bottom-0 w-1 bg-error rounded-full"></div>}
                {seg.sentiment === 'Agreement' && <div className="absolute -left-8 top-0 bottom-0 w-1 bg-emerald-500 rounded-full"></div>}
                <div className="flex-shrink-0 w-32">
                  <p className="text-xs font-black text-primary tracking-widest mb-1">{seg.time}</p>
                  <div className="px-3 py-1.5 bg-surface-container-low rounded text-xs font-bold text-center line-clamp-1">{seg.speaker || 'Unknown'}</div>
                </div>
                <div className="flex-1 lg:max-w-4xl">
                  <p className="text-on-surface leading-loose font-body text-[15px]">
                    {seg.text}
                  </p>
                  {seg.sentiment === 'Conflict' && (
                    <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1 bg-error-container/30 rounded-lg">
                      <AlertTriangle className="text-error w-4 h-4" />
                      <span className="text-[10px] font-bold text-on-error-container uppercase">Conflict Detected</span>
                    </div>
                  )}
                  {seg.sentiment === 'Agreement' && (
                    <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 rounded-lg">
                      <CheckCircle className="text-emerald-600 w-4 h-4" />
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">Agreement Aligned</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="p-6 border-b border-surface-container flex items-center gap-3">
          <MessageSquare className="text-primary w-5 h-5" />
          <h3 className="font-bold text-lg font-headline">Contextual Query Engine</h3>
        </div>
        <div className="p-6 space-y-6">
          {chatResponse && (
            <div className="bg-surface-container-low p-6 rounded-2xl shadow-sm text-sm leading-relaxed text-on-surface prose prose-sm md:prose-base prose-slate max-w-none prose-headings:font-headline prose-headings:text-primary prose-a:text-blue-600">
              <ReactMarkdown>{chatResponse}</ReactMarkdown>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <textarea 
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl p-4 text-sm font-body resize-none focus:ring-2 focus:ring-primary/20 outline-none" 
                placeholder="Ask anything about this meeting..." 
                rows={2}
              />
              <button className="absolute right-3 bottom-3 p-2 text-slate-400 hover:text-primary transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={handleChat}
              disabled={chatLoading}
              className="bg-primary text-white p-4 rounded-xl hover:opacity-90 active:scale-90 transition-all shadow-md flex items-center justify-center disabled:opacity-50"
            >
              {chatLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
