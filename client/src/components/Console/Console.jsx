import { useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';

export default function Console({ outputs, highlighted }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputs.length]);

  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden transition-all duration-300 h-full ${highlighted === 'console' ? 'border-neon-yellow/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
        <Terminal size={14} className="text-text-muted" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-sub">Console</span>
        <span className="ml-auto bg-bg-secondary text-text-muted text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-border-subtle">{outputs.length}</span>
      </div>
      <div className="flex-1 p-3 overflow-y-auto font-mono">
        {outputs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-[10px] gap-1">
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
                <span className="text-neon-green text-[9px] select-none mt-[2px]">❯</span>
                <span className="text-[10px] text-text-main">{output}</span>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>
    </div>
  );
}
