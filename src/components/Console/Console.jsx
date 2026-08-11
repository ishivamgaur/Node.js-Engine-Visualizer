import { useRef, useEffect } from 'react';
import { Terminal, ChevronRight } from 'lucide-react';

export default function Console({ outputs, highlighted , onMaximize }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputs.length]);

  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden  h-full ${highlighted === 'console' ? 'border-neon-yellow/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
        <Terminal size={14} className="text-text-muted" />
        <span className="text-[13px] font-semibold uppercase tracking-wider text-text-sub">Console</span>
        <span className="ml-auto bg-bg-secondary text-text-muted text-[12px] font-bold px-1.5 py-0.5 rounded-sm border border-border-subtle">{outputs.length}</span>
      
        {onMaximize && (
          <button 
            onClick={onMaximize}
            className="ml-2 p-1 text-text-muted hover:text-text-main hover:bg-bg-secondary rounded "
            title="Maximize"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
          </button>
        )}
      </div>
      <div className="flex-1 p-3 overflow-y-auto font-mono">
        {outputs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-[13px] gap-1">
            <Terminal size={24} className="opacity-40 mb-1" />
            <span>No output yet</span>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {outputs.map((output, i) => (
              <div
                key={i}
                className="flex items-start gap-1.5 px-3 py-2 rounded bg-bg-secondary animate-fade-up"
              >
                <ChevronRight size={14} className="text-neon-green shrink-0 mt-[2px]" />
                <span className="text-[13px] text-text-main">{output}</span>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>
    </div>
  );
}
