import { useMemo, useState } from 'react';
import { Repeat, Zap, Timer, ArrowRightLeft, CheckCircle2, Lock } from 'lucide-react';

const PHASES = [
  { name: 'Microtasks', color: '#a855f7', icon: <Zap size={18} />, desc: 'Promise.then(), process.nextTick() — runs between every phase', shortDesc: 'Promise.then, nextTick' },
  { name: 'Timers', color: '#ff6b35', icon: <Timer size={18} />, desc: 'Executes expired setTimeout() and setInterval() callbacks', shortDesc: 'setTimeout, setInterval' },
  { name: 'I/O Poll', color: '#00d4ff', icon: <ArrowRightLeft size={18} />, desc: 'Checks completed I/O: file reads, network, database queries', shortDesc: 'fs, http, database' },
  { name: 'Check', color: '#00ff88', icon: <CheckCircle2 size={18} />, desc: 'Executes setImmediate() callbacks after I/O polling', shortDesc: 'setImmediate' },
  { name: 'Close', color: '#f472b6', icon: <Lock size={18} />, desc: 'Handles close callbacks: socket.destroy(), server.close()', shortDesc: 'Close events' },
];

export default function EventLoop({ highlighted, currentAction, isPlaying }) {
  const [hoveredPhase, setHoveredPhase] = useState(-1);

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

  // 5 phases arranged in a circle (72° apart)
  const phaseAngleStep = 360 / 5;

  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden transition-all duration-300 h-full ${(!isComplete && highlighted === 'eventLoop') ? 'border-neon-cyan/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary z-10">
        <Repeat size={14} className="text-text-muted" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-sub">Event Loop</span>
        {isActive && (
          <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-sm border border-neon-green text-neon-green animate-pulse">
            ACTIVE
          </span>
        )}
        {isComplete && (
          <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-sm border border-text-muted text-text-muted">
            DONE
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Ring visualization — 5 phases */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden p-2">
          <div className="relative" style={{ width: 200, height: 200 }}>
            
            {/* SVG ring + arrows */}
            <svg width="200" height="200" className="absolute inset-0 pointer-events-none z-0">
              <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
              
              {PHASES.map((phase, i) => {
                const a1 = (i * phaseAngleStep - 90) * Math.PI / 180;
                const a2 = ((i + 1) % 5 * phaseAngleStep - 90) * Math.PI / 180;
                const radius = 78;
                const x1 = 100 + radius * Math.cos(a1);
                const y1 = 100 + radius * Math.sin(a1);
                const x2 = 100 + radius * Math.cos(a2);
                const y2 = 100 + radius * Math.sin(a2);
                const active = activePhase === i;
                const midAngle = ((i * phaseAngleStep + phaseAngleStep / 2) - 90) * Math.PI / 180;
                const arrowX = 100 + (radius + 1) * Math.cos(midAngle);
                const arrowY = 100 + (radius + 1) * Math.sin(midAngle);
                const arrowAngle = (i * phaseAngleStep + phaseAngleStep / 2);
                
                return (
                  <g key={i}>
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={active ? phase.color : 'rgba(255,255,255,0.08)'}
                      strokeWidth={active ? 2 : 1}
                      className="transition-all duration-300"
                    />
                    <g transform={`translate(${arrowX}, ${arrowY}) rotate(${arrowAngle})`}>
                      <polygon
                        points="-3,-2 3,0 -3,2"
                        fill={active ? phase.color : 'rgba(255,255,255,0.15)'}
                        className="transition-all duration-300"
                      />
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Center label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
              <div className={`text-[9px] font-bold transition-colors duration-300 ${isActive ? 'text-neon-cyan' : 'text-text-muted'}`}>
                Event Loop
              </div>
              {isComplete && (
                <div className="text-[7px] text-text-muted font-semibold mt-0.5">● Stopped</div>
              )}
            </div>

            {/* Phase nodes — 5 nodes around the ring */}
            {PHASES.map((phase, i) => {
              const angle = (i * phaseAngleStep - 90) * Math.PI / 180;
              const radius = 78;
              const x = 100 + radius * Math.cos(angle);
              const y = 100 + radius * Math.sin(angle);
              const active = activePhase === i;
              const hovered = hoveredPhase === i;
              return (
                <div
                  key={phase.name}
                  onMouseEnter={() => setHoveredPhase(i)}
                  onMouseLeave={() => setHoveredPhase(-1)}
                  className="absolute flex flex-col items-center justify-center rounded-full transition-all duration-300 cursor-pointer z-10"
                  style={{
                    left: x, top: y,
                    transform: `translate(-50%, -50%) scale(${active || hovered ? 1.15 : 1})`,
                    width: 46, height: 46,
                    background: active ? `${phase.color}22` : hovered ? `${phase.color}11` : 'var(--color-bg-tertiary)',
                    border: `2px solid ${active ? phase.color : hovered ? `${phase.color}88` : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: active ? `0 0 16px ${phase.color}44, 0 0 32px ${phase.color}22` : hovered ? `0 0 8px ${phase.color}22` : 'none',
                  }}
                >
                  <div className="mb-[1px] opacity-90">{phase.icon}</div>
                  <span
                    className="text-[6px] font-bold uppercase tracking-wide leading-none"
                    style={{ color: active || hovered ? phase.color : 'var(--color-text-muted)' }}
                  >
                    {phase.name}
                  </span>
                </div>
              );
            })}

            {/* Phase indicator dot — sits AT the active phase */}
            {isActive && (() => {
              let dotX = 100;
              let dotY = 100;
              let dotColor = 'var(--color-neon-cyan)';
              let dotShadow = '0 0 12px var(--color-neon-cyan), 0 0 24px rgba(0,212,255,0.4)';
              
              if (activePhase >= 0) {
                const angle = (activePhase * phaseAngleStep - 90) * Math.PI / 180;
                dotX = 100 + 78 * Math.cos(angle);
                dotY = 100 + 78 * Math.sin(angle);
                dotColor = PHASES[activePhase].color;
                dotShadow = `0 0 16px ${PHASES[activePhase].color}, 0 0 32px ${PHASES[activePhase].color}88`;
              }
              
              return (
                <div
                  className="absolute w-3 h-3 rounded-full z-20"
                  style={{
                    left: dotX,
                    top: dotY,
                    transform: 'translate(-50%, -50%)',
                    background: dotColor,
                    boxShadow: dotShadow,
                    transition: 'left 0.5s ease-in-out, top 0.5s ease-in-out, background 0.3s ease',
                  }}
                />
              );
            })()}
          </div>
        </div>

        {/* Info panel — shows phase details on hover or active */}
        <div className="shrink-0 border-t border-border-subtle bg-bg-tertiary/50 px-3 py-2">
          {displayPhase >= 0 ? (
            <div className="flex items-start gap-2">
              <div className="shrink-0 opacity-80 mt-1">{PHASES[displayPhase].icon}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold" style={{ color: PHASES[displayPhase].color }}>
                    {PHASES[displayPhase].name}
                  </span>
                  <span className="text-[8px] text-text-muted">({PHASES[displayPhase].shortDesc})</span>
                </div>
                <p className="text-[9px] text-text-sub leading-relaxed mt-0.5">{PHASES[displayPhase].desc}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-text-muted">
                {statusText} — <span className="text-text-sub">Hover a phase to learn more</span>
              </span>
            </div>
          )}
        </div>

        {/* Execution Order — always visible */}
        <div className="shrink-0 border-t border-border-subtle/50 bg-bg-secondary/30 px-3 py-1.5">
          <div className="text-[7px] font-bold uppercase tracking-widest text-text-muted mb-1">Execution Order</div>
          <div className="flex items-center gap-1 text-[8px] flex-wrap">
            {PHASES.map((phase, i) => (
              <span key={phase.name} className="contents">
                <span className={`px-1.5 py-0.5 rounded font-semibold transition-all duration-300 ${
                  activePhase === i 
                    ? 'border shadow-lg' 
                    : `opacity-40`
                }`}
                  style={activePhase === i ? {
                    background: `${phase.color}20`,
                    color: phase.color,
                    borderColor: `${phase.color}60`,
                    boxShadow: `0 0 8px ${phase.color}30`,
                  } : {
                    color: phase.color,
                  }}
                >
                  {['①','②','③','④','⑤'][i]} {phase.name}
                </span>
                {i < PHASES.length - 1 && <span className="text-text-muted/30">→</span>}
              </span>
            ))}
            <span className="text-text-muted/30">→ ↩</span>
          </div>
        </div>
      </div>
    </div>
  );
}
