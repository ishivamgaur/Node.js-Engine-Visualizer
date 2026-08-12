import React from 'react';
import { Maximize } from 'lucide-react';

export default function RenderPipeline({ phase, highlighted, onMaximize }) {
  const isHighlighted = highlighted === 'pipeline';
  
  const phases = [
    { id: 'PARSING_HTML', name: 'HTML Parsing', desc: 'Building DOM' },
    { id: 'PARSING_CSS', name: 'CSS Parsing', desc: 'Building CSSOM' },
    { id: 'STYLE_CALCULATION', name: 'Style', desc: 'Render Tree' },
    { id: 'LAYOUT', name: 'Layout', desc: 'Reflow Geometry' },
    { id: 'PAINT', name: 'Paint', desc: 'Rasterizing Pixels' },
    { id: 'COMPOSITE', name: 'Composite', desc: 'GPU Draw' }
  ];

  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden h-full ${isHighlighted ? 'border-neon-orange/30 shadow-[0_0_20px_rgba(255,165,0,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle bg-bg-tertiary">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isHighlighted ? 'bg-neon-orange animate-pulse' : 'bg-text-muted'}`} />
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Pixel Pipeline Tracker</span>
        </div>
        {onMaximize && (
          <button onClick={onMaximize} className="p-1 rounded text-text-muted hover:text-neon-orange" title="Maximize View">
            <Maximize size={14} />
          </button>
        )}
      </div>
      <div className="p-3 overflow-y-auto flex-1 flex flex-col justify-center">
        <div className="flex flex-col gap-2 relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[15px] top-[10px] bottom-[10px] w-0.5 bg-border-subtle z-0"></div>
          
          {phases.map((p, i) => {
            const isActive = phase === p.id;
            const isPassed = phases.findIndex(x => x.id === phase) > i || phase === 'IDLE';
            
            return (
              <div key={p.id} className="flex items-center gap-4 relative z-10">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-bg-panel transition-colors ${
                  isActive ? 'border-neon-orange text-neon-orange shadow-[0_0_10px_rgba(255,165,0,0.5)]' : 
                  isPassed ? 'border-neon-green text-neon-green' : 
                  'border-border-subtle text-text-muted'
                }`}>
                  {isPassed && !isActive ? '✓' : i + 1}
                </div>
                <div className={`flex flex-col ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  <span className={`text-[13px] font-bold ${isActive ? 'text-neon-orange' : isPassed ? 'text-text-main' : 'text-text-muted'}`}>
                    {p.name}
                  </span>
                  <span className="text-[11px] text-text-muted">{p.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
