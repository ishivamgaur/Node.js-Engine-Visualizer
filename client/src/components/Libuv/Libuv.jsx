export default function Libuv({ ops, highlighted }) {
  const threads = [0, 1, 2, 3];
  const activeThreads = new Set(ops.map(o => o.thread));

  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden transition-all duration-300 h-full ${highlighted === 'libuv' ? 'border-neon-green/30 shadow-[0_0_20px_rgba(0,255,136,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
        <span className="text-xs">⚙️</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-sub">Libuv Thread Pool</span>
        <span className="ml-auto bg-bg-secondary text-text-muted text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-border-subtle">{ops.length}</span>
      </div>
      <div className="flex-1 p-3 overflow-y-auto flex flex-col justify-center">
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
                <div className={`text-[8px] font-bold uppercase tracking-wider mb-0.5 ${busy ? 'text-neon-green' : 'text-text-muted'}`}>
                  Thread {t}
                </div>
                <div className={`w-2 h-2 rounded-full mx-auto mb-0.5 transition-all duration-300 ${
                  busy ? 'bg-neon-green shadow-[0_0_8px_rgba(0,255,136,0.5)] animate-thread-pulse' : 'bg-bg-secondary'
                }`} />
                {busy && op ? (
                  <div className="font-mono text-[8px] text-neon-green truncate">{op.name}</div>
                ) : (
                  <div className="text-[8px] text-text-muted">Idle</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Architecture label */}
        <div className="text-center mt-auto pt-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border-subtle bg-bg-tertiary">
            <span className="text-[8px]">🔧</span>
            <span className="text-[8px] font-semibold text-text-muted uppercase tracking-wider">libuv - async I/O</span>
          </div>
        </div>
      </div>
    </div>
  );
}
