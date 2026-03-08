import { Zap, Sparkles } from 'lucide-react';

export default function MicrotaskQueue({ queue, highlighted }) {
  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden transition-all duration-300 h-full ${highlighted === 'microtaskQueue' ? 'border-neon-purple/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
        <Zap size={14} className="text-text-muted" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-sub">Microtasks</span>
        <span className="ml-auto bg-bg-secondary text-text-muted text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-border-subtle">{queue.length}</span>
      </div>
      <div className="flex-1 p-3 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-[10px] gap-1 text-center">
            <Sparkles size={24} className="opacity-40 mb-1" />
            <span>No microtasks</span>
            <span className="text-[9px] opacity-70">Promise.then, nextTick</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {queue.map((task, i) => (
              <div
                key={`${task.name}-${i}`}
                className="font-mono text-[10px] font-medium px-3 py-0.5 rounded animate-queue-slide bg-neon-purple/10 text-neon-purple border-l-2 border-l-neon-purple truncate"
                title={task.name}
              >
                <span className="opacity-50 mr-1.5 text-[9px]">#{i + 1}</span>
                {task.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
