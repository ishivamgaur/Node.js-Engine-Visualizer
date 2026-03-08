import { useMemo, useState } from 'react';

const PHASES = [
  { name: 'Timers', color: '#ff6b35', icon: '⏱️', desc: 'Executes callbacks from setTimeout() and setInterval()', shortDesc: 'setTimeout, setInterval' },
  { name: 'Pending', color: '#fbbf24', icon: '⏳', desc: 'Handles deferred I/O callbacks from the previous cycle', shortDesc: 'I/O callbacks' },
  { name: 'Idle/Prepare', color: '#a855f7', icon: '💤', desc: 'Internal phase used by Node.js for housekeeping', shortDesc: 'Internal use' },
  { name: 'Poll', color: '#00d4ff', icon: '🔄', desc: 'Retrieves new I/O events and executes their callbacks', shortDesc: 'New I/O events' },
  { name: 'Check', color: '#00ff88', icon: '✅', desc: 'Executes setImmediate() callbacks after Poll phase', shortDesc: 'setImmediate' },
  { name: 'Close', color: '#f472b6', icon: '🔒', desc: 'Handles close event callbacks like socket.on("close")', shortDesc: 'Close callbacks' },
];

export default function EventLoop({ highlighted, currentAction, isPlaying }) {
  const [hoveredPhase, setHoveredPhase] = useState(-1);

  const activePhase = useMemo(() => {
    if (!currentAction) return -1;
    const d = (currentAction.detail || '').toLowerCase();
    const a = (currentAction.action || '').toLowerCase();
    if (a.includes('timer') || d.includes('settimeout') || d.includes('setinterval')) return 0;
    if (a.includes('pending')) return 1;
    if (a.includes('idle')) return 2;
    if (a.includes('poll') || a.includes('libuv') || d.includes('i/o')) return 3;
    if (a.includes('check') || d.includes('setimmediate')) return 4;
    if (a.includes('close')) return 5;
    if (a.includes('microtask') || d.includes('promise') || d.includes('nexttick')) return -2;
    return -1;
  }, [currentAction]);

  const isComplete = currentAction && currentAction.action === 'EXECUTION_COMPLETE';
  const isActive = !isComplete && (highlighted === 'eventLoop' || isPlaying);

  // Determine what to show in the info panel
  const displayPhase = hoveredPhase >= 0 ? hoveredPhase : activePhase >= 0 ? activePhase : -1;
  const isMicrotaskPhase = activePhase === -2;

  // Current status text
  const statusText = useMemo(() => {
    if (isComplete) return 'Execution complete';
    if (!currentAction) return 'Waiting for code to run...';
    if (isMicrotaskPhase) return 'Processing microtask queue...';
    if (activePhase >= 0) return `In ${PHASES[activePhase].name} phase`;
    return 'Event loop is running...';
  }, [isComplete, currentAction, isMicrotaskPhase, activePhase]);

  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden transition-all duration-300 h-full ${(!isComplete && highlighted === 'eventLoop') ? 'border-neon-cyan/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary z-10">
        <span className="text-xs">🔄</span>
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
        {/* Ring visualization */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden p-2">
          <div className="relative" style={{ width: 200, height: 200 }}>
            
            {/* SVG ring + arrows */}
            <svg width="200" height="200" className="absolute inset-0 pointer-events-none z-0">
              {/* Circular track */}
              <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
              
              {/* Directional arc arrows between phases */}
              {PHASES.map((phase, i) => {
                const a1 = (i * 60 - 90) * Math.PI / 180;
                const a2 = ((i + 1) % 6 * 60 - 90) * Math.PI / 180;
                const radius = 78;
                const x1 = 100 + radius * Math.cos(a1);
                const y1 = 100 + radius * Math.sin(a1);
                const x2 = 100 + radius * Math.cos(a2);
                const y2 = 100 + radius * Math.sin(a2);
                const active = activePhase === i;
                const midAngle = ((i * 60 + 30) - 90) * Math.PI / 180;
                const arrowX = 100 + (radius + 1) * Math.cos(midAngle);
                const arrowY = 100 + (radius + 1) * Math.sin(midAngle);
                const arrowAngle = (i * 60 + 30);
                
                return (
                  <g key={i}>
                    {/* Connection line */}
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={active ? phase.color : 'rgba(255,255,255,0.08)'}
                      strokeWidth={active ? 2 : 1}
                      className="transition-all duration-300"
                    />
                    {/* Directional arrow */}
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
              {isMicrotaskPhase && (
                <div className="text-[7px] text-neon-purple font-semibold mt-0.5 animate-pulse">
                  ⚡ Microtasks
                </div>
              )}
              {isComplete && (
                <div className="text-[7px] text-text-muted font-semibold mt-0.5">
                  ● Stopped
                </div>
              )}
            </div>

            {/* Phase nodes */}
            {PHASES.map((phase, i) => {
              const angle = (i * 60 - 90) * Math.PI / 180;
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
                  <span className="text-[11px] mb-[1px]">{phase.icon}</span>
                  <span
                    className="text-[6px] font-bold uppercase tracking-wide leading-none"
                    style={{ color: active || hovered ? phase.color : 'var(--color-text-muted)' }}
                  >
                    {phase.name}
                  </span>
                </div>
              );
            })}

            {/* Orbiting dot */}
            {isActive && (
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-neon-cyan animate-orbit z-20"
                style={{
                  top: '50%', left: '50%',
                  marginLeft: -5, marginTop: -5,
                  boxShadow: '0 0 12px var(--color-neon-cyan), 0 0 24px rgba(0,212,255,0.4)',
                }}
              />
            )}
          </div>
        </div>

        {/* Info panel — shows phase details on hover or active */}
        <div className="shrink-0 border-t border-border-subtle bg-bg-tertiary/50 px-3 py-2">
          {displayPhase >= 0 ? (
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">{PHASES[displayPhase].icon}</span>
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
          ) : isMicrotaskPhase ? (
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">⚡</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-neon-purple">Microtask Checkpoint</span>
                </div>
                <p className="text-[9px] text-text-sub leading-relaxed mt-0.5">
                  Between each phase, Node.js drains the microtask queue (Promise.then, process.nextTick) before proceeding.
                </p>
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
      </div>
    </div>
  );
}
