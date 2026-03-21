import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { geminiService } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';

export const Upload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDrop as any,
    accept: {
      'text/plain': ['.txt'],
      'text/vtt': ['.vtt'],
      'application/json': ['.json']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  } as any);

  const handleUpload = async () => {
    if (files.length === 0 || !auth.currentUser) return;

    setUploading(true);
    setProgress(10);

    try {
      for (const file of files) {
        const text = await file.text();
        setProgress(30);

        // Extract intelligence using Gemini
        const data = await geminiService.extractIntelligence(text);
        setProgress(70);

        // Save to Firestore
        const meetingRef = await addDoc(collection(db, 'meetings'), {
          title: data.title,
          date: serverTimestamp(),
          wordCount: text.split(/\s+/).length,
          speakers: data.speakers,
          summary: data.summary,
          transcriptContent: text,
          sentimentData: data.sentiment,
          status: 'processed',
          authorId: auth.currentUser.uid
        });

        // Save decisions
        for (const decision of data.decisions) {
          await addDoc(collection(db, 'decisions'), {
            meetingId: meetingRef.id,
            text: decision.text,
            category: decision.category,
            authorId: auth.currentUser.uid
          });
        }

        // Save action items
        for (const item of data.actionItems) {
          await addDoc(collection(db, 'actionItems'), {
            meetingId: meetingRef.id,
            responsible: item.responsible,
            task: item.task,
            dueDate: item.dueDate || null,
            status: 'pending',
            authorId: auth.currentUser.uid
          });
        }
      }
      setProgress(100);
      setFiles([]);
      setTimeout(() => setUploading(false), 1000);
    } catch (err) {
      console.error(err);
      setError("Failed to process transcript. Please ensure it's a valid format.");
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div 
            {...getRootProps()}
            className={`bg-surface-container-lowest rounded-xl p-12 flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer group ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:border-primary/40'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <CloudUpload className="text-4xl text-primary w-10 h-10" />
            </div>
            <h2 className="text-2xl font-headline font-extrabold text-on-surface mb-2">
              {isDragActive ? 'Drop files here' : 'Drop your transcript (.txt, .vtt) here'}
            </h2>
            <p className="text-on-surface-variant font-medium mb-8">Or browse files from your local storage</p>
            <button className="px-8 py-3 bg-primary text-white rounded-lg font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all">
              Select Files
            </button>
            <div className="mt-8 flex items-center gap-8 opacity-40">
              <span className="text-xs font-bold tracking-widest uppercase">Max 50MB</span>
              <span className="text-xs font-bold tracking-widest uppercase">VTT, TXT, JSON</span>
            </div>
          </div>

          {files.length > 0 && !uploading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-container-low rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="text-primary w-5 h-5" />
                  <span className="font-headline font-bold">Files Ready for Ingestion</span>
                </div>
                <button 
                  onClick={handleUpload}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm"
                >
                  Process {files.length} File{files.length > 1 ? 's' : ''}
                </button>
              </div>
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg border border-outline-variant/10 text-sm font-medium">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {uploading && (
            <div className="bg-surface-container-low rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="text-primary w-5 h-5 animate-spin" />
                  <span className="font-headline font-bold">Active Processing</span>
                </div>
                <span className="text-xs font-bold text-primary px-2 py-1 bg-white rounded shadow-sm">
                  {progress < 100 ? 'Analyzing...' : 'Complete'}
                </span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-outline-variant/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <FileText className="text-slate-400 w-5 h-5" />
                    <div>
                      <p className="text-sm font-bold">{files[0]?.name}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase font-medium">Extracting intelligence...</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary">{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary rounded-full" 
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-error-container p-4 rounded-xl flex items-center gap-3 text-on-error-container">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
              <CheckCircle2 className="text-green-600 w-6 h-6" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-6">Ingestion Guidelines</h3>
            <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
              <p>• Ensure transcripts include speaker names for accurate attribution.</p>
              <p>• WebVTT files are preferred for timestamp-based sentiment analysis.</p>
              <p>• AI will automatically extract decisions and action items.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
