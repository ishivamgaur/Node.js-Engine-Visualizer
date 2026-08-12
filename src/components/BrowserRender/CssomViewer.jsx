import React from 'react';
import { Maximize } from 'lucide-react';

export default function CssomViewer({ cssom, highlighted, onMaximize }) {
  const isHighlighted = highlighted === 'cssom';
  
  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden h-full ${isHighlighted ? 'border-neon-purple/30 shadow-[0_0_20px_rgba(180,0,255,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle bg-bg-tertiary">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isHighlighted ? 'bg-neon-purple' : 'bg-text-muted'}`} />
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">CSS Object Model</span>
        </div>
        {onMaximize && (
          <button onClick={onMaximize} className="p-1 rounded text-text-muted hover:text-neon-purple" title="Maximize View">
            <Maximize size={14} />
          </button>
        )}
      </div>
      <div className="p-3 overflow-y-auto font-mono text-[13px] flex-1">
        {cssom && cssom.length > 0 ? (
          <div className="flex flex-col gap-2">
            {cssom.map((node, i) => (
              <div key={i} className="flex flex-col bg-bg-secondary p-2 rounded border border-border-subtle">
                <span className="text-neon-cyan">{node.selector} <span className="text-text-muted">{'{'}</span></span>
                {Object.entries(node.rules).map(([key, val]) => (
                  <div key={key} className="ml-4">
                    <span className="text-neon-pink">{key}</span>
                    <span className="text-text-muted">: </span>
                    <span className="text-neon-yellow">{val}</span>
                    <span className="text-text-muted">;</span>
                  </div>
                ))}
                <span className="text-text-muted">{'}'}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted text-[12px] italic">
            Waiting for CSS Parsing...
          </div>
        )}
      </div>
    </div>
  );
}
