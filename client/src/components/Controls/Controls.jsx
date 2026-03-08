export default function Controls({
  isPlaying, play, pause, stepForward, stepBackward, reset,
  speed, setSpeed, currentStep, totalSteps, currentAction
}) {
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className="flex flex-col bg-bg-panel border border-border-subtle rounded-lg backdrop-blur-md overflow-hidden h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-tertiary">
        <span className="text-xs">🎮</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-sub">Controls</span>
        {totalSteps > 0 && (
          <span className="ml-auto text-[9px] font-mono text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded-sm border border-border-subtle">
            {currentStep + 1} / {totalSteps}
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1 justify-between">
        {/* Transport buttons */}
        <div className="flex items-center gap-1.5 justify-center">
          <button
            onClick={reset}
            className="w-7 h-7 flex items-center justify-center rounded bg-bg-tertiary border border-border-subtle text-text-sub hover:text-text-main hover:border-border-light transition-all duration-150 cursor-pointer text-xs"
            title="Reset"
          >⏮</button>
          <button
            onClick={stepBackward}
            className="w-7 h-7 flex items-center justify-center rounded bg-bg-tertiary border border-border-subtle text-text-sub hover:text-text-main hover:border-border-light transition-all duration-150 cursor-pointer text-xs"
            title="Step back"
          >⏪</button>
          <button
            onClick={isPlaying ? pause : play}
            className="w-9 h-9 flex items-center justify-center rounded-lg font-bold transition-all duration-200 cursor-pointer text-sm border-0"
            style={{
              background: isPlaying
                ? 'linear-gradient(135deg, #ff6b35, #cc5528)'
                : 'linear-gradient(135deg, #00ff88, #00cc6a)',
              color: '#000',
              boxShadow: isPlaying
                ? '0 0 15px rgba(255,107,53,0.3)'
                : '0 0 15px rgba(0,255,136,0.3)',
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={stepForward}
            className="w-7 h-7 flex items-center justify-center rounded bg-bg-tertiary border border-border-subtle text-text-sub hover:text-text-main hover:border-border-light transition-all duration-150 cursor-pointer text-xs"
            title="Step forward"
          >⏩</button>
        </div>

        {/* Progress bar */}
        {totalSteps > 0 && (
          <div className="w-full h-1 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--color-neon-cyan), var(--color-neon-purple))',
              }}
            />
          </div>
        )}

        {/* Speed control */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-text-muted font-semibold">SPEED</span>
          <input
            type="range" min="0.25" max="4" step="0.25"
            value={speed}
            onChange={e => setSpeed(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-neon-cyan cursor-pointer"
          />
          <span className="text-[9px] font-mono text-neon-cyan w-6 text-right">{speed}x</span>
        </div>

        {/* Current action display */}
        <div className="min-h-[50px]">
          {currentAction ? (
            <div className="px-2 py-1.5 rounded bg-bg-secondary border border-border-subtle animate-fade-up">
              <span className="text-[9px] font-bold text-neon-cyan font-mono block truncate">{currentAction.action}</span>
              <div className="text-[10px] text-text-main font-mono mt-0.5 truncate">{currentAction.detail}</div>
              {currentAction.phase && (
                <div className="text-[8px] text-text-muted mt-0.5 uppercase tracking-wider">
                  Phase: {currentAction.phase}
                </div>
              )}
            </div>
          ) : (
            <div className="px-2 py-1.5 rounded bg-bg-secondary/50 border border-border-subtle/50 h-full flex items-center justify-center">
              <span className="text-[9px] text-text-muted">No action</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
