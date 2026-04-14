import React from 'react';
import { LogIn, BrainCircuit, FileText, Activity, Search, Network, CheckSquare, ShieldCheck, Zap, Database, MessageSquare, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingProps {
  onLogin: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-surface overflow-hidden">
      {/* Navbar */}
      <nav className="fixed w-full top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <BrainCircuit className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black text-primary font-headline tracking-tight">The Narrative</span>
          </div>
          <button
            onClick={onLogin}
            className="px-6 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-lg font-bold text-sm flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        {/* Ambient background blobs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-10 relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Production • Gemini 3 Flash · LangGraph Swarm · RAG
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-primary font-headline tracking-tighter leading-tight max-w-4xl"
          >
            End the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">Double Work</span> Dilemma.
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-on-surface-variant font-body leading-relaxed max-w-2xl"
          >
            Hours of meetings shouldn't create hours of reading. Drop any transcript and our production-grade AI workforce — deployed on Render & Vercel — extracts every decision, action item, and insight in seconds.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            <button
              onClick={onLogin}
              className="px-8 py-5 bg-gradient-to-br from-primary to-primary-container text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3"
            >
              <LogIn className="w-6 h-6" />
              Sign in with Google to Start
            </button>
            <div className="flex items-center gap-6 text-xs font-bold text-on-surface-variant tracking-widest uppercase opacity-60">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Rate Limited</span>
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> IDOR Protected</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> HTTPS Enforced</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tech Stack Banner */}
      <section className="py-10 px-6 border-y border-outline-variant/10 bg-surface-container-low/50">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-on-surface-variant/50 mb-6">Powered By</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[
              { label: 'Gemini 3 Flash Preview', sub: 'Generative Reasoning' },
              { label: 'LangGraph', sub: 'Agent Orchestration' },
              { label: 'Upstash Vector DB', sub: 'Semantic RAG' },
              { label: 'HuggingFace Embeddings', sub: '384-dim Serverless' },
              { label: 'Firebase Firestore', sub: 'Realtime Sync' },
              { label: 'FastAPI + Slowapi', sub: 'Secure Python Backend' },
            ].map((tech) => (
              <div key={tech.label} className="flex flex-col items-center gap-0.5 text-center">
                <span className="text-sm font-extrabold text-on-surface tracking-tight">{tech.label}</span>
                <span className="text-[10px] font-medium text-on-surface-variant/60 uppercase tracking-wider">{tech.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Matrix Grid */}
      <section className="py-24 px-6 bg-surface-container-low border-y border-outline-variant/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl opacity-50"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black text-primary font-headline tracking-tight">A Fully Deployed Autonomous Workforce.</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">Upload any transcript and let our production AI pipeline — running live on Render — surface exactly what matters across your entire meeting history.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Network />}
              title="Multi-Agent Swarm (LangGraph)"
              desc="Three specialized agents run in sequence: an Analyst extracts decisions & action items, an EQ Specialist maps sentiment timelines, and an Executive agent synthesizes a 3-sentence brief — all orchestrated by LangGraph."
              delay={0.1}
            />
            <FeatureCard
              icon={<Database />}
              title="Semantic RAG via Upstash"
              desc="Every transcript is chunked and embedded using HuggingFace's all-MiniLM-L6-v2 (384 dimensions) and stored in Upstash Serverless Vector DB. The chatbot retrieves the top 8 most relevant chunks for grounded, cited answers."
              delay={0.2}
            />
            <FeatureCard
              icon={<MessageSquare />}
              title="Global Inquiry Chat"
              desc="Ask questions across dozens of meetings simultaneously. The backend AI reasons through your full knowledge base using RAG and cites verbatim source quotes for every answer, with IDOR-validated access control."
              delay={0.3}
            />
            <FeatureCard
              icon={<CheckSquare />}
              title="The Master Workstream"
              desc="Action items aren't just listed — they're centralized. The Workstream globally tracks every extracted task across all your meetings with interactive checkboxes, status toggles, and CSV export capabilities."
              delay={0.4}
            />
            <FeatureCard
              icon={<Activity />}
              title="Sentiment Timeline Mapping"
              desc="Visualize the 'vibe' of every meeting. The EQ Agent scores Agreement, Conflict, and Neutrality on a per-statement timeline with speaker attribution, rendered as an interactive dialogue flow chart."
              delay={0.5}
            />
            <FeatureCard
              icon={<ShieldCheck />}
              title="Production Security Hardening"
              desc="Rate limiting (5 req/min on ingestion, 20 req/min on chat), IDOR ownership checks, cryptographic Firebase Bearer token validation, a 4-hour session TTL, XSS sanitization via bleach, and HTTPS enforcement in production."
              delay={0.6}
            />
            <FeatureCard
              icon={<FileText />}
              title="Executive Reporting"
              desc="Generate instant Markdown executive reports directly from the dashboard showcasing organizational tasks, average sentiment scores, and the Executive Agent's 3-sentence narrative synthesis."
              delay={0.7}
            />
            <FeatureCard
              icon={<Zap />}
              title="Real-Time Firebase Sync"
              desc="Processing is offloaded asynchronously to the Python backend. Your React UI subscribes to Firestore WebSocket streams and auto-populates the moment the agent swarm finalizes its report — no polling required."
              delay={0.8}
            />
            <FeatureCard
              icon={<Search />}
              title="Contextual Per-Meeting Query"
              desc="Beyond global chat, each Intelligence page hosts a dedicated contextual query engine scoped to that single meeting's vector index, enabling surgical precision conversations against a specific transcript."
              delay={0.9}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-4xl font-black text-primary font-headline tracking-tight">From Upload to Intelligence in Seconds.</h2>
            <p className="text-on-surface-variant max-w-lg mx-auto">A decoupled, event-driven pipeline that prevents browser timeouts on even 20+ page transcripts.</p>
          </div>
          {/* Steps rendered as a flex row so connectors only span the gap between boxes */}
          <div className="hidden md:flex items-start justify-center gap-0">
            {[
              { step: '01', title: 'Upload', desc: 'Drop a .txt or .vtt transcript. Stored as a Firestore document and sanitized via bleach.' },
              { step: '02', title: 'Delegate', desc: 'FastAPI receives the trigger. The Python backend launches the LangGraph agent graph asynchronously.' },
              { step: '03', title: 'Analyze', desc: 'Three agents run sequentially: Analyst → EQ Specialist → Executive. Results and embeddings committed to Upstash.' },
              { step: '04', title: 'Sync', desc: 'Firebase Firestore pushes the final state to your React UI over WebSockets. Dashboard updates instantly.' },
            ].map((item, i, arr) => (
              <React.Fragment key={item.step}>
                <div className="flex flex-col items-center text-center gap-3 w-44 flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-black text-lg font-headline">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-on-surface font-headline">{item.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex items-start pt-8 flex-1 min-w-0 px-2">
                    <div className="w-full h-0.5 bg-gradient-to-r from-primary/30 to-emerald-400/40 rounded-full" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          {/* Mobile: vertical stack */}
          <div className="flex md:hidden flex-col gap-8">
            {[
              { step: '01', title: 'Upload', desc: 'Drop a .txt or .vtt transcript. Stored as a Firestore document and sanitized via bleach.' },
              { step: '02', title: 'Delegate', desc: 'FastAPI receives the trigger. The Python backend launches the LangGraph agent graph asynchronously.' },
              { step: '03', title: 'Analyze', desc: 'Three agents run sequentially: Analyst → EQ Specialist → Executive. Results and embeddings committed to Upstash.' },
              { step: '04', title: 'Sync', desc: 'Firebase Firestore pushes the final state to your React UI over WebSockets. Dashboard updates instantly.' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-black text-lg font-headline">
                  {item.step}
                </div>
                <h3 className="font-bold text-on-surface font-headline">{item.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-20 px-6 bg-surface-container-low border-t border-outline-variant/10 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <BrainCircuit className="w-16 h-16 text-primary mx-auto opacity-20" />
          <h2 className="text-3xl font-black text-primary font-headline">Ready to reclaim your time?</h2>
          <p className="text-on-surface-variant">Deployed on Render & Vercel. Secured by Firebase Auth. Powered by Gemini 3.</p>
          <button
            onClick={onLogin}
            className="px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-opacity-90 active:scale-95 transition-all"
          >
            Enter The Narrative Hub
          </button>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.5, delay }}
    className="bg-white p-10 rounded-3xl shadow-sm border border-outline-variant/10 hover:shadow-xl hover:border-primary/20 transition-all group h-full flex flex-col"
  >
    <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
      {React.cloneElement(icon as React.ReactElement, { className: "w-7 h-7" })}
    </div>
    <h3 className="text-xl font-bold text-primary font-headline mb-3">{title}</h3>
    <p className="text-on-surface-variant leading-relaxed">
      {desc}
    </p>
  </motion.div>
);
