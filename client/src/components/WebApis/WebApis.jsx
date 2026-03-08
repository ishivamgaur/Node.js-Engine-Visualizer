import { Globe, Timer, Radio } from 'lucide-react';

export default function WebApis({ apis, highlighted }) {
  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden transition-all duration-300 h-full ${highlighted === 'webApis' ? 'border-neon-pink/30 shadow-[0_0_20px_rgba(244,114,182,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
        <Globe size={14} className="text-text-muted" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-sub">Web / Node APIs</span>
        <span className="ml-auto bg-bg-secondary text-text-muted text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-border-subtle">{apis.length}</span>
      </div>
      <div className="flex-1 p-3 overflow-y-auto">
        {apis.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-[10px] gap-1 text-center">
            <Globe size={24} className="opacity-40 mb-1" />
            <span>No active APIs</span>
            <span className="text-[9px] opacity-70">fetch, setTimeout, fs.readFile</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {apis.map((api, i) => (
              <div
                key={`${api.name}-${i}`}
                className="animate-queue-slide rounded-sm px-3 py-1.5 bg-neon-pink/5 border border-neon-pink/10"
              >
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-3 h-3 text-text-muted">
                    {api.type === 'timer' ? <Timer size={12} /> : api.type === 'webapi' ? <Globe size={12} /> : <Radio size={12} />}
                  </span>
                  <span className="font-mono text-[10px] text-neon-pink font-medium truncate">{api.name}</span>
                </div>
                {api.type === 'timer' && (
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <div className="flex-1 h-0.5 bg-bg-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-neon-pink to-neon-orange rounded-full animate-thread-pulse" style={{ width: '60%' }} />
                    </div>
                    <span className="text-[8px] text-text-muted font-mono">{api.delay}ms</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
