import React, { useState, useRef, useMemo } from 'react';
import { Maximize, Type, ZoomIn, ZoomOut, Move, Network } from 'lucide-react';

export default function DomViewer({ dom, highlighted, onMaximize }) {
  const isHighlighted = highlighted === 'dom';
  const [viewMode, setViewMode] = useState('graph'); // 'text' | 'graph'
  
  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Compute Tree Layout
  const treeNodes = useMemo(() => {
    if (!dom || dom.length === 0) return { nodes: [], links: [] };

    const nodes = [];
    const links = [];
    const nodeW = 100;
    const nodeH = 40;
    
    // For left-to-right layout:
    const levelSpacing = 200; // Horizontal gap between parent and child
    const siblingSpacing = 60; // Vertical gap between siblings

    // Build hierarchy map
    const childrenMap = {};
    const nodeMap = {};
    dom.forEach(n => {
      nodeMap[n.id] = n;
      if (!childrenMap[n.id]) childrenMap[n.id] = [];
      if (n.parent) {
        if (!childrenMap[n.parent]) childrenMap[n.parent] = [];
        childrenMap[n.parent].push(n.id);
      } else if (n.children) {
        n.children.forEach(c => {
          if (!childrenMap[n.id]) childrenMap[n.id] = [];
          if (!childrenMap[n.id].includes(c)) childrenMap[n.id].push(c);
        });
      }
    });

    // Find root (usually 1, html)
    const root = dom.find(n => !n.parent) || dom[0];
    
    // Assign coordinates
    let currentY = 0;
    const assignCoords = (nodeId, depth) => {
      const children = childrenMap[nodeId] || [];
      const myY = currentY;
      
      const childrenCoords = [];
      children.forEach(c => {
        childrenCoords.push(assignCoords(c, depth + 1));
      });

      let finalY = myY;
      if (childrenCoords.length > 0) {
        finalY = (childrenCoords[0] + childrenCoords[childrenCoords.length - 1]) / 2;
      } else {
        currentY += siblingSpacing;
      }

      nodes.push({
        ...nodeMap[nodeId],
        x: depth * levelSpacing + 50, // Horizontal depth
        y: finalY + 50 // Vertical sibling position
      });

      return finalY;
    };

    if (root) assignCoords(root.id, 0);

    // Compute links
    nodes.forEach(n => {
      const children = childrenMap[n.id] || [];
      const numChildren = children.length;
      children.forEach((cId, idx) => {
        const childNode = nodes.find(cn => cn.id === cId);
        if (childNode) {
          links.push({
            source: n,
            target: childNode,
            sourceOffset: (40 / (numChildren + 1)) * (idx + 1)
          });
        }
      });
    });

    // Center the graph vertically and horizontally
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y));
    const height = maxY - minY;
    
    nodes.forEach(n => {
      n.y = n.y - minY + (300 - height / 2); // Roughly center vertically
    });

    return { nodes, links };
  }, [dom]);

  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden h-full ${isHighlighted ? 'border-neon-cyan/30 shadow-[0_0_20px_rgba(0,240,255,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle bg-bg-tertiary">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isHighlighted ? 'bg-neon-cyan' : 'bg-text-muted'}`} />
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Document Object Model</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setViewMode('text')} className={`p-1 rounded ${viewMode === 'text' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-text-muted hover:text-text-main'}`} title="Text View">
            <Type size={14} />
          </button>
          <button onClick={() => setViewMode('graph')} className={`p-1 rounded ${viewMode === 'graph' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-text-muted hover:text-text-main'}`} title="Graph View">
            <Network size={14} />
          </button>
          {onMaximize && (
            <button onClick={onMaximize} className="p-1 rounded text-text-muted hover:text-neon-cyan ml-2" title="Maximize View">
              <Maximize size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col">
        {(!dom || dom.length === 0) ? (
          <div className="flex items-center justify-center h-full text-text-muted text-[12px] italic">
            Waiting for HTML Parsing...
          </div>
        ) : viewMode === 'text' ? (
          <div className="p-3 overflow-y-auto font-mono text-[13px] flex-1">
            <div className="flex flex-col gap-1">
              {dom.map((node) => (
                <div key={node.id} className="ml-[10px] pl-2 border-l border-border-subtle">
                  <span className="text-neon-pink">&lt;{node.tag}</span>
                  {node.classes && node.classes.length > 0 && (
                    <span className="text-neon-yellow"> class="{node.classes.join(' ')}"</span>
                  )}
                  <span className="text-neon-pink">&gt;</span>
                  {node.text && <span className="text-text-main ml-2">{node.text.substring(0, 20)}{node.text.length > 20 ? '...' : ''}</span>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 relative bg-[#0d1117] overflow-hidden select-none"
               onMouseDown={handleMouseDown}
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
               onWheel={(e) => setScale(s => Math.min(Math.max(s - e.deltaY * 0.001, 0.3), 3))}>
            
            {/* Controls */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 bg-bg-panel border border-border-subtle rounded p-1 shadow-lg">
              <button onClick={() => setScale(s => Math.min(s + 0.2, 3))} className="p-1 hover:bg-bg-tertiary rounded text-text-muted"><ZoomIn size={14} /></button>
              <button onClick={() => setScale(s => Math.max(s - 0.2, 0.3))} className="p-1 hover:bg-bg-tertiary rounded text-text-muted"><ZoomOut size={14} /></button>
              <button onClick={() => { setScale(1); setPosition({x:0, y:0}); }} className="p-1 hover:bg-bg-tertiary rounded text-text-muted"><Move size={14} /></button>
            </div>

            {/* Canvas */}
            <div className="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing origin-top-left"
                 style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` }}>
              <svg className="absolute top-0 left-0 w-[4000px] h-[4000px] overflow-visible pointer-events-none">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b949e" />
                  </marker>
                </defs>
                {treeNodes.links.map((link, i) => (
                  <path key={i}
                    d={`M ${link.source.x + 50} ${link.source.y + link.sourceOffset} C ${link.source.x + 100} ${link.source.y + link.sourceOffset}, ${link.target.x - 100} ${link.target.y + 20}, ${link.target.x - 50} ${link.target.y + 20}`}
                    fill="none" stroke="#30363d" strokeWidth="2" markerEnd="url(#arrow)" />
                ))}
              </svg>
              {treeNodes.nodes.map(node => (
                <div key={node.id} 
                     className="absolute flex flex-col items-center justify-center bg-[#161b22] border border-[#30363d] rounded shadow-md pointer-events-auto hover:border-neon-cyan transition-colors"
                     style={{ 
                       left: node.x - 50, top: node.y, 
                       width: 100, height: 40,
                       boxShadow: node.tag === 'script' ? '0 0 10px rgba(255,165,0,0.2)' : '0 0 10px rgba(0,0,0,0.5)'
                     }}>
                  <span className="text-neon-cyan font-mono text-[12px] font-bold">&lt;{node.tag}&gt;</span>
                  {node.classes && node.classes.length > 0 && (
                    <span className="text-text-muted text-[10px] truncate w-full text-center px-1">.{node.classes[0]}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
