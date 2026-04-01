import React from 'react';
import { LogIn, BrainCircuit, FileText, Activity, Search, Network, CheckSquare, ShieldCheck } from 'lucide-react';
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
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-10">
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
            v2.0 • Powered by LangGraph Swarm Architecture
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
            Hours of meetings shouldn't create hours of reading. Turn massive 20-page transcripts into actionable intelligence, instant decisions, and extracted strategy instantly using our decoupled AI workforce.
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button 
              onClick={onLogin}
              className="px-8 py-5 bg-gradient-to-br from-primary to-primary-container text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3"
            >
              <LogIn className="w-6 h-6" />
              Sign in with Google to Start
            </button>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-on-surface-variant tracking-widest uppercase opacity-60">
              <ShieldCheck className="w-4 h-4" /> Built with Row-Level Security
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Matrix Grid */}
      <section className="py-24 px-6 bg-surface-container-low border-y border-outline-variant/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl opacity-50"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black text-primary font-headline tracking-tight">An Autonomous Workforce.</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">Upload any transcript format and let our purpose-built AI pipeline surface exactly what matters using asynchronous Agent Swarms.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Network />}
              title="Multi-Agent Orchestration"
              desc="Transcripts aren't analyzed by one model. They are delegated to an Analyst, an EQ Specialist, and an Executive agent running in parallel to extract hyper-accurate metadata."
              delay={0.1}
            />
            <FeatureCard 
              icon={<CheckSquare />}
              title="The Master Workstream"
              desc="Action Items aren't just listed; they are centralized. The Workstream globally tracks every actionable task across all your meetings with interactive checkboxes and CSV exports."
              delay={0.2}
            />
            <FeatureCard 
              icon={<Search />}
              title="Global Inquiry Chat"
              desc="Ask a question across dozens of meetings simultaneously. The backend AI reasons through your knowledge base and cites its sources using exact verbatim string extraction."
              delay={0.3}
            />
            <FeatureCard 
              icon={<Activity />}
              title="Timeline Sentiment Mapping"
              desc="Visualize the 'vibe' of every meeting. Our EQ Agent spots conflict, alignment, and neutrality on a timeline basis, automatically scraping the names of the speakers involved."
              delay={0.4}
            />
             <FeatureCard 
              icon={<FileText />}
              title="Executive Reporting"
              desc="Generate instant Markdown executive reports directly from the dashboard showcasing organizational tasks, average sentiment scores, and 3-sentence summary synthesis."
              delay={0.5}
            />
            <FeatureCard 
              icon={<ShieldCheck />}
              title="Decoupled & Secure"
              desc="Your data is safe. Complex AI processing is strictly offloaded to our Python FastAPI server enforcing strict Firebase Bearer ID cryptographic token validation."
              delay={0.6}
            />
          </div>
        </div>
      </section>
      
      {/* Footer CTA */}
      <footer className="py-20 px-6 bg-surface text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <BrainCircuit className="w-16 h-16 text-primary mx-auto opacity-20" />
          <h2 className="text-3xl font-black text-primary font-headline">Ready to reclaim your time?</h2>
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
