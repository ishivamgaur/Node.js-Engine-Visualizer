import { Settings, Wrench, HelpCircle } from 'lucide-react';
import Tooltip from '../Tooltip';

export default function Libuv({ ops, highlighted, onMaximize }) {
  const threads = [0, 1, 2, 3];
  const activeThreads = new Set(ops.map(o => o.thread));

  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md h-full ${highlighted === 'libuv' ? 'border-neon-green/30 shadow-[0_0_20px_rgba(0,255,136,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary rounded-t-lg z-10">
        <Settings size={14} className="text-text-muted" />
        <Tooltip text="LIBUV THREAD POOL: Node.js uses this C++ library for heavy async I/O tasks like reading files, hashing passwords, or database queries.">
          <span className="text-[13px] font-semibold uppercase tracking-wider text-text-sub cursor-default">Libuv Thread Pool</span>
        </Tooltip>
        
        <Tooltip 
          icon={true}
          content={
            <>
              <span className="block font-bold text-neon-cyan mb-1 uppercase tracking-wider text-[11px]">4 Threads Default</span>
              Libuv has exactly 4 threads by default (UV_THREADPOOL_SIZE=4). If 5 heavy tasks (like reading files) arrive, the 5th task simply waits in a queue until one of the 4 threads finishes its current job!
            </>
          }
        />

        <span className="ml-auto bg-bg-secondary text-text-muted text-[12px] font-bold px-1.5 py-0.5 rounded-sm border border-border-subtle">{ops.length}</span>
      
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
      <div className="flex-1 p-3 overflow-y-auto flex flex-col justify-center rounded-b-lg bg-bg-panel relative z-0">
        {/* Thread pool grid */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {threads.map(t => {
            const busy = activeThreads.has(t);
            const op = ops.find(o => o.thread === t);
            return (
              <div
                key={t}
                className={`rounded border text-center transition-all duration-300 p-2 ${
                  busy
                    ? 'bg-neon-green/10 border-neon-green/30 shadow-[0_0_10px_rgba(0,255,136,0.1)]'
                    : 'bg-bg-tertiary border-border-subtle'
                }`}
              >
                <div className={`text-[11px] font-bold uppercase tracking-wider mb-0.5 ${busy ? 'text-neon-green' : 'text-text-muted'}`}>
                  Thread {t}
                </div>
                <div className={`w-2 h-2 rounded-full mx-auto mb-0.5 transition-all duration-300 ${
                  busy ? 'bg-neon-green shadow-[0_0_8px_rgba(0,255,136,0.5)] animate-thread-pulse' : 'bg-bg-secondary'
                }`} />
                {busy && op ? (
                  <div className="font-mono text-[11px] text-neon-green truncate">{op.name}</div>
                ) : (
                  <div className="text-[11px] text-text-muted">Idle</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Architecture label */}
        <div className="text-center mt-auto pt-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border-subtle bg-bg-tertiary">
            <Wrench size={10} className="text-text-muted" />
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">libuv - async I/O</span>
          </div>
        </div>
      </div>
    </div>
  );
}

