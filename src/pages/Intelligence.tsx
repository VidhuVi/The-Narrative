import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { BrainCircuit, Gavel, CheckCircle2, ChevronRight, Download, MessageSquare, Send, Paperclip, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { geminiService } from '../services/gemini';

interface Meeting {
  id: string;
  title: string;
  summary: string;
  transcriptContent: string;
  sentimentData: {
    overall: number;
    segments: { time: string; sentiment: string; text: string; speaker?: string }[];
  };
}

interface Decision {
  id: string;
  text: string;
  category: string;
}

interface ActionItem {
  id: string;
  responsible: string;
  task: string;
  dueDate: string;
  status: string;
}

export const Intelligence: React.FC<{ meetingId: string }> = ({ meetingId }) => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
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

    if (!auth.currentUser) return;

    const qDecisions = query(
      collection(db, 'decisions'), 
      where('meetingId', '==', meetingId),
      where('authorId', '==', auth.currentUser.uid)
    );
    const unsubscribeDecisions = onSnapshot(qDecisions, (snapshot) => {
      setDecisions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Decision)));
    }, (error) => console.error("Decisions fetch error:", error));

    const qActions = query(
      collection(db, 'actionItems'), 
      where('meetingId', '==', meetingId),
      where('authorId', '==', auth.currentUser.uid)
    );
    const unsubscribeActions = onSnapshot(qActions, (snapshot) => {
      setActionItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActionItem)));
    }, (error) => console.error("Actions fetch error:", error));

    fetchMeeting();
    return () => {
      unsubscribeDecisions();
      unsubscribeActions();
    };
  }, [meetingId]);

  const handleChat = async () => {
    if (!chatQuery || !meeting) return;
    setChatLoading(true);
    try {
      const response = await geminiService.chatWithTranscripts(chatQuery, [{ title: meeting.title, content: meeting.transcriptContent }]);
      setChatResponse(response);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const exportCSV = () => {
    if (!meeting) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Type,Category/Assignee,Text/Task,Due Date\n";
    
    decisions.forEach(d => {
      csvContent += `Decision,"${d.category}","${d.text.replace(/"/g, '""')}",\n`;
    });
    
    actionItems.forEach(a => {
      csvContent += `Action Item,"${a.responsible}","${a.task.replace(/"/g, '""')}","${a.dueDate || ''}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `meeting_export_${meeting.title.replace(/\\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!meeting) return <div className="p-10 text-center">Loading meeting intelligence...</div>;

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

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 xl:col-span-8 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/10">
          <div className="p-6 border-b border-surface-container flex items-center justify-between">
            <h3 className="font-bold text-lg font-headline">Dialogue Flow</h3>
          </div>
          <div className="p-8 space-y-10 overflow-y-auto max-h-[600px]">
            {meeting.sentimentData.segments.map((seg, i) => (
              <div key={i} className="flex space-x-6 relative">
                {seg.sentiment === 'Conflict' && <div className="absolute -left-8 top-0 bottom-0 w-1 bg-error rounded-full"></div>}
                {seg.sentiment === 'Agreement' && <div className="absolute -left-8 top-0 bottom-0 w-1 bg-emerald-500 rounded-full"></div>}
                <div className="flex-shrink-0 w-24">
                  <p className="text-[10px] font-black text-primary tracking-widest mb-1">{seg.time}</p>
                  <div className="px-2 py-1 bg-surface-container-low rounded text-[10px] font-bold text-center line-clamp-1">{seg.speaker || 'Unknown'}</div>
                </div>
                <div className="flex-1">
                  <p className="text-on-surface leading-relaxed font-body text-sm">
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

        <div className="col-span-12 xl:col-span-4 space-y-8">
          <section className="bg-primary text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Gavel className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-extrabold mb-4 flex items-center space-x-2 font-headline">
                <CheckCircle2 className="w-5 h-5" />
                <span>Key Decisions</span>
              </h3>
              <ul className="space-y-4">
                {decisions.map((d) => (
                  <li key={d.id} className="p-3 bg-white/10 rounded border-l-4 border-emerald-500">
                    <p className="text-xs font-bold uppercase text-white/60 mb-1">{d.category}</p>
                    <p className="text-sm font-medium">{d.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
            <div className="p-6 border-b border-surface-container flex items-center justify-between">
              <h3 className="font-bold text-lg font-headline">Action Items</h3>
              <button onClick={exportCSV} className="text-primary hover:underline text-xs font-bold flex items-center space-x-1">
                <Download className="w-4 h-4" />
                <span>EXPORT CSV</span>
              </button>
            </div>
            <div className="divide-y divide-surface-container">
              {actionItems.map((item) => (
                <div key={item.id} className="p-4 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs">
                        {item.responsible[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{item.task}</p>
                        <p className="text-[10px] text-on-surface-variant font-medium">Assignee: {item.responsible}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      item.status === 'pending' ? 'bg-tertiary-container/20 text-tertiary' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {item.dueDate || 'ASAP'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full ring-2 ring-white bg-slate-300"></div>
                    </div>
                    <ChevronRight className="text-slate-300 w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-surface-container-low p-6 rounded-xl border-t-2 border-primary">
            <div className="flex items-center space-x-2 mb-3">
              <BrainCircuit className="text-primary w-5 h-5" />
              <h4 className="text-sm font-bold text-primary uppercase">AI Narrative Summary</h4>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed italic">
              {meeting.summary}
            </p>
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
            <div className="bg-surface-container-low p-4 rounded-xl text-sm leading-relaxed text-on-surface">
              {chatResponse}
            </div>
          )}
          <div className="flex items-end gap-3">
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
