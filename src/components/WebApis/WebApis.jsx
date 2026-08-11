import { Globe, Timer, Radio } from 'lucide-react';
import Tooltip from '../Tooltip';

export default function WebApis({ apis, highlighted , onMaximize }) {
  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden  h-full ${highlighted === 'webApis' ? 'border-neon-pink/30 shadow-[0_0_20px_rgba(244,114,182,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
        <Globe size={14} className="text-text-muted" />
        <Tooltip text="WEB / NODE APIs: Background threads provided by the environment (like fetch, setTimeout). They do work asynchronously without blocking the main Call Stack.">
          <span className="text-[13px] font-semibold uppercase tracking-wider text-text-sub cursor-default">Web / Node APIs</span>
        </Tooltip>
        <span className="ml-auto bg-bg-secondary text-text-muted text-[12px] font-bold px-1.5 py-0.5 rounded-sm border border-border-subtle">{apis.length}</span>
      
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
        {apis.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-[13px] gap-1 text-center">
            <Globe size={24} className="opacity-40 mb-1" />
            <span>No active APIs</span>
            <span className="text-[12px] opacity-70">fetch, setTimeout, fs.readFile</span>
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
                  <span className="font-mono text-[13px] text-neon-pink font-medium truncate">{api.name}</span>
                </div>
                {api.type === 'timer' && (
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <div className="flex-1 h-0.5 bg-bg-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-neon-pink to-neon-orange rounded-full animate-thread-pulse" style={{ width: '60%' }} />
                    </div>
                    <span className="text-[11px] text-text-muted font-mono">{api.delay}ms</span>
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

