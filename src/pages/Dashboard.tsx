import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { LayoutDashboard, CheckSquare, TrendingUp, ChevronRight, Video, Mic, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface Meeting {
  id: string;
  title: string;
  date: any;
  wordCount: number;
  speakers: string[];
  status: string;
  sentimentData?: { overall: number };
}

export const Dashboard: React.FC<{ onMeetingClick: (id: string) => void, onUploadClick?: () => void, onViewAllActions?: () => void }> = ({ onMeetingClick, onUploadClick, onViewAllActions }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, sentiment: 0 });

  const handleDeleteMeeting = async (e: React.MouseEvent, meetingId: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this meeting?")) {
      try {
        await deleteDoc(doc(db, 'meetings', meetingId));
      } catch (err) {
        console.error("Failed to delete meeting", err);
      }
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'meetings'),
      where('authorId', '==', auth.currentUser.uid),
      orderBy('date', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meeting));
      setMeetings(data);
      
      const total = data.length;
      const sentiment = data.reduce((acc, m) => acc + (m.sentimentData?.overall || 0), 0) / (total || 1);
      setStats(prev => ({ ...prev, total, sentiment: Math.round(sentiment) }));
    });

    const qActions = query(
      collection(db, 'actionItems'),
      where('authorId', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribeActions = onSnapshot(qActions, (snapshot) => {
      const actions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingActions(actions);
      setStats(prev => ({ ...prev, pending: snapshot.size }));
    });

    return () => {
      unsubscribe();
      unsubscribeActions();
    };
  }, []);

  const statCards = [
    { label: 'Total Meetings', value: stats.total, icon: LayoutDashboard, sub: 'All recorded meetings', color: 'text-blue-600' },
    { label: 'Pending Actions', value: stats.pending, icon: CheckSquare, sub: 'Needs completion', color: 'text-amber-600' },
    { label: 'Avg Sentiment', value: `${stats.sentiment}%`, icon: TrendingUp, sub: 'Alignment score', color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-10">
      <section className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-extrabold tracking-tight text-primary font-headline leading-tight">Editorial<br/>Intelligence</h1>
          <p className="text-on-surface-variant font-body max-w-md">Your narrative ecosystem has processed {meetings.length} new discussions. Key themes focus on "Q4 Strategy" and "Technical Debt".</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-surface-container-high text-on-surface rounded-lg font-bold text-sm transition-all hover:bg-surface-container-highest active:scale-95">
            Download Report
          </button>
          <button onClick={onUploadClick} className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-lg font-bold text-sm shadow-md hover:opacity-90 active:scale-95 flex items-center gap-2">
            Upload New Meeting
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface-container-low p-6 rounded-xl flex flex-col justify-between group hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <div className="flex justify-between items-start">
              <span className="text-primary/60 font-semibold tracking-wider uppercase text-[10px]">{stat.label}</span>
              <stat.icon className="text-primary/30 group-hover:text-primary transition-colors w-5 h-5" />
            </div>
            <div className="mt-4">
              <span className="text-4xl font-black text-primary font-headline">{stat.value}</span>
              <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${stat.color}`}>
                {stat.sub}
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <section className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-primary font-headline">Recent Meetings</h2>
            <button className="text-xs font-bold text-primary underline underline-offset-4 hover:opacity-70 transition-opacity">View All Library</button>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
            {meetings.length === 0 ? (
              <div className="p-10 text-center text-on-surface-variant font-medium">
                No meetings found. Start by uploading a transcript.
              </div>
            ) : (
              meetings.map((meeting) => (
                <div 
                  key={meeting.id}
                  onClick={() => onMeetingClick(meeting.id)}
                  className="p-5 flex items-center gap-6 hover:bg-surface-container-low transition-colors group cursor-pointer border-b border-surface-variant/20 last:border-0"
                >
                  <div className="w-12 h-12 rounded bg-primary/5 flex items-center justify-center text-primary">
                    {meeting.title.toLowerCase().includes('sync') ? <Video className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors">{meeting.title}</h3>
                    <p className="text-xs text-on-surface-variant">
                      {meeting.date?.toDate ? format(meeting.date.toDate(), 'MMM d, yyyy') : 'Recently'} • {meeting.wordCount} words • {meeting.speakers.length} Speakers
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    {meeting.speakers.slice(0, 3).map((s, i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {s[0]}
                      </div>
                    ))}
                    {meeting.speakers.length > 3 && (
                      <div className="w-7 h-7 rounded-full bg-surface-container-high border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                        +{meeting.speakers.length - 3}
                      </div>
                    )}
                  </div>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-surface-container-low text-[10px] font-bold uppercase tracking-widest text-on-surface-variant rounded-full flex items-center gap-1 border-l-2 border-green-500">
                        {meeting.status}
                      </div>
                      <button 
                        onClick={(e) => handleDeleteMeeting(e, meeting.id)}
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Meeting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="text-on-surface-variant opacity-20 group-hover:opacity-100 transition-opacity w-5 h-5 ml-2" />
                    </div>
                  </div>
                ))
              )}
          </div>
        </section>

        <section className="lg:col-span-4 space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-primary font-headline">Recent Pending Actions</h2>
            <div className="grid grid-cols-1 gap-3">
              {pendingActions.slice(0, 3).map((action, i) => (
                <div key={i} className="p-4 bg-white rounded-xl flex items-center justify-between group cursor-pointer hover:shadow-sm transition-all border-l-4 border-amber-500">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-on-surface line-clamp-1">{action.task}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-tight">Assignee: {action.responsible} • {action.dueDate || 'ASAP'}</p>
                  </div>
                  <CheckSquare className="text-slate-300 group-hover:text-amber-500 w-5 h-5 flex-shrink-0 ml-4" />
                </div>
              ))}
              {pendingActions.length === 0 && (
                <div className="p-4 bg-white rounded-xl text-sm text-on-surface-variant text-center border border-outline-variant/10">
                  No pending actions.
                </div>
              )}
            </div>
            <button onClick={onViewAllActions} className="w-full py-2 text-xs font-bold text-primary-container bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors">
              View All Actions
            </button>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-6 bg-primary text-white shadow-xl">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="w-16 h-16" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-2 py-1 bg-white/10 rounded backdrop-blur-md text-[10px] font-black uppercase tracking-widest">
                AI Synthesis
              </div>
              <h3 className="text-xl font-headline font-bold leading-tight">Key Action Item Detected</h3>
              <p className="text-sm font-body text-white/70">
                {pendingActions.length > 0 ? pendingActions[0].task : "No key action items currently pending."}
              </p>
              {pendingActions.length > 0 && (
                <button onClick={() => onMeetingClick(pendingActions[0].meetingId)} className="w-full py-3 bg-white text-primary rounded-lg font-bold text-sm hover:bg-opacity-90 transition-all">
                  Review Context
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
