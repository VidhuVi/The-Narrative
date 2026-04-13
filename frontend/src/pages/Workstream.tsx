import React, { useState, useEffect } from 'react';
import { db, auth } from '../core/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, writeBatch } from 'firebase/firestore';
import { CheckSquare, Circle, CheckCircle2, Gavel, Calendar, FileText, Filter, Download, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { ActionItem, Decision, MeetingRef } from '../types';

export const Workstream: React.FC<{ initialMeetingId?: string | null }> = ({ initialMeetingId }) => {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [meetings, setMeetings] = useState<MeetingRef[]>([]);
  const [filterId, setFilterId] = useState<string>('all');

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch meeting references for drop down
    const qM = query(collection(db, 'meetings'), where('authorId', '==', auth.currentUser.uid));
    const uM = onSnapshot(qM, snap => {
      setMeetings(snap.docs.map(d => ({ id: d.id, title: d.data().title })));
    });

    const qA = query(collection(db, 'actionItems'), where('authorId', '==', auth.currentUser.uid));
    const uA = onSnapshot(qA, snap => {
      setActions(snap.docs.map(d => ({ id: d.id, ...d.data() } as ActionItem)));
    });

    const qD = query(collection(db, 'decisions'), where('authorId', '==', auth.currentUser.uid));
    const uD = onSnapshot(qD, snap => {
      setDecisions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Decision)));
    });

    return () => { uM(); uA(); uD(); };
  }, []);

  useEffect(() => {
    if (initialMeetingId) setFilterId(initialMeetingId);
  }, [initialMeetingId]);

  const toggleAction = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'actionItems', id), {
        status: currentStatus === 'pending' ? 'completed' : 'pending'
      });
    } catch (err) {
      console.error("Failed to toggle action item", err);
    }
  };

  const filteredActions = filterId === 'all' ? actions : actions.filter(a => a.meetingId === filterId);
  const filteredDecisions = filterId === 'all' ? decisions : decisions.filter(d => d.meetingId === filterId);

  const clearItems = async (collectionName: string, itemsToClear: { id: string }[]) => {
    if (itemsToClear.length === 0) return;
    const warning = filterId === 'all'
      ? `WARNING: You are about to permanently delete ALL ${itemsToClear.length} items from your database. Proceed?`
      : `Delete these ${itemsToClear.length} items for this meeting?`;

    if (window.confirm(warning)) {
      try {
        const batch = writeBatch(db);
        itemsToClear.forEach(item => {
          batch.delete(doc(db, collectionName, item.id));
        });
        await batch.commit();
      } catch (err) {
        console.error(`Failed to clear ${collectionName}`, err);
        alert("Failed to delete. Check your connection.");
      }
    }
  };

  const pendingCount = filteredActions.filter(a => a.status === 'pending').length;

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Type,Meeting Outline,Category/Assignee,Text/Task,Due Date,Status\n";

    filteredDecisions.forEach(d => {
      const meetingTitle = meetings.find(m => m.id === d.meetingId)?.title || "Unknown Meeting";
      csvContent += `Decision,"${meetingTitle}","${d.category}","${d.text.replace(/"/g, '""')}",,\n`;
    });

    filteredActions.forEach(a => {
      const meetingTitle = meetings.find(m => m.id === a.meetingId)?.title || "Unknown Meeting";
      csvContent += `Action Item,"${meetingTitle}","${a.responsible}","${a.task.replace(/"/g, '""')}","${a.dueDate || ''}","${a.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `workstream_export_${filterId === 'all' ? 'global' : filterId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">

      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10">
        <div>
          <h1 className="text-3xl font-black font-headline text-primary">Master Workstream</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {pendingCount} pending task{pendingCount !== 1 ? 's' : ''} out of {filteredActions.length} total.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-3 bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-white transition-colors rounded-lg font-bold text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <Filter className="w-5 h-5 text-on-surface-variant ml-2" />
          <select
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            className="bg-surface-container-low border-none rounded-lg p-3 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 outline-none min-w-[200px]"
          >
            <option value="all">Every Meeting</option>
            {meetings.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

        {/* Action Items Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border-l-4 border-amber-500">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-6 h-6 text-amber-600" />
              <h2 className="text-xl font-bold font-headline text-on-surface">Actionable Tasks</h2>
            </div>
            {filteredActions.length > 0 && (
              <button
                onClick={() => clearItems('actionItems', filteredActions)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-error bg-error/10 hover:bg-error hover:text-white transition-colors rounded shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />

              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredActions.length === 0 ? (
              <p className="text-sm text-on-surface-variant p-6 text-center border border-dashed rounded-xl">No tasks assigned.</p>
            ) : (
              filteredActions.sort((a, b) => a.status === 'pending' ? -1 : 1).map(action => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  key={action.id}
                  className={`p-4 bg-white rounded-xl shadow-sm border transition-all flex items-start gap-4 hover:shadow-md cursor-pointer ${action.status === 'completed' ? 'opacity-60 border-outline-variant/10' : 'border-outline-variant/30 hover:border-amber-300'}`}
                  onClick={() => toggleAction(action.id, action.status)}
                >
                  <button className="mt-0.5 flex-shrink-0 focus:outline-none transition-transform active:scale-75">
                    {action.status === 'completed'
                      ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      : <Circle className="w-6 h-6 text-slate-300 hover:text-amber-500" />}
                  </button>
                  <div className="flex-1 space-y-1">
                    <p className={`font-bold text-sm ${action.status === 'completed' ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                      {action.task}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                      <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" /> {action.responsible}</span>
                      {action.dueDate && action.dueDate.toLowerCase() !== 'null' && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {action.dueDate}</span>}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Key Decisions Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-primary text-white rounded-xl shadow-md">
            <div className="flex items-center gap-3">
              <Gavel className="w-6 h-6 opacity-80" />
              <h2 className="text-xl font-bold font-headline">Strategic Decisions</h2>
            </div>
            {filteredDecisions.length > 0 && (
              <button
                onClick={() => clearItems('decisions', filteredDecisions)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white/90 bg-white/20 hover:bg-error hover:text-white transition-colors rounded shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />

              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredDecisions.length === 0 ? (
              <p className="text-sm text-on-surface-variant p-6 text-center border border-dashed rounded-xl">No decisions formally recorded.</p>
            ) : (
              filteredDecisions.map(decision => (
                <div key={decision.id} className="p-5 bg-white rounded-xl shadow-sm border border-outline-variant/20 flex gap-4 hover:border-primary/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 bg-tertiary-container/30 text-tertiary text-[10px] font-black uppercase tracking-widest rounded mb-2 inline-block">
                      {decision.category}
                    </span>
                    <p className="font-medium text-sm text-on-surface leading-relaxed">{decision.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
