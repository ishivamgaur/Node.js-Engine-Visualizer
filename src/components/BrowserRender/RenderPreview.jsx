import React from 'react';
import { Maximize, Monitor } from 'lucide-react';

export default function RenderPreview({ phase, htmlContent = '', highlighted, onMaximize }) {
  const isHighlighted = highlighted === 'preview';
  // Determine visibility states based on phase
  const isStarted = phase && phase !== 'IDLE' && phase !== 'PARSING_HTML' && phase !== 'PARSING_CSS' && phase !== 'STYLE_CALCULATION';
  const hasLayout = phase === 'LAYOUT' || phase === 'PAINT' || phase === 'COMPOSITE' || phase === 'FINISHED';
  const hasPaint = phase === 'PAINT' || phase === 'COMPOSITE' || phase === 'FINISHED';
  
  // Create a modified HTML string for the wireframe phase
  // Using outline instead of border preserves the exact box model dimensions!
  const wireframeStyles = `
    <style>
      * { 
        color: transparent !important; 
        background-color: transparent !important; 
        border-color: transparent !important; 
        box-shadow: none !important;
        outline: 1px dashed #007bff !important;
        outline-offset: -1px;
      }
      img, svg, canvas, video {
        visibility: hidden !important;
      }
    </style>
  `;
  
  const globalIframeStyles = `
    <style>
      ::-webkit-scrollbar { display: none; }
      html, body { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
  `;
  
  let displayHtml = htmlContent;
  if (displayHtml.includes('</head>')) {
    displayHtml = displayHtml.replace('</head>', `${globalIframeStyles}</head>`);
  }
  
  if (!hasPaint && hasLayout) {
    displayHtml = displayHtml.replace('</head>', `${wireframeStyles}</head>`);
  }

  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden h-full ${isHighlighted ? 'border-neon-green/30 shadow-[0_0_20px_rgba(0,255,136,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle bg-bg-tertiary">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-text-muted" />
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Visual Output Preview</span>
        </div>
        {onMaximize && (
          <button onClick={onMaximize} className="p-1 rounded text-text-muted hover:text-white" title="Maximize View">
            <Maximize size={14} />
          </button>
        )}
      </div>
      
      <div className="flex-1 bg-[#1a1a2e] relative overflow-hidden flex items-center justify-center p-4">
        {!isStarted && (
          <div className="text-text-muted/50 text-[12px] italic">Awaiting Layout...</div>
        )}
        
        {/* Rendered Browser Viewport */}
        {isStarted && (
          <div className="w-full h-full bg-white relative rounded shadow-2xl overflow-hidden transition-opacity duration-500" 
               style={{ opacity: hasLayout ? 1 : 0 }}>
            
            <iframe 
              srcDoc={displayHtml}
              className="w-full h-full border-0 transition-transform duration-700"
              style={{
                transform: hasLayout ? 'scale(1)' : 'scale(0.8)',
                opacity: hasLayout ? 1 : 0
              }}
              title="Browser Preview"
              sandbox="allow-scripts"
            />
          </div>
        )}
      </div>
    </div>
  );
}
