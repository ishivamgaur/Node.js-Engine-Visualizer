import { Box, Code, Database, Layers } from 'lucide-react';

export default function ExecutionContexts({ contexts , onMaximize }) {
  if (!contexts || contexts.length === 0) {
    return (
      <div className="flex flex-col h-full bg-bg-panel border border-border-subtle rounded-lg backdrop-blur-md overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
          <Layers size={14} className="text-neon-purple" />
          <span className="text-[13px] font-semibold uppercase tracking-wider text-text-sub">Execution Contexts</span>
        
        {onMaximize && (
          <button 
            onClick={onMaximize}
            className="ml-auto p-1 text-text-muted hover:text-text-main hover:bg-bg-secondary rounded "
            title="Maximize"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
          </button>
        )}
      </div>
        <div className="flex-1 flex items-center justify-center text-text-muted text-base">
          No active execution contexts
        </div>
      </div>
    );
  }

  // Helper to format values
  const formatValue = (val) => {
    if (val === undefined) return <span className="text-text-muted italic">undefined</span>;
    if (val === null) return <span className="text-neon-cyan">null</span>;
    if (typeof val === 'string') {
      if (val === '<uninitialized>') return <span className="text-neon-red font-semibold">&lt;uninitialized (TDZ)&gt;</span>;
      if (val.startsWith('[Function:')) return <span className="text-neon-yellow">{val}</span>;
      return <span className="text-neon-green">"{val}"</span>;
    }
    if (typeof val === 'number' || typeof val === 'boolean') {
      return <span className="text-neon-cyan">{String(val)}</span>;
    }
    if (typeof val === 'object') {
      return <span className="text-text-main">{JSON.stringify(val)}</span>;
    }
    return String(val);
  };

  return (
    <div className="flex flex-col h-full bg-bg-panel border border-border-subtle rounded-lg backdrop-blur-md overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary shrink-0">
        <Layers size={14} className="text-neon-purple" />
        <span className="text-[13px] font-semibold uppercase tracking-wider text-text-sub">Execution Contexts</span>
        <span className="ml-auto text-[12px] px-1.5 py-0.5 rounded bg-bg-secondary border border-border-subtle text-text-muted">
          Active: {contexts.length}
        </span>
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
      
      <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
        {/* Render contexts from top (most recent) to bottom (global) */}
        {[...contexts].reverse().map((ctx, idx) => (
          <div 
            key={idx} 
            className={`bg-bg-secondary border rounded-md overflow-hidden ${idx === 0 ? 'border-neon-purple shadow-[0_0_10px_rgba(168,85,247,0.15)]' : 'border-border-subtle opacity-90'}`}
          >
            {/* Context Header */}
            <div className={`flex items-center gap-2 px-2 py-1.5 border-b border-border-subtle ${idx === 0 ? 'bg-neon-purple/10' : 'bg-bg-tertiary'}`}>
              <Box size={12} className={idx === 0 ? 'text-neon-purple' : 'text-text-muted'} />
              <span className="font-mono text-[14px] font-bold text-text-main">
                {ctx.name}
              </span>
              {idx === 0 && (
                <span className="ml-auto text-[11px] uppercase tracking-wider text-neon-purple font-bold px-1.5 py-0.5 rounded bg-neon-purple/20">
                  Active
                </span>
              )}
            </div>

            {/* Variable Environment (Memory) */}
            <div className="p-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Database size={10} className="text-text-muted" />
                <span className="text-[12px] uppercase tracking-wide text-text-sub font-semibold">Memory (Variable Environment)</span>
              </div>
              
              {ctx.memory && Object.keys(ctx.memory).length > 0 ? (
                <div className="bg-[#0C0C14]/50 rounded border border-border-subtle p-1.5">
                  <table className="w-full text-left text-[13px] font-mono">
                    <tbody>
                      {Object.entries(ctx.memory).map(([key, data]) => (
                        <tr key={key} className="border-b border-border-subtle/50 last:border-0 hover:bg-bg-tertiary/30">
                          <td className="py-1 pr-2 w-1/4">
                            <span className={`text-[11px] mr-1.5 px-1 py-0.5 rounded ${
                              data.type === 'var' ? 'bg-neon-blue/20 text-neon-blue' :
                              data.type === 'let' ? 'bg-neon-green/20 text-neon-green' :
                              data.type === 'const' ? 'bg-neon-yellow/20 text-neon-yellow' :
                              'bg-neon-purple/20 text-neon-purple'
                            }`}>
                              {data.type}
                            </span>
                          </td>
                          <td className="py-1 pr-2 w-1/4 font-semibold text-text-main">{key}</td>
                          <td className="py-1 text-text-sub truncate max-w-[120px]" title={String(data.value)}>
                            {formatValue(data.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-[13px] text-text-muted italic px-1">Empty environment</div>
              )}
            </div>
            
            {/* Closure Scope Indication */}
            {ctx.outer && (
              <div className="px-2 pb-2">
                <div className="flex items-center gap-1.5 mt-1 border-t border-border-subtle/50 pt-1.5">
                  <Code size={10} className="text-text-muted" />
                  <span className="text-[12px] text-text-muted">
                    Outer Lexical Environment: <span className="font-mono text-text-sub">{ctx.outer}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
