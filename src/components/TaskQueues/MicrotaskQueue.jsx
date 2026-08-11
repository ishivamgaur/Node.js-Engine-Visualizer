import { Zap, Sparkles } from 'lucide-react';
import Tooltip from '../Tooltip';

export default function MicrotaskQueue({ queue, highlighted , onMaximize }) {
  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden  h-full ${highlighted === 'microtaskQueue' ? 'border-neon-purple/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
        <Zap size={14} className="text-text-muted" />
        <Tooltip text="HIGHEST PRIORITY: Microtasks (Promises, nextTick) are processed before any other queue or event loop phase. The Event Loop will drain this queue entirely before moving on.">
          <span className="text-[13px] font-semibold uppercase tracking-wider text-text-sub cursor-default">Microtasks</span>
        </Tooltip>
        <span className="ml-auto bg-bg-secondary text-text-muted text-[12px] font-bold px-1.5 py-0.5 rounded-sm border border-border-subtle">{queue.length}</span>
      
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
      <div className="flex-1 p-3 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-[13px] gap-1 text-center">
            <Sparkles size={24} className="opacity-40 mb-1" />
            <span>No microtasks</span>
            <span className="text-[12px] opacity-70">Promise.then, nextTick</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {queue.map((task, i) => (
              <div
                key={`${task.name}-${i}`}
                className="font-mono text-[13px] font-medium px-3 py-0.5 rounded animate-queue-slide bg-neon-purple/10 text-neon-purple border-l-2 border-l-neon-purple truncate"
                title={task.name}
              >
                <span className="opacity-50 mr-1.5 text-[12px]">#{i + 1}</span>
                {task.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

