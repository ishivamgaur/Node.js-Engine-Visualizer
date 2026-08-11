import React, { useMemo, useState } from 'react';
import { Repeat, Zap, Timer, ArrowRightLeft, CheckCircle2, Lock, HelpCircle, Minus, Plus, ArrowRight, ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';
import Tooltip from '../Tooltip';

const PHASES = [
  { name: 'Microtasks', color: '#a855f7', icon: <Zap size={18} />, desc: 'Promise.then(), process.nextTick() - runs between every phase', shortDesc: 'Promise.then, nextTick' },
  { name: 'Timers', color: '#ff6b35', icon: <Timer size={18} />, desc: 'Executes expired setTimeout() and setInterval() callbacks', shortDesc: 'setTimeout, setInterval' },
  { name: 'I/O Poll', color: '#00d4ff', icon: <ArrowRightLeft size={18} />, desc: 'Checks completed I/O: file reads, network, database queries', shortDesc: 'fs, http, database' },
  { name: 'Check', color: '#00ff88', icon: <CheckCircle2 size={18} />, desc: 'Executes setImmediate() callbacks after I/O polling', shortDesc: 'setImmediate' },
  { name: 'Close', color: '#f472b6', icon: <Lock size={18} />, desc: 'Handles close callbacks: socket.destroy(), server.close()', shortDesc: 'Close events' },
];

export default function EventLoop({ highlighted, currentAction, isPlaying , onMaximize }) {
  const [hoveredPhase, setHoveredPhase] = useState(-1);
  const [scale, setScale] = useState(1);

  // Detect which of the 5 phases is currently active from the simulator step
  const activePhase = useMemo(() => {
    if (!currentAction) return -1;
    const d = (currentAction.detail || '').toLowerCase();
    const a = (currentAction.action || '').toLowerCase();
    
    // ① Microtasks
    if (d.includes('① microtask') || d.includes('microtask') || a.includes('microtask') || d.includes('draining') || d.includes('promise') || d.includes('nexttick')) return 0;
    // ② Timers
    if (d.includes('② timer') || a.includes('timer') || d.includes('settimeout') || d.includes('setinterval') || d.includes('timer callback')) return 1;
    // ③ I/O Poll
    if (d.includes('③ i/o') || d.includes('poll') || a.includes('libuv') || d.includes('i/o')) return 2;
    // ④ Check
    if (d.includes('④ check') || d.includes('check phase') || d.includes('setimmediate')) return 3;
    // ⑤ Close
    if (d.includes('⑤ close') || d.includes('close phase') || d.includes('close callback')) return 4;
    return -1;
  }, [currentAction]);

  const isComplete = currentAction && currentAction.action === 'EXECUTION_COMPLETE';
  const isActive = !isComplete && (highlighted === 'eventLoop' || isPlaying);
  const displayPhase = hoveredPhase >= 0 ? hoveredPhase : activePhase >= 0 ? activePhase : -1;

  const statusText = useMemo(() => {
    if (isComplete) return 'Execution complete';
    if (!currentAction) return 'Waiting for code to run...';
    if (activePhase >= 0) return `Checking ${PHASES[activePhase].name}`;
    return 'Event loop is running...';
  }, [isComplete, currentAction, activePhase]);

  // Ultra-compact Phase Card (Libuv Style) with Icons
  const renderPhaseCard = (phaseIndex) => {
    const phase = PHASES[phaseIndex];
    const isHighlight = activePhase === phaseIndex || hoveredPhase === phaseIndex;
    
    return (
      <Tooltip 
        icon={false} 
        content={<><span style={{ color: phase.color }} className="font-bold">{phase.name}:</span> {phase.desc}</>}
        className="w-full h-full"
      >
        <div 
          onMouseEnter={() => setHoveredPhase(phaseIndex)}
          onMouseLeave={() => setHoveredPhase(-1)}
          className={`rounded border text-center transition-all duration-300 p-2 flex flex-col items-center justify-center cursor-default z-10 w-full h-full min-h-[58px] ${
            isHighlight
              ? 'bg-bg-panel scale-105 shadow-xl relative z-20'
              : 'bg-bg-tertiary border-border-subtle hover:bg-bg-secondary'
          }`}
          style={{
            borderColor: isHighlight ? phase.color : 'var(--color-border-subtle)',
            boxShadow: isHighlight ? `0 0 10px ${phase.color}40` : 'none'
          }}
        >
          <div style={{ color: isHighlight ? phase.color : 'var(--color-text-muted)' }} className={`mb-1 transition-transform duration-300 ${isHighlight ? 'scale-110' : 'scale-90'}`}>
            {phase.icon}
          </div>
          <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 leading-none`} style={{ color: isHighlight ? phase.color : 'var(--color-text-muted)' }}>
            {phase.name}
          </div>
          <div className={`w-2 h-2 rounded-full mx-auto transition-all duration-300 ${
            isHighlight ? 'animate-thread-pulse shadow-lg' : ''
          }`} style={{ 
            backgroundColor: isHighlight ? phase.color : 'var(--color-bg-secondary)',
            boxShadow: isHighlight ? `0 0 6px ${phase.color}` : 'none'
          }} />
        </div>
      </Tooltip>
    );
  };

  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md h-full min-h-0 ${(!isComplete && highlighted === 'eventLoop') ? 'border-neon-cyan/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary z-10 shrink-0 rounded-t-lg">
        <Repeat size={14} className="text-text-muted" />
        <span className="text-[13px] font-semibold uppercase tracking-wider text-text-sub">The Event Loop</span>
        
        <Tooltip 
          icon={true}
          content={
            <>
              <span className="block font-bold text-neon-cyan mb-1 uppercase tracking-wider text-[11px]">Priority Queue</span>
              <strong>Microtasks</strong> (Promises, nextTick) have highest priority. The engine will <em>always</em> empty the microtask queue completely before executing the next Macrotask or moving to the next phase.
            </>
          }
        />

        {isActive && (
          <span className="ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-sm border border-neon-green text-neon-green animate-pulse">
            ACTIVE
          </span>
        )}
        {isComplete && (
          <span className="ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-sm border border-text-muted text-text-muted">
            DONE
          </span>
        )}
      
        {onMaximize && (
          <button 
            onClick={onMaximize}
            className={`${(!isActive && !isComplete) ? 'ml-auto ' : 'ml-2 '}p-1 text-text-muted hover:text-text-main hover:bg-bg-secondary rounded`}
            title="Maximize"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
          </button>
        )}
      </div>

      <div className="flex-1 p-2 overflow-y-auto flex flex-col items-center justify-start rounded-b-lg bg-bg-panel relative z-0">
        {/* Status text at the top */}
        <div className="text-center mb-2 w-full">
          <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full border ${isActive ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30' : 'bg-bg-tertiary text-text-muted border-border-subtle'}`}>
            {statusText}
          </span>
        </div>

        {/* Compact Layout to avoid scrolling */}
        <div className="flex flex-col items-center w-full mx-auto mb-2 flex-1 min-h-0 justify-center">
          
          {/* Microtasks */}
          <div className="w-full max-w-[180px] mb-4 relative">
             <div className="absolute -left-2 top-1 bottom-1 w-0.5 rounded-full" style={{ backgroundColor: PHASES[0].color, opacity: (activePhase === 0 || hoveredPhase === 0) ? 1 : 0.3 }} />
             {renderPhaseCard(0)}
          </div>

          {/* 2x2 Grid Pipeline with Flow Arrows */}
          <div className="grid grid-cols-2 gap-5 w-full max-w-[280px] mx-auto relative px-3">
             <div className="w-full">{renderPhaseCard(1)}</div> {/* TL: Timers */}
             <div className="w-full">{renderPhaseCard(2)}</div> {/* TR: I/O Poll */}
             <div className="w-full">{renderPhaseCard(4)}</div> {/* BL: Close */}
             <div className="w-full">{renderPhaseCard(3)}</div> {/* BR: Check */}
             
             {/* Center Loop Icon */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-panel rounded-full p-1 border border-border-subtle shadow-sm z-30 opacity-70">
               <Repeat size={12} className="text-text-muted" />
             </div>

             {/* Flow Arrows */}
             {/* Top: Timers -> I/O */}
             <div className="absolute top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-border-subtle opacity-60 z-20">
               <ArrowRight size={14} />
             </div>
             {/* Right: I/O -> Check */}
             <div className="absolute top-1/2 right-[2px] translate-x-1/2 -translate-y-1/2 text-border-subtle opacity-60 z-20">
               <ArrowDown size={14} />
             </div>
             {/* Bottom: Check -> Close */}
             <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 translate-y-1/2 text-border-subtle opacity-60 z-20">
               <ArrowLeft size={14} />
             </div>
             {/* Left: Close -> Timers */}
             <div className="absolute top-1/2 left-[2px] -translate-x-1/2 -translate-y-1/2 text-border-subtle opacity-60 z-20">
               <ArrowUp size={14} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
