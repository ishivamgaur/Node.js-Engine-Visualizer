import { useMemo } from 'react';

const PHASES = [
  { name: 'Timers', color: '#ff6b35', icon: '⏱️', desc: 'setTimeout, setInterval' },
  { name: 'Pending', color: '#fbbf24', icon: '⏳', desc: 'I/O callbacks' },
  { name: 'Idle', color: '#a855f7', icon: '💤', desc: 'Internal use' },
  { name: 'Poll', color: '#00d4ff', icon: '🔄', desc: 'New I/O events' },
  { name: 'Check', color: '#00ff88', icon: '✅', desc: 'setImmediate' },
  { name: 'Close', color: '#f472b6', icon: '🔒', desc: 'Close callbacks' },
];

export default function EventLoop({ highlighted, currentAction, isPlaying }) {
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

  return (
    <div className={`flex flex-col bg-bg-panel border rounded-lg backdrop-blur-md overflow-hidden transition-all duration-300 h-full ${(!isComplete && highlighted === 'eventLoop') ? 'border-neon-cyan/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]' : 'border-border-subtle'}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary z-10">
        <span className="text-xs">🔄</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-sub">Event Loop</span>
        {isActive && (
          <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-sm border border-neon-green text-neon-green">
            ACTIVE
          </span>
        )}
      </div>
      <div className="flex-1 p-3 flex items-center justify-center relative overflow-hidden">
        <div className="relative" style={{ width: 180, height: 180 }}>
          {/* Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
            <div className={`text-[10px] font-bold transition-colors duration-300 ${isActive ? 'text-neon-cyan' : 'text-text-muted'}`}>
              Event Loop
            </div>
            {activePhase === -2 && (
              <div className="text-[8px] text-neon-purple font-semibold mt-0.5 animate-pulse">Microtasks</div>
            )}
          </div>

          {/* Phase nodes */}
          {PHASES.map((phase, i) => {
            const angle = (i * 60 - 90) * Math.PI / 180;
            const radius = 75;
            const x = 90 + radius * Math.cos(angle);
            const y = 90 + radius * Math.sin(angle);
            const active = activePhase === i;
            return (
              <div
                key={phase.name}
                title={`${phase.name}: ${phase.desc}`}
                className="absolute flex flex-col items-center justify-center rounded-full transition-all duration-400 cursor-default z-10"
                style={{
                  left: x, top: y,
                  transform: 'translate(-50%, -50%)',
                  width: 44, height: 44,
                  background: active ? `${phase.color}22` : 'var(--color-bg-tertiary)',
                  border: `2px solid ${active ? phase.color : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: active ? `0 0 16px ${phase.color}44` : 'none',
                }}
              >
                <span className="text-[11px] mb-[1px]">{phase.icon}</span>
                <span
                  className="text-[6px] font-bold uppercase tracking-wide leading-none"
                  style={{ color: active ? phase.color : 'var(--color-text-muted)' }}
                >
                  {phase.name}
                </span>
              </div>
            );
          })}

          {/* Connecting lines */}
          <svg width="180" height="180" className="absolute inset-0 pointer-events-none z-0">
            {PHASES.map((phase, i) => {
              const a1 = (i * 60 - 90) * Math.PI / 180;
              const a2 = ((i + 1) % 6 * 60 - 90) * Math.PI / 180;
              const radius = 75;
              return (
                <line
                  key={i}
                  x1={90 + radius * Math.cos(a1)} y1={90 + radius * Math.sin(a1)}
                  x2={90 + radius * Math.cos(a2)} y2={90 + radius * Math.sin(a2)}
                  stroke={activePhase === i ? phase.color : 'rgba(255,255,255,0.06)'}
                  strokeWidth={activePhase === i ? 2 : 1}
                  strokeDasharray={activePhase === i ? 'none' : '4,4'}
                  className="transition-all duration-400"
                />
              );
            })}
          </svg>

          {/* Orbiting dot */}
          {isActive && (
            <div
              className="absolute w-2 h-2 rounded-full bg-neon-cyan animate-orbit z-20"
              style={{
                top: '50%', left: '50%',
                marginLeft: -4, marginTop: -4,
                boxShadow: '0 0 12px var(--color-neon-cyan), 0 0 24px rgba(0,212,255,0.4)',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
