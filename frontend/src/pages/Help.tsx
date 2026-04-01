import React from 'react';
import { BookOpen, UploadCloud, BrainCircuit, Search, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const Help: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <section className="space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl text-primary mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black text-primary font-headline tracking-tight">Documentation & Help</h1>
        <p className="text-xl text-on-surface-variant font-body">Learn how to maximize your editorial intelligence workflow and stop the double-work dilemma.</p>
      </section>

      <div className="grid grid-cols-1 gap-6 pt-6">
        <DocSection 
          icon={<UploadCloud />}
          num="01"
          title="Uploading Transcripts"
          content={
            <div className="space-y-4">
              <p>The Narrative is built to instantly ingest raw text outputs from your favorite meeting tools (Zoom, Google Meet, Teams, etc).</p>
              <ul className="list-disc pl-5 space-y-2 text-on-surface-variant">
                <li>Navigate to the <strong>Upload</strong> tab using the sidebar.</li>
                <li>Drag and drop your <code>.txt</code> or <code>.vtt</code> transcript files directly into the dropzone.</li>
                <li>You can add multiple speakers simply by ensuring their names prepend their dialogue lines in the text file.</li>
                <li>Once uploaded, the AI will begin processing the transcript in the background. You'll be notified via the bell icon when it's ready.</li>
              </ul>
            </div>
          }
        />

        <DocSection 
          icon={<BrainCircuit />}
          num="02"
          title="Meeting Intelligence"
          content={
            <div className="space-y-4">
              <p>Clicking on any meeting in your Dashboard opens the Intelligence view, where hours of reading are condensed into structured data.</p>
              <ul className="list-disc pl-5 space-y-2 text-on-surface-variant">
                <li><strong>Decisions:</strong> Major strategic alignments are extracted automatically.</li>
                <li><strong>Action Items:</strong> The exact tasks, who is responsible, and the deadlines are surfaced.</li>
                <li><strong>CSV Export:</strong> Need to port these to Jira or Asana? Click the <em>Export CSV</em> button at the top of the Action Items list to download a spreadsheet instantly.</li>
                <li><strong>Sentiment Analysis:</strong> The visual graph maps the "vibe" of the meeting over time, allowing you to quickly spot moments of conflict or agreement.</li>
              </ul>
            </div>
          }
        />

        <DocSection 
          icon={<Search />}
          num="03"
          title="The Global Inquiry Chat"
          content={
            <div className="space-y-4">
              <p>The global chat acts as a contextual overlay across <em>all</em> your processed transcripts simultaneously.</p>
              <ul className="list-disc pl-5 space-y-2 text-on-surface-variant">
                <li>Ask questions like <em>"What did we decide about the Q4 marketing budget across all meetings?"</em></li>
                <li>The AI reasoning engine will scrape through every uploaded document you own and synthesize a single, concise answer.</li>
              </ul>
            </div>
          }
        />
      </div>

      <div className="mt-12 p-8 bg-surface-container-high rounded-3xl text-center space-y-4">
        <HelpCircle className="w-10 h-10 text-primary mx-auto opacity-50" />
        <h3 className="text-xl font-bold text-primary font-headline">Need further assistance?</h3>
        <p className="text-on-surface-variant">Reach out to your system administrator or file a ticket in your internal tracking portal.</p>
      </div>
    </div>
  );
};

const DocSection = ({ icon, num, title, content }: { icon: React.ReactNode, num: string, title: string, content: React.ReactNode }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/10 flex gap-6 group hover:shadow-md transition-shadow"
  >
    <div className="hidden md:flex flex-col items-center">
      <div className="text-4xl font-black text-surface-container-highest font-headline mt-2">{num}</div>
    </div>
    <div className="flex-1 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-surface-container rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
          {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
        </div>
        <h2 className="text-2xl font-bold text-primary font-headline tracking-tight">{title}</h2>
      </div>
      <div className="text-on-surface-variant leading-relaxed">
        {content}
      </div>
    </div>
  </motion.div>
);
